import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { buildRealm } from "./realm";
import { arch, cameraAt, doorOpen, doors, fbm, landHeight, moods, obstacles, seeded, zoneAt, zones } from "./world";

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const ENCLOSED = new Set(["discipline", "expression"]);

const TIERS = {
  full: { dpr: 1.6, shadows: true, maps: ["diff", "rough", "nor"], land: [220, 110], bloom: true },
  lite: { dpr: 1.25, shadows: false, maps: ["diff", "nor"], land: [130, 70], bloom: false },
  minimal: { dpr: 0.5, shadows: false, maps: ["diff"], land: [80, 45], bloom: false },
};

// World-space texture coordinates, so one material tiles evenly across
// objects of any size (a box 2 m or 200 m wide shows stone at the same scale).
function worldUV(geo, unit) {
  const p = geo.attributes.position;
  const n = geo.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    let u;
    let v;
    if (ax >= ay && ax >= az) [u, v] = [p.getZ(i), p.getY(i)];
    else if (ay >= az) [u, v] = [p.getX(i), p.getZ(i)];
    else [u, v] = [p.getX(i), p.getY(i)];
    uv[i * 2] = u / unit;
    uv[i * 2 + 1] = v / unit;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
}

// The final grade: shading where the words sit, a soft vignette, fine grain.
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uShade: { value: new THREE.Vector4() }, uCenter: { value: 0 }, uGrain: { value: 0.025 } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime; uniform vec4 uShade; uniform float uCenter; uniform float uGrain;
    varying vec2 vUv;
    float rnd(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      // Roll off the brightest light (a low sun, its halo) so it glows rather than burns white.
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c *= 1.0 / (1.0 + max(l - 0.8, 0.0) * 1.1);
      float s = 1.0;
      s *= 1.0 - uShade.x * smoothstep(0.7, 0.0, vUv.x);
      s *= 1.0 - uShade.y * smoothstep(0.3, 1.0, vUv.x);
      s *= 1.0 - uShade.z * smoothstep(0.55, 1.0, vUv.y);
      s *= 1.0 - uShade.w * smoothstep(0.5, 0.0, vUv.y);
      s *= 1.0 - uCenter * smoothstep(0.55, 0.0, distance(vUv, vec2(0.5)));
      c *= s;
      c *= mix(1.0, smoothstep(1.2, 0.3, distance(vUv, vec2(0.5))), 0.32);
      c += (rnd(vUv * 1000.0 + uTime) - 0.5) * uGrain;
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export function createDoorsScene(canvas, { lite = false, minimal = false, reducedMotion = false, onReady } = {}) {
  const tier = TIERS[minimal ? "minimal" : lite ? "lite" : "full"];
  const rand = seeded(9);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  let dpr = Math.min(window.devicePixelRatio || 1, tier.dpr);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = tier.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const fog = new THREE.FogExp2(0x0d0c0b, 0.006);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 12000);
  const owned = [];
  const own = (x) => (owned.push(x), x);

  // ---- Materials: photographed surfaces (Poly Haven, CC0) -----------------
  const loader = new THREE.TextureLoader();
  const tex = (name, kind) => {
    if (!tier.maps.includes(kind)) return null;
    const t = loader.load(`/assets/doors/tex/${name}_${kind}.webp`, undefined, undefined, () => {});
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    if (kind === "diff") t.colorSpace = THREE.SRGBColorSpace;
    return own(t);
  };
  const surface = (name, opts = {}) =>
    own(
      new THREE.MeshStandardMaterial({
        map: tex(name, "diff"),
        roughnessMap: tex(name, "rough"),
        normalMap: tex(name, "nor"),
        normalScale: new THREE.Vector2(1, 1),
        ...opts,
      }),
    );
  const M = {
    stone: surface("large_sandstone_blocks", { color: 0xd9cdb8, roughness: 1 }),
    darkStone: surface("large_sandstone_blocks", { color: 0x6b6258, roughness: 1 }),
    granite: surface("granite_tile", { color: 0x8c8780, roughness: 0.55, metalness: 0.05 }),
    darkGranite: surface("granite_tile", { color: 0x2e2b28, roughness: 0.38, metalness: 0.1 }),
    rock: surface("rock_face", { color: 0xb3a592, roughness: 1 }),
    bronze: surface("metal_plate", { color: 0xb38a56, metalness: 1, roughness: 0.75 }),
    steel: surface("metal_plate", { color: 0x9aa0a8, metalness: 1, roughness: 0.7 }),
    concrete: surface("concrete_slab_wall", { color: 0xcfcac2, roughness: 1 }),
    marble: surface("marble_01", { color: 0xf1ebe1, roughness: 0.6 }),
    glass: own(new THREE.MeshPhysicalMaterial({ color: 0x0e141b, metalness: 0.9, roughness: 0.1, clearcoat: 1 })),
    ceiling: own(new THREE.MeshStandardMaterial({ color: 0x090807, roughness: 1 })),
    wood: surface("concrete_slab_wall", { color: 0x5a3a22, roughness: 0.7 }),
    land: null,
  };
  // Lit windows for the glass towers: rows of warm light, drawn once.
  {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = "#000";
    g.fillRect(0, 0, 64, 256);
    for (let y = 0; y < 256; y += 8) for (let x = 0; x < 64; x += 8) if (rand() < 0.32) {
      g.fillStyle = `rgba(255,${200 + rand() * 40},${140 + rand() * 50},${0.4 + rand() * 0.6})`;
      g.fillRect(x + 1, y + 2, 6, 4);
    }
    const w = own(new THREE.CanvasTexture(c));
    w.colorSpace = THREE.SRGBColorSpace;
    w.wrapS = w.wrapT = THREE.RepeatWrapping;
    M.glass.emissiveMap = w;
    M.glass.emissive = new THREE.Color(0xffd9a8);
    M.glass.emissiveIntensity = 1.1;
  }
  const glow = (hex, k = 1) => own(new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false }));

  const box = (w, h, d, mat, x, y, z, unit = 4) => {
    const geo = own(worldUV(new THREE.BoxGeometry(w, h, d), unit));
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = tier.shadows;
    return m;
  };

  // ---- Sky, light and reflections ------------------------------------------
  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);
  const su = sky.material.uniforms;
  su.mieCoefficient.value = 0.003;
  su.mieDirectionalG.value = 0.72;
  su.cloudDensity.value = 0.5;
  su.cloudElevation.value = 0.5;

  const sun = new THREE.DirectionalLight(0xffe9cf, 3);
  sun.castShadow = tier.shadows;
  if (tier.shadows) {
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = sc.bottom = -170;
    sc.right = sc.top = 170;
    sc.near = 1;
    sc.far = 900;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.6;
  }
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xdfe6f0, 0x3a3027, 0.5);
  scene.add(hemi);

  // Reflections: each open space reflects its own sky; interiors a dim room.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const sunDir = (m) => new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - m.elevation), THREE.MathUtils.degToRad(m.azimuth));
  const envs = {};
  if (!minimal) {
    const roomEnv = own(pmrem.fromScene(new RoomEnvironment(), 0.04).texture);
    for (const z of zones) {
      const m = moods[z.id];
      if (!m.sky || ENCLOSED.has(z.id)) {
        envs[z.id] = roomEnv;
        continue;
      }
      const s = new Sky();
      s.scale.setScalar(1000);
      s.material.uniforms.sunPosition.value.copy(sunDir(m));
      s.material.uniforms.turbidity.value = m.turbidity;
      s.material.uniforms.cloudCoverage.value = 0;
      const es = new THREE.Scene();
      es.add(s);
      envs[z.id] = own(pmrem.fromScene(es).texture);
      s.geometry.dispose();
      s.material.dispose();
    }
  }
  pmrem.dispose();

  // ---- The spaces ----------------------------------------------------------
  const groups = zones.map((z) => {
    const g = new THREE.Group();
    g.name = z.id;
    scene.add(g);
    return g;
  });
  const G = Object.fromEntries(zones.map((z, i) => [z.id, groups[i]]));
  const solids = obstacles();

  // A wall that seals one space from the next, with its opening.
  function wall(k, width, height, thick, mat, unit) {
    const d = doors[k];
    const g = new THREE.Group();
    const side = (width - d.width) / 2;
    g.add(box(side, height, thick, mat, -(d.width / 2 + side / 2), height / 2, 0, unit));
    g.add(box(side, height, thick, mat, d.width / 2 + side / 2, height / 2, 0, unit));
    g.add(box(d.width, height - d.height, thick, mat, 0, d.height + (height - d.height) / 2, 0, unit));
    return g;
  }

  // A cliff face: three rough rock sheets around the opening, with a jagged crest.
  function cliff(k, height) {
    const d = doors[k];
    const g = new THREE.Group();
    const sheet = (x0, x1, y0, y1) => {
      const w = x1 - x0;
      const h = y1 - y0;
      const geo = new THREE.PlaneGeometry(w, h, Math.max(4, Math.round(w / 6)), Math.max(4, Math.round(h / 6)));
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i) + (x0 + x1) / 2;
        const y = p.getY(i) + (y0 + y1) / 2;
        const near = smooth(d.width / 2 + 2, d.width / 2 + 30, Math.abs(x)) + smooth(d.height + 2, d.height + 30, y);
        const bulge = (fbm(x * 0.03 + k * 7, y * 0.03, 5) - 0.45) * 26 * clamp01(near);
        const crest = y > height - 40 ? (fbm(x * 0.02 + k, 3.3, 4) - 0.5) * 90 : 0;
        p.setXYZ(i, x, y + (y > height - 6 ? crest : 0), bulge);
      }
      geo.computeVertexNormals();
      const uv = new Float32Array(p.count * 2);
      for (let i = 0; i < p.count; i++) {
        uv[i * 2] = p.getX(i) / 14;
        uv[i * 2 + 1] = p.getY(i) / 14;
      }
      geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      const m = new THREE.Mesh(own(geo), M.rock);
      m.castShadow = m.receiveShadow = tier.shadows;
      g.add(m);
    };
    const W = 900;
    sheet(-W, -d.width / 2, 0, height);
    sheet(d.width / 2, W, 0, height);
    sheet(-d.width / 2, d.width / 2, d.height, height);
    // A cut-stone portal set into the rock, so the door belongs to it.
    g.add(box(2.6, d.height + 3, 4, M.darkStone, -d.width / 2 - 1.3, (d.height + 3) / 2, 0.8));
    g.add(box(2.6, d.height + 3, 4, M.darkStone, d.width / 2 + 1.3, (d.height + 3) / 2, 0.8));
    g.add(box(d.width + 5.2, 3, 4, M.darkStone, 0, d.height + 1.5, 0.8));
    return g;
  }

  // The leaves of a door, and how they move.
  function leaves(k, mat) {
    const d = doors[k];
    const g = new THREE.Group();
    const parts = [];
    const relief = (leaf, w, h, inner = 0) => {
      // Raised panels on the face that meets the visitor: two columns of
      // framed fields, with a raised centre in each.
      const rows = h > 20 ? 4 : 3;
      const cols = w > 5 ? 2 : 1;
      const gap = 0.7;
      const pw = (w - gap * (cols + 1)) / cols;
      const ph = (h - gap * (rows + 1)) / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = -w / 2 + gap + pw / 2 + c * (pw + gap);
          const y = -h / 2 + gap + ph / 2 + r * (ph + gap);
          leaf.add(box(pw, ph, 0.16, mat, x, y, 0.47, 2), box(pw - 0.9, ph - 0.9, 0.16, mat, x, y, 0.6, 2));
        }
      }
      if (k !== 0) return;
      // The first door: bronze bands, rows of studs, and a ring to knock with.
      const studGeo = own(new THREE.SphereGeometry(0.13, 10, 8));
      for (const y of [-h / 2 + 2.2, 0, h / 2 - 2.2]) {
        leaf.add(box(w - 0.1, 0.5, 0.12, M.bronze, 0, y, 0.48, 1));
        for (let x = -w / 2 + 0.5; x < w / 2 - 0.3; x += 0.75) {
          const stud = new THREE.Mesh(studGeo, M.bronze);
          stud.position.set(x, y, 0.58);
          leaf.add(stud);
        }
      }
      const ring = new THREE.Mesh(own(new THREE.TorusGeometry(0.75, 0.11, 12, 40)), M.bronze);
      ring.position.set(inner * (w / 2 - 1.1), -h / 2 + 9.5, 0.78);
      leaf.add(ring, box(0.7, 0.7, 0.2, M.bronze, inner * (w / 2 - 1.1), -h / 2 + 10.3, 0.62, 1));
    };
    if (d.type === "swing") {
      for (const s of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(s * (d.width / 2), 0, 0);
        const w = d.width / 2;
        const leaf = new THREE.Group();
        leaf.position.set(-s * (w / 2), d.height / 2, 0);
        leaf.add(box(w - 0.04, d.height - 0.04, 0.8, mat, 0, 0, 0, 2));
        relief(leaf, w, d.height, -s);
        pivot.add(leaf);
        g.add(pivot);
        parts.push((o) => (pivot.rotation.y = s * -o * 1.75));
      }
    } else if (d.type === "slide") {
      for (const s of [-1, 1]) {
        const w = d.width / 2;
        const panel = new THREE.Group();
        panel.add(box(w, d.height, 1.2, mat, 0, d.height / 2, 0, 3));
        // Vertical grooves.
        for (let i = 1; i < 4; i++) panel.add(box(0.12, d.height - 1, 0.2, M.darkStone, -w / 2 + (i * w) / 4, d.height / 2, 0.62, 2));
        g.add(panel);
        parts.push((o) => panel.position.set(s * (w / 2 + o * (w + 0.6)), 0, -0.3));
      }
    } else {
      // An off-centre pivot slab.
      const pivot = new THREE.Group();
      pivot.position.set(d.width / 4, 0, 0);
      const slab = new THREE.Group();
      slab.position.set(-d.width / 4, d.height / 2, 0);
      slab.add(box(d.width - 0.04, d.height - 0.04, 1, mat, 0, 0, 0, 3));
      relief(slab, d.width, d.height);
      pivot.add(slab);
      g.add(pivot);
      parts.push((o) => (pivot.rotation.y = o * 1.55));
    }
    return { g, set: (o) => parts.forEach((f) => f(o)) };
  }

  // The light behind a door: it shows through the gaps while the door is shut.
  function leak(k, color) {
    const d = doors[k];
    const m = new THREE.Mesh(own(new THREE.PlaneGeometry(d.width, d.height)), own(new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: true })));
    m.position.set(0, d.height / 2, -1.6);
    return m;
  }

  const DOOR_MAT = [M.wood, M.steel, M.stone, M.rock, M.bronze, M.marble, M.bronze];
  const LEAK = [0xffc98a, 0xffd29a, 0xfff0d8, 0xe8f0ff, 0xffd9a8, 0xfff1dc, 0xfff4e2];
  const doorParts = doors.map((d, k) => {
    const g = new THREE.Group();
    g.position.z = d.z;
    let w;
    if (d.wall === "cliff") w = cliff(k, k === 1 ? 46 : 80);
    else if (d.wall === "marble") w = k === 4 ? wall(k, 40, 22, 2, M.marble, 4) : wall(k, 90, 90, 3, M.marble, 5);
    else if (k === 0) w = wall(k, 46, 128, 16, M.rock, 10);
    else if (k === 6) w = wall(k, 120, 48, 6, M.darkStone, 6);
    // The gym: a dark block standing in the city, its door facing the avenue.
    else w = wall(k, 90, 48, 6, M.darkStone, 6);
    g.add(w);
    // A carved surround for the built gateways.
    if (d.wall !== "cliff") {
      const t = k === 4 ? 0.8 : 2.2;
      const mat = k === 4 || k === 5 ? M.bronze : M.darkStone;
      g.add(box(t, d.height + t, 2.4 + t, mat, -d.width / 2 - t / 2, (d.height + t) / 2, 0.6));
      g.add(box(t, d.height + t, 2.4 + t, mat, d.width / 2 + t / 2, (d.height + t) / 2, 0.6));
      g.add(box(d.width + t * 2, t, 2.4 + t, mat, 0, d.height + t / 2, 0.6));
    }
    // Light burning around the opening, as if the world beyond leaks through.
    if (k > 0) {
      const edge = glow(LEAK[k], 2.4);
      const zf = d.wall === "cliff" ? 2.85 : 0.6 + (2.4 + (k === 4 ? 0.8 : 2.2)) / 2 + 0.05;
      const e = 0.28;
      g.add(box(e, d.height, e, edge, -d.width / 2 - e / 2, d.height / 2, zf), box(e, d.height, e, edge, d.width / 2 + e / 2, d.height / 2, zf), box(d.width + e * 2, e, e, edge, 0, d.height + e / 2, zf));
    }
    const l = leaves(k, DOOR_MAT[k]);
    g.add(l.g);
    const lk = leak(k, LEAK[k]);
    g.add(lk);
    scene.add(g);
    return { g, leaves: l, leak: lk };
  });

  // A beam of warm light on the hall floor in front of the first door.
  const beamMat = own(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uOpen: { value: 0 } },
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uOpen; varying vec2 vUv;
        void main(){
          float spread = mix(0.03, 0.5, uOpen);
          float along = 1.0 - vUv.y;
          float w = spread * (0.25 + along * 0.75);
          float a = smoothstep(w, 0.0, abs(vUv.x - 0.5)) * pow(1.0 - along, 1.4) * (0.35 + uOpen * 1.4);
          gl_FragColor = vec4(vec3(1.0, 0.78, 0.52) * a, 1.0);
        }`,
    }),
  );
  const beam = new THREE.Mesh(own(new THREE.PlaneGeometry(40, 90)), beamMat);
  beam.rotation.x = -Math.PI / 2;
  beam.position.set(0, 0.24, 45);
  G.hall.add(beam);

  // Journey: a monumental passage, then a pathway into a range of mountains.
  function landscape(kind, z0, z1, width) {
    const [sx, sz] = tier.land;
    const geo = new THREE.PlaneGeometry(width, z0 - z1, sx, sz);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, (z0 + z1) / 2);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, landHeight(p.getX(i), p.getZ(i), kind));
    geo.computeVertexNormals();
    const n = geo.attributes.normal;
    const col = new Float32Array(p.count * 3);
    const uv = new Float32Array(p.count * 2);
    // Green lower slopes, grey rock where steep, snow on the heights.
    const dry = new THREE.Color(kind === "exploration" ? 0x4f6f38 : 0x6d7a42);
    const rockC = new THREE.Color(kind === "exploration" ? 0x6f6c66 : 0x8a8178);
    const snow = new THREE.Color(0xf1efe9);
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const steep = 1 - n.getY(i);
      c.copy(dry).lerp(rockC, smooth(0.08, 0.35, steep)).lerp(snow, smooth(kind === "exploration" ? 170 : 130, 220, p.getY(i)) * (1 - smooth(0.4, 0.7, steep)));
      col.set([c.r, c.g, c.b], i * 3);
      uv[i * 2] = p.getX(i) / 16;
      uv[i * 2 + 1] = p.getZ(i) / 16;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    const mat = own(new THREE.MeshStandardMaterial({ map: M.rock.map, normalMap: M.rock.normalMap, vertexColors: true, roughness: 1 }));
    const m = new THREE.Mesh(own(geo), mat);
    m.receiveShadow = tier.shadows;
    return m;
  }
  {
    const g = G.journey;
    g.add(landscape("journey", 2, -334, 1500));
    g.add(box(4, 22, 34, M.stone, -11, 11, -17, 5), box(4, 22, 34, M.stone, 11, 11, -17, 5));
    for (let z = -40; z > -320; z -= 7.5) g.add(box(5.2, 0.5, 6.6, M.stone, 0, 0.1, z, 3));
    for (let z = -46; z > -320; z -= 30) for (const s of [-1, 1]) g.add(box(0.8, 1.4, 0.8, M.darkStone, s * 4.2, 0.7, z, 2));
  }

  // Ventures: an avenue of towers in glass, concrete and metal, lit paths.
  {
    const g = G.ventures;
    // The city floor runs on beyond the gym, under the far towers.
    g.add(box(1400, 1, 880, M.darkGranite, 0, -0.52, -760, 8));
    let n = 0;
    for (const o of solids.filter((s) => s.kind === "tower")) {
      const w = o.max[0] - o.min[0];
      const h = o.max[1];
      const x = (o.min[0] + o.max[0]) / 2;
      const z = (o.min[2] + o.max[2]) / 2;
      const glassy = n++ % 2 === 0;
      const t = box(w, h, w, glassy ? M.glass : M.concrete, x, h / 2, z, glassy ? 12 : 6);
      g.add(t);
      // Metal fins on the face toward the avenue.
      const face = x > 0 ? o.min[0] - 0.3 : o.max[0] + 0.3;
      for (let f = -1; f <= 1; f++) g.add(box(0.5, h * 0.98, 0.8, M.steel, face, h * 0.49, z + (f * w) / 3, 3));
    }
    const strip = glow(0xffcf8c, 2.2);
    for (const s of [-1, 1]) g.add(box(0.3, 0.06, 300, strip, s * 7, 0.03, -485));
    for (let z = -350; z > -630; z -= 34) g.add(box(14, 0.06, 0.3, strip, 0, 0.03, z));
  }

  // Discipline: a colonnade of massive piers under a hard, low sun.
  {
    const g = G.discipline;
    g.add(box(700, 1, 300, M.stone, 0, -0.5, -785, 10));
    for (const o of solids.filter((s) => s.kind === "pier")) {
      const x = (o.min[0] + o.max[0]) / 2;
      const z = (o.min[2] + o.max[2]) / 2;
      g.add(box(6, 38, 6, M.stone, x, 19, z, 5));
    }
    for (let z = -660; z > -910; z -= 56) g.add(box(38, 5, 7, M.stone, 0, 40.5, z, 5));
  }

  // Exploration: high country, rock spires and a natural arch over the route.
  {
    const g = G.exploration;
    g.add(landscape("exploration", -926, -2400, 2200));
    const spireGeo = new THREE.CylinderGeometry(0.25, 1, 1, 10, 14);
    const sp = spireGeo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < sp.count; i++) {
      v.fromBufferAttribute(sp, i);
      const k = 1 + (fbm(v.x * 2 + 9, v.y * 5 + v.z * 2, 4) - 0.5) * 0.7;
      sp.setXYZ(i, v.x * k, v.y + 0.5, v.z * k);
    }
    spireGeo.computeVertexNormals();
    for (const o of solids.filter((s) => s.kind === "spire")) {
      const r = (o.max[0] - o.min[0]) / 2;
      const geo = own(worldUV(spireGeo.clone().scale(r, o.max[1], r), 12));
      const m = new THREE.Mesh(geo, M.rock);
      m.position.set((o.min[0] + o.max[0]) / 2, -2, (o.min[2] + o.max[2]) / 2);
      m.castShadow = m.receiveShadow = tier.shadows;
      g.add(m);
    }
    own(spireGeo);
    const archGeo = new THREE.TorusGeometry(arch.span / 2 + arch.thickness / 2, arch.thickness / 2, 18, 64, Math.PI);
    const ap = archGeo.attributes.position;
    for (let i = 0; i < ap.count; i++) {
      v.fromBufferAttribute(ap, i);
      const k = (fbm(v.x * 0.15 + 3, v.y * 0.15 + v.z * 0.2, 4) - 0.5) * 5;
      ap.setXYZ(i, v.x, v.y * (arch.height / (arch.span / 2 + arch.thickness / 2)), v.z + k);
    }
    archGeo.computeVertexNormals();
    const archMesh = new THREE.Mesh(own(worldUV(archGeo, 10)), M.rock);
    archMesh.position.set(0, -2, arch.z);
    archMesh.castShadow = archMesh.receiveShadow = tier.shadows;
    g.add(archMesh);
    // The marble pavilion that holds the Expression room, seen from outside.
    g.add(box(40, 22, 120, M.marble, 0, 11, -1380, 6));
  }

  // Expression: a study panelled in dark wood, lit by lamps and the evening.
  const salonLights = [];
  {
    const g = G.expression;
    g.add(box(19, 0.6, 118, M.wood, 0, -0.3, -1380, 3));
    g.add(box(1, 18, 118, M.wood, -10, 9, -1380, 4), box(1, 18, 118, M.wood, 10, 9, -1380, 4));
    g.add(box(21, 1, 118, M.ceiling, 0, 18.5, -1380));
    for (const [x, z] of [[-8, -1366], [4.4, -1374], [8, -1396]]) {
      const s = new THREE.SpotLight(0xffc98e, 0, 30, 0.5, 0.7, 1.4);
      s.position.set(x * 0.6, 17.5, z + 4);
      s.target.position.set(x, 1, z);
      g.add(s, s.target);
      salonLights.push(s);
    }
    g.add(box(0.2, 0.2, 116, glow(0xffd29a, 1.6), -9.4, 17.6, -1380), box(0.2, 0.2, 116, glow(0xffd29a, 1.6), 9.4, 17.6, -1380));
  }

  // Ideas: a court open to the night; a path of pale light leads to the final door.
  {
    const g = G.ideas;
    g.add(box(90, 6, 282, M.darkGranite, 0, -3, -1580, 8));
    g.add(box(2, 2.4, 282, M.darkStone, -45, 1.2, -1580, 4), box(2, 2.4, 282, M.darkStone, 45, 1.2, -1580, 4));
    const path = glow(0xbcd2ff, 1.8);
    for (const x of [-4.5, 4.5]) g.add(box(0.25, 0.05, 270, path, x, 0.03, -1585));
    for (let z = -1460; z > -1712; z -= 28) for (const x of [-12, 12]) g.add(box(0.7, 2.6, 0.7, M.darkStone, x, 1.3, z, 2), box(0.5, 0.5, 0.5, glow(0xc8d8ff, 2.2), x, 2.85, z));
  }

  // The light beyond: a bright, quiet world.
  const realm = buildRealm({ G, M, own, box, glow, tier });
  // No people in these worlds: the traveller stays out of the scene.
  const traveller = new THREE.Group();
  let disposed = false;
  let mixer = null;
  let walkAct = null;
  let idleAct = null;
  let walkerZ = null;
  let walkPhase = 0;
  let stride = 0;

  // One warm light that spills through whichever door is near.
  const spill = new THREE.SpotLight(0xffd7a3, 0, 160, 0.7, 0.8, 1.2);
  scene.add(spill, spill.target);

  // ---- Post ----------------------------------------------------------------
  const target = own(new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }));
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.14, 0.4, 0.98);
  // No bloom: light stays crisp, never a haze over the scene.
  bloom.enabled = false;
  composer.addPass(bloom);
  const grade = new ShaderPass(GradeShader);
  grade.uniforms.uGrain.value = minimal || reducedMotion ? 0 : 0.025;
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  // ---- Per-frame -----------------------------------------------------------
  const moodC = Object.fromEntries(Object.entries(moods).map(([k, m]) => [k, { ...m, fogC: new THREE.Color(m.fog), bgC: new THREE.Color(m.background || m.fog) }]));
  const state = { want: 0, now: 0, shade: new THREE.Vector4(), shadeWant: new THREE.Vector4(), center: 0, centerWant: 0, paused: false };
  const pointer = new THREE.Vector2();
  const pointerSmooth = new THREE.Vector2();
  const look = new THREE.Vector3();
  const fogC = new THREE.Color();
  const bgC = new THREE.Color();
  const sunV = new THREE.Vector3();
  const sunV2 = new THREE.Vector3();
  let width = 1;
  let height = 1;
  let raf = 0;
  let last = performance.now();
  const start = last;
  let ready = false;
  let visible = !document.hidden;
  let currentEnv = null;
  let slow = 0;
  let frames = 0;

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    composer.setPixelRatio(dpr);
    composer.setSize(width, height);
    bloom.resolution.set(width / 2, height / 2);
    camera.aspect = width / height;
    camera.fov = camera.aspect < 0.8 ? 60 : camera.aspect < 1.2 ? 50 : 42;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!visible || state.paused) {
      last = now;
      return;
    }
    const raw = (now - last) / 1000;
    const dt = Math.min(Math.max(raw, 0), 0.1);
    last = now;
    // Slow device: drop shadows and bloom once.
    if (tier.shadows && ++frames > 10 && frames < 150 && raw > 0.05 && ++slow > 20) {
      renderer.shadowMap.enabled = false;
      scene.traverse((o) => o.material && (o.material.needsUpdate = true));
    }
    const t = reducedMotion ? 3 : (now - start) / 1000;

    state.now = reducedMotion ? state.want : state.now + (state.want - state.now) * (1 - Math.exp(-dt * 2.8));
    const cam = cameraAt(state.now);
    pointerSmooth.lerp(pointer, reducedMotion ? 0 : 1 - Math.exp(-dt * 2));
    const drift = reducedMotion ? 0 : 1;
    camera.position.set(cam.pos[0] + pointerSmooth.x * 0.6 + Math.sin(t * 0.2) * 0.18 * drift, cam.pos[1] + pointerSmooth.y * 0.3 + Math.sin(t * 0.15) * 0.12 * drift, cam.pos[2]);
    look.set(cam.target[0], cam.target[1], cam.target[2]);
    camera.lookAt(look);

    // The traveller walks ahead, through every world.
    {
      // On the causeway in the opening shot, facing the door; close ahead elsewhere.
      const wz = Math.min(cam.pos[2] - 13, 74);
      const speed = walkerZ === null ? 0 : Math.abs(wz - walkerZ) / Math.max(dt, 1e-3);
      walkerZ = wz;
      walkPhase += Math.min(speed, 12) * dt * 1.6;
      stride += ((speed > 0.4 ? 1 : 0) - stride) * (1 - Math.exp(-dt * 4));
      const zid = zones[zoneAt(wz)].id;
      const wy = zid === "exploration" && wz < -930 && wz > -1322 ? 3 : zid === "hall" ? 0.2 : 0;
      traveller.position.set(0, wy, wz);
      realm.walker.pose(walkPhase, reducedMotion ? 0 : stride);
      if (mixer) {
        const w = reducedMotion ? 0 : stride;
        walkAct.setEffectiveWeight(w);
        idleAct.setEffectiveWeight(1 - w);
        // Steps quicken with the scroll, within what still reads as walking.
        walkAct.timeScale = Math.min(Math.max(speed / 3, 0.8), 2.2);
        mixer.update(dt);
      }
    }
    realm.update(t, state.now);

    // The doors.
    const opens = doors.map((_, k) => doorOpen(k, state.now));
    doorParts.forEach((d, k) => {
      d.leaves.set(opens[k]);
      const shut = 1 - smooth(0.08, 0.5, opens[k]);
      d.leak.material.opacity = shut;
      d.leak.visible = shut > 0.01;
      const k2 = moods[zones[k].id].glow;
      d.leak.material.color.setHex(LEAK[k]).multiplyScalar((0.9 + opens[k] * 6) * k2 * (0.75 + 0.25 * Math.sin(t * 0.8)));
    });
    beamMat.uniforms.uOpen.value = opens[0];

    // Which spaces exist right now: the one the camera is in, and the next
    // once its door has started to open.
    const cz = zoneAt(camera.position.z);
    zones.forEach((z, i) => {
      groups[i].visible = i === cz || (i === cz + 1 && opens[cz] > 0.2) || (i === cz - 1 && camera.position.z - doors[i].z > -30);
    });
    doorParts.forEach((d, k) => (d.g.visible = k === cz || (k === cz - 1 && camera.position.z - doors[k].z > -30)));
    // The Exploration landscape stays visible around the pavilion it contains.
    if (cz === 4) groups[4].visible = true;

    // The light: this space's mood, turning toward the next as its door opens.
    const cur = moodC[zones[cz].id];
    const nxtZ = zones[cz + 1];
    const nxt = nxtZ ? moodC[nxtZ.id] : cur;
    const k = cz < doors.length ? cz : doors.length - 1;
    const dist = camera.position.z - doors[k].z;
    const open = opens[k] ?? 1;
    const curIn = ENCLOSED.has(zones[cz].id);
    const nxtIn = nxtZ ? ENCLOSED.has(nxtZ.id) || !nxt.sky : true;
    let b;
    if (curIn) b = smooth(30, 0, dist) * open;
    else if (!nxtIn) b = open * smooth(160, 10, dist);
    else b = smooth(10, 0, dist) * open;
    const mix = (key) => cur[key] + (nxt[key] - cur[key]) * b;
    fogC.copy(cur.fogC).lerp(nxt.fogC, b);
    fog.color.copy(fogC);
    fog.density = mix("density");
    renderer.toneMappingExposure = mix("exposure");
    sun.intensity = mix("sun");
    hemi.intensity = mix("ambient");
    hemi.color.copy(fogC).lerp(new THREE.Color(0xffffff), 0.5);

    // The sky: inside a closed space, the sky seen through its door is the
    // next space's; outside, the sky turns with the light.
    const skyMood = curIn ? nxt : !nxtIn ? null : cur;
    if (skyMood && !skyMood.sky) {
      sky.visible = false;
      bgC.copy(skyMood.bgC);
      scene.background = bgC;
    } else {
      sky.visible = true;
      scene.background = null;
      const a = skyMood || cur;
      const bb = skyMood ? null : nxt;
      const el = bb ? a.elevation + (bb.elevation - a.elevation) * b : a.elevation;
      const az = bb ? a.azimuth + (bb.azimuth - a.azimuth) * b : a.azimuth;
      const tu = bb ? a.turbidity + (bb.turbidity - a.turbidity) * b : a.turbidity;
      sunV.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - el), THREE.MathUtils.degToRad(az));
      su.sunPosition.value.copy(sunV);
      su.turbidity.value = tu;
      su.rayleigh.value = el < 3 ? 2.6 : 1.4;
      su.cloudCoverage.value = zones[cz].id === "exploration" ? 0.55 : 0.32;
      su.time.value = t;
    }
    // The sun follows the light of the space being entered.
    const lm = curIn && nxt.sky ? nxt : cur;
    sunV2.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - Math.max(lm.elevation ?? 30, 4)), THREE.MathUtils.degToRad(lm.azimuth ?? 180));
    sun.target.position.set(0, 0, camera.position.z - 90);
    sun.position.copy(sun.target.position).addScaledVector(sunV2, 420);
    const env = envs[curIn ? zones[cz].id : b > 0.5 && nxtZ ? nxtZ.id : zones[cz].id] || null;
    if (env !== currentEnv) {
      scene.environment = env;
      currentEnv = env;
    }
    scene.environmentIntensity = curIn ? 0.4 : 0.8;

    // Light spilling through the door ahead.
    if (k < doors.length) {
      const d = doors[k];
      spill.position.set(0, d.height * 0.8, d.z - 12);
      spill.target.position.set(0, 0, d.z + 60);
      spill.intensity = (k === 0 || k === 6 ? 2600 : 900) * Math.min(open * 1.4, 1) * smooth(220, 20, dist) * (curIn ? 1 : 0.4);
    }
    salonLights.forEach((s) => (s.intensity = cz === 5 || cz === 4 ? 900 : 0));

    // Words sit on shaded water: ease the shading toward what the page asks.
    state.shade.lerp(state.shadeWant, reducedMotion ? 1 : 1 - Math.exp(-dt * 3));
    state.center += (state.centerWant - state.center) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 3));
    grade.uniforms.uShade.value.copy(state.shade);
    grade.uniforms.uCenter.value = state.center;
    grade.uniforms.uTime.value = t;

    composer.render();
    if (!ready) {
      ready = true;
      onReady?.();
    }
  }
  raf = requestAnimationFrame(frame);

  const onVisibility = () => {
    visible = !document.hidden;
    last = performance.now();
  };
  document.addEventListener("visibilitychange", onVisibility);

  return {
    setJourney(v, immediate = false) {
      state.want = v;
      if (immediate) state.now = v;
    },
    // Darken the scene where words sit: [left, right, top, bottom], centre.
    setShade(s, centre = 0) {
      state.shadeWant.set(s[0], s[1], s[2], s[3]);
      state.centerWant = centre;
    },
    setPointer(x, y) {
      pointer.set(x, y);
    },
    setPaused(p) {
      state.paused = p;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      scene.traverse((o) => o.geometry?.dispose());
      owned.forEach((x) => x.dispose?.());
      sky.geometry.dispose();
      sky.material.dispose();
      composer.dispose();
      renderer.dispose();
    },
  };
}

export function isSoftwareRenderer() {
  try {
    const gl = document.createElement("canvas").getContext("webgl2") || document.createElement("canvas").getContext("webgl");
    const info = gl && gl.getExtension("WEBGL_debug_renderer_info");
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    return /swiftshader|llvmpipe|software|basic render/i.test(name);
  } catch {
    return false;
  }
}

export function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}
