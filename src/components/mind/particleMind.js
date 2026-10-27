import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// The real objects each chapter becomes (Poly Haven, CC0), and the ring built here.
const MODELS = {
  journey: "/assets/models/vintage_pocket_watch/vintage_pocket_watch.gltf",
  ventures: "/assets/models/classic_laptop/classic_laptop.gltf",
  exploration: "/assets/models/seadogs_compass/seadogs_compass.gltf",
  expression: "/assets/models/vintage_suitcase/vintage_suitcase.gltf",
  ideas: "/assets/models/lightbulb_01/lightbulb_01.gltf",
};

// Small corrections per model, applied before each is sized.
const TWEAKS = {
  // The file holds two suitcases side by side; keep the first.
  expression: (scene) => scene.children.filter((c) => /_02_/.test(c.name)).forEach((c) => c.removeFromParent()),
  // Tip the compass so its face looks at the reader.
  exploration: (scene) => {
    scene.rotation.x = 1.15;
  },
  // Clear glass with a warm glow: an idea, switched on.
  ideas: (scene) =>
    scene.traverse((m) => {
      if (!m.isMesh) return;
      for (const mat of [].concat(m.material)) {
        if (!(mat.transmission > 0)) continue;
        mat.transmission = 0;
        mat.transparent = true;
        mat.opacity = 0.42;
        mat.roughness = 0.04;
        mat.color.set("#fffaf0");
        mat.emissive.set("#ffc46b");
        mat.emissiveIntensity = 0.35;
        mat.depthWrite = false;
      }
    }),
};

// A boxing ring: padded corner posts, three red ropes a side, a canvas floor.
function buildRing() {
  const ring = new THREE.Group();
  const canvasMat = new THREE.MeshStandardMaterial({ color: "#e9e4da", roughness: 0.9 });
  const apron = new THREE.MeshStandardMaterial({ color: "#1d3f8f", roughness: 0.7 });
  const post = new THREE.MeshStandardMaterial({ color: "#c9ccd2", metalness: 0.85, roughness: 0.3 });
  const pad = new THREE.MeshStandardMaterial({ color: "#b3121f", roughness: 0.55 });
  const rope = new THREE.MeshStandardMaterial({ color: "#d1202f", roughness: 0.45 });
  const S = 1.0;
  const floor = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.06, 2.3), canvasMat);
  floor.position.y = -0.62;
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.3, 2.36), apron);
  base.position.y = -0.8;
  ring.add(floor, base);
  const corners = [[-S, -S], [S, -S], [S, S], [-S, S]];
  for (const [x, z] of corners) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.1, 20), post);
    p.position.set(x, -0.05, z);
    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.72, 20), pad);
    cushion.position.set(x, 0.0, z);
    ring.add(p, cushion);
  }
  for (let r = 0; r < 3; r++) {
    const y = -0.28 + r * 0.26;
    for (let k = 0; k < 4; k++) {
      const [x1, z1] = corners[k];
      const [x2, z2] = corners[(k + 1) % 4];
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x1, y, z1), new THREE.Vector3((x1 + x2) / 2, y - 0.035, (z1 + z2) / 2), new THREE.Vector3(x2, y, z2));
      ring.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.022, 10), rope));
    }
  }
  return ring;
}

// Centre an object and scale it to about two units across.
function normalise(obj, size = 2.1) {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const dim = box.getSize(new THREE.Vector3());
  const k = size / Math.max(dim.x, dim.y, dim.z);
  const holder = new THREE.Group();
  obj.position.sub(box.getCenter(new THREE.Vector3()));
  holder.add(obj);
  holder.scale.setScalar(k);
  holder.updateMatrixWorld(true);
  return holder;
}

// Points spread over an object's surfaces, weighted by area, in its holder's space.
function sampleSurface(holder, N) {
  const parts = [];
  holder.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(holder.matrixWorld).invert();
  holder.traverse((m) => {
    if (!m.isMesh) return;
    const g = m.geometry.clone();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
    // Undo the holder's scale too, so the points sit where the object draws.
    g.scale(holder.scale.x, holder.scale.y, holder.scale.z);
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(g)).build();
    const area = sampler.distribution[sampler.distribution.length - 1];
    parts.push({ sampler, area, g });
  });
  const total = parts.reduce((a, p) => a + p.area, 0) || 1;
  const out = new Float32Array(N * 3);
  const v = new THREE.Vector3();
  let i = 0;
  parts.forEach((p, k) => {
    const n = k === parts.length - 1 ? N - i : Math.round((p.area / total) * N);
    for (let j = 0; j < n && i < N; j++, i++) {
      p.sampler.sample(v);
      out.set([v.x, v.y, v.z], i * 3);
    }
    p.g.dispose();
  });
  return out;
}

// Ray's mind as one cloud of particles. It forms the anatomical brain (Brain
// AS, Agnieszka Starostecka, CC BY 4.0) and, as the page scrolls, re-forms
// into each chapter: the road, the tower, the ring, the globe, the open book
// and the spiral of ideas. Every form holds the same particles, so a chapter
// change is one morph on the GPU.

async function loadBrain(url) {
  const [buf] = await Promise.all([fetch(url).then((r) => r.arrayBuffer()), MeshoptDecoder.ready]);
  const [vcount, icount, vbytes, ibytes] = new Uint32Array(buf, 0, 4);
  const q = new Int16Array(vcount * 4);
  MeshoptDecoder.decodeVertexBuffer(new Uint8Array(q.buffer), vcount, 8, new Uint8Array(buf, 16, vbytes));
  const indices = new Uint32Array(icount);
  MeshoptDecoder.decodeIndexBuffer(new Uint8Array(indices.buffer), icount, 4, new Uint8Array(buf, 16 + vbytes, ibytes));
  const pos = new Float32Array(vcount * 3);
  for (let i = 0; i < vcount; i++) for (let k = 0; k < 3; k++) pos[i * 3 + k] = q[i * 4 + k] / 32767;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(indices, 1));
  g.rotateX(-Math.PI / 2); // the scan is Z-up
  // Face the brain's right side to the camera: front to the left of the screen.
  g.rotateY(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

// A small seeded random, so every visit draws the same forms.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// The chapter forms, each N points about two units across.
const FORMS = {
  // Journey: a road running away into the distance in long bends.
  journey(N, r) {
    const out = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const t = Math.pow(r(), 0.85);
      const z = 1.6 - t * 5.2;
      const x = Math.sin(t * 5.2) * (0.25 + t * 0.9);
      const half = 0.34 * (1 - t * 0.55);
      const k = r();
      // Two edges, a dashed centre line, and the surface between.
      let u;
      if (k < 0.5) u = r() < 0.5 ? -1 : 1;
      else if (k < 0.66) u = Math.floor(t * 60) % 2 ? 0 : (r() - 0.5) * 2;
      else u = (r() - 0.5) * 2;
      const y = -0.75 + t * 0.55 + (k < 0.5 ? 0.012 : 0);
      out.set([x + u * half, y, z], i * 3);
    }
    return out;
  },
  // Ventures: a tower of floor plates, the top floors still being built.
  ventures(N, r) {
    const out = new Float32Array(N * 3);
    const floors = 22;
    for (let i = 0; i < N; i++) {
      const f = Math.floor(Math.pow(r(), 0.8) * floors);
      const h = f / floors;
      const w = 0.55 - h * 0.12;
      const edge = r() < 0.7;
      let x = (r() - 0.5) * 2 * w;
      let z = (r() - 0.5) * 2 * w * 0.7;
      if (edge) (r() < 0.5 ? (x = Math.sign(x) * w) : (z = Math.sign(z) * w * 0.7));
      const built = h < 0.72 || r() < 0.35;
      const y = -1.05 + h * 2.2 + (built ? 0 : (r() - 0.5) * 0.08);
      out.set([x + (built ? 0 : (r() - 0.5) * 0.15), y, z], i * 3);
    }
    return out;
  },
  // Discipline: a ring: four posts, three ropes, the canvas floor.
  discipline(N, r) {
    const out = new Float32Array(N * 3);
    const s = 1.05;
    for (let i = 0; i < N; i++) {
      const k = r();
      let x, y, z;
      if (k < 0.42) {
        const rope = Math.floor(r() * 3);
        const t = r() * 4;
        const side = Math.floor(t);
        const u = (t - side) * 2 - 1;
        y = -0.35 + rope * 0.32 - Math.abs(Math.sin(u * Math.PI * 0.5)) * 0;
        [x, z] = [[u * s, -s], [s, u * s], [-u * s, s], [-s, -u * s]][side];
        y -= (1 - u * u) * 0.04;
      } else if (k < 0.55) {
        const post = Math.floor(r() * 4);
        x = post % 2 ? s : -s;
        z = post < 2 ? s : -s;
        y = -0.7 + r() * 1.05;
        x += (r() - 0.5) * 0.04;
        z += (r() - 0.5) * 0.04;
      } else {
        x = (r() - 0.5) * 2.3;
        z = (r() - 0.5) * 2.3;
        y = -0.7;
      }
      out.set([x, y, z], i * 3);
    }
    return out;
  },
  // Exploration: a globe with the arcs of a journey across it.
  exploration(N, r) {
    const out = new Float32Array(N * 3);
    const R = 1.0;
    const v = new THREE.Vector3();
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    // India, the US, the UK and the UAE, by latitude and longitude.
    const places = [[21, 78], [39, -98], [54, -2], [24, 54]].map(([la, lo]) => {
      const p = (90 - la) * (Math.PI / 180);
      const t = (lo + 180) * (Math.PI / 180);
      return new THREE.Vector3(-Math.sin(p) * Math.cos(t), Math.cos(p), Math.sin(p) * Math.sin(t)).multiplyScalar(R);
    });
    for (let i = 0; i < N; i++) {
      const k = r();
      if (k < 0.5) {
        // Lines of latitude and longitude.
        const lat = r() < 0.5;
        const g = Math.floor(r() * 12);
        const t = r() * Math.PI * 2;
        if (lat) {
          const p = ((g + 0.5) / 12) * Math.PI;
          v.set(Math.sin(p) * Math.cos(t), Math.cos(p), Math.sin(p) * Math.sin(t));
        } else {
          const lo = (g / 12) * Math.PI;
          v.set(Math.cos(lo) * Math.sin(t), Math.cos(t), Math.sin(lo) * Math.sin(t));
        }
        v.multiplyScalar(R);
      } else if (k < 0.82) {
        const f = Math.floor(r() * 3);
        const t = r();
        a.copy(places[f]);
        b.copy(places[f + 1]);
        v.copy(a).lerp(b, t).normalize().multiplyScalar(R * (1 + Math.sin(t * Math.PI) * 0.32));
      } else {
        v.copy(places[Math.floor(r() * 4)]).multiplyScalar(1 + r() * 0.03);
        v.x += (r() - 0.5) * 0.08;
        v.y += (r() - 0.5) * 0.08;
        v.z += (r() - 0.5) * 0.08;
      }
      out.set([v.x, v.y, v.z], i * 3);
    }
    return out;
  },
  // Expression: an open book, its pages fanning up.
  expression(N, r) {
    const out = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const side = r() < 0.5 ? -1 : 1;
      const page = Math.floor(Math.pow(r(), 1.8) * 9);
      const lift = page * 0.11;
      const u = r();
      const z = (r() - 0.5) * 1.5;
      const ang = side * (Math.PI / 2 - 0.18 - lift);
      const x = Math.sin(ang) * u * 1.15;
      const y = -0.2 + Math.cos(ang) * u * 1.15 * 0.55 + u * (1 - u) * 0.18;
      // Tipped toward the reader, so both pages are seen.
      out.set([x, y * 0.85 - z * 0.53, y * 0.53 + z * 0.85], i * 3);
    }
    return out;
  },
  // Ideas: a spiral galaxy, a dense core and two arms.
  ideas(N, r) {
    const out = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const arm = r() < 0.5 ? 0 : Math.PI;
      const d = Math.pow(r(), 1.6) * 1.35;
      const a = arm + d * 3.4 + (r() - 0.5) * (0.5 - d * 0.18);
      const y = (r() - 0.5) * 0.12 * (1.4 - d);
      const s2 = Math.sin(a) * d;
      out.set([Math.cos(a) * d, s2 * 0.62 + y, s2 * 0.78 - y * 0.6], i * 3);
    }
    return out;
  },
};

const VERT = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec4 aSeed;
  uniform float uMix;
  uniform float uTime;
  uniform float uIntro;
  uniform float uSize;
  uniform float uPixel;
  uniform vec3 uRay0;
  uniform vec3 uRayDir;
  uniform float uPush;
  uniform vec3 uRegion[6];
  uniform vec3 uRegionColor[6];
  uniform float uMap;
  uniform float uFromBrain;
  uniform float uToBrain;
  uniform float uHover;
  uniform float uStir;
  uniform vec3 uInk;
  uniform vec3 uFormColor;
  uniform float uFormTint;
  uniform float uAlpha;
  uniform float uHide;
  varying vec3 vColor;
  varying float vAlpha;

  vec3 curl(vec3 p) {
    return vec3(sin(p.y * 1.7 + uTime * 0.3) + cos(p.z * 2.1),
                sin(p.z * 1.9 - uTime * 0.25) + cos(p.x * 1.6),
                sin(p.x * 2.3 + uTime * 0.2) + cos(p.y * 1.8));
  }

  void main() {
    // Each particle leaves a little before or after its neighbours.
    float m = clamp((uMix - aSeed.x * 0.35) / 0.65, 0.0, 1.0);
    m = m * m * (3.0 - 2.0 * m);
    vec3 p = mix(aFrom, aTo, m);
    // Mid-morph the thought scatters, then settles into the next form.
    float burst = sin(m * 3.14159);
    p += curl(p * 1.3 + aSeed.yzw * 4.0) * burst * (0.18 + aSeed.y * 0.25);
    // Breathing.
    p += curl(p * 2.0 + aSeed.xyz * 9.0) * (0.006 + uStir * 0.09);

    // The opening: dust from far away gathers into the mind.
    float k = clamp((uIntro - aSeed.w * 0.45) / 0.55, 0.0, 1.0);
    k = 1.0 - pow(1.0 - k, 3.0);
    vec3 far = normalize(aSeed.xyz - 0.5 + 0.001) * (4.0 + aSeed.w * 5.0);
    p = mix(far + curl(far * 0.3) * 0.6, p, k);

    // The cursor parts the thoughts around it.
    vec3 w = (modelMatrix * vec4(p, 1.0)).xyz;
    vec3 toP = w - uRay0;
    vec3 closest = uRay0 + uRayDir * dot(toP, uRayDir);
    vec3 away = w - closest;
    float d = length(away);
    float f = uPush * exp(-d * d * 18.0);
    w += normalize(away + 0.0001) * f * 0.22;

    // Colour: ink, the chapter's tint, and the map's regions.
    float best = -2.0; int bi = 0;
    vec3 n = normalize(mix(aFrom, aTo, m));
    for (int i = 0; i < 6; i++) {
      float s = dot(n, uRegion[i]);
      if (s > best) { best = s; bi = i; }
    }
    vec3 rc = uRegionColor[0];
    for (int i = 0; i < 6; i++) if (i == bi) rc = uRegionColor[i];
    float hovered = float(bi) == uHover ? 1.0 : 0.0;
    float mapAmt = uMap * mix(uFromBrain, uToBrain, m) * (uHover < 0.0 ? 0.85 : mix(0.25, 1.0, hovered));
    vec3 col = mix(uInk, uFormColor, uFormTint * step(0.55, aSeed.y));
    col = mix(col, rc, mapAmt);
    // A traveling pulse: some thoughts are lit for a moment.
    float pulse = smoothstep(0.96, 1.0, sin(aSeed.z * 40.0 + uTime * (0.6 + aSeed.x)) * 0.5 + 0.5);
    col = mix(col, uFormColor, pulse * 0.8);
    vColor = col;
    vAlpha = ((0.45 + aSeed.y * 0.55) * k + f * 0.5) * uAlpha * (1.0 - uHide);

    vec4 mv = viewMatrix * vec4(w, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (0.6 + aSeed.z * 0.9) * (1.0 + pulse * 1.6 + hovered * uMap * 0.6);
    gl_PointSize = size * uPixel * 7.0 / -mv.z;
  }
`;

const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float a = smoothstep(0.5, 0.18, r) * vAlpha;
    gl_FragColor = vec4(vColor, a);
  }
`;

export function createParticleMind(canvas, { regions, lite = false, reducedMotion = false, onReady }) {
  const N = lite ? 26000 : 70000;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const group = new THREE.Group();
  scene.add(group);

  const r = rng(7);
  const seeds = new Float32Array(N * 4);
  for (let i = 0; i < N * 4; i++) seeds[i] = r();

  // Until the brain arrives, every form is a soft sphere of dust.
  const placeholder = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const v = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(0.9 + r() * 0.2);
    placeholder.set([v.x, v.y * 0.8, v.z * 1.1], i * 3);
  }
  const forms = { brain: new THREE.BufferAttribute(placeholder, 3) };
  for (const [id, make] of Object.entries(FORMS)) forms[id] = new THREE.BufferAttribute(make(N, rng(id.length * 97 + 3)), 3);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", forms.brain);
  geo.setAttribute("aFrom", forms.brain);
  geo.setAttribute("aTo", forms.brain);
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);

  // Region directions are given in the scan's space; turn them as the mesh was turned.
  const regionDirs = regions.map(({ dir: [x, y, z] }) => new THREE.Vector3(-z, y, x).normalize());
  const uniforms = {
    uMix: { value: 0 },
    uTime: { value: 0 },
    uIntro: { value: reducedMotion ? 1 : 0 },
    uSize: { value: lite ? 2.6 : 2.2 },
    uPixel: { value: dpr },
    uRay0: { value: new THREE.Vector3(0, 0, 50) },
    uRayDir: { value: new THREE.Vector3(0, 0, -1) },
    uPush: { value: 0 },
    uRegion: { value: regionDirs },
    uRegionColor: { value: regions.map((g) => new THREE.Color(g.color)) },
    uMap: { value: 0 },
    uFromBrain: { value: 1 },
    uToBrain: { value: 1 },
    uHover: { value: -1 },
    uStir: { value: 0 },
    uInk: { value: new THREE.Color("#ffffff") },
    uFormColor: { value: new THREE.Color("#ffffff") },
    uFormTint: { value: 0 },
    uAlpha: { value: 1 },
    uHide: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, depthWrite: false });
  const points = new THREE.Points(geo, material);
  group.add(points);

  // The field: fine thoughts at every depth around the mind. Scrolling moves
  // the near ones faster than the far ones, so the whole page has depth.
  const FN = lite ? 900 : 2600;
  const fieldPos = new Float32Array(FN * 3);
  const fieldSeed = new Float32Array(FN);
  for (let i = 0; i < FN; i++) {
    fieldPos.set([(r() - 0.5) * 18, (r() - 0.5) * 12, -8 + r() * 10], i * 3);
    fieldSeed[i] = r();
  }
  const fieldGeo = new THREE.BufferGeometry();
  fieldGeo.setAttribute("position", new THREE.BufferAttribute(fieldPos, 3));
  fieldGeo.setAttribute("aSeed", new THREE.BufferAttribute(fieldSeed, 1));
  fieldGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
  const fieldUniforms = { uScroll: { value: 0 }, uTime: uniforms.uTime, uInk: uniforms.uInk, uAlpha: uniforms.uAlpha, uPixel: uniforms.uPixel, uIntro: uniforms.uIntro };
  const fieldMat = new THREE.ShaderMaterial({
    uniforms: fieldUniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uScroll;
      uniform float uTime;
      uniform float uPixel;
      uniform float uIntro;
      varying float vA;
      void main() {
        vec3 p = position;
        float near = (p.z + 8.0) / 10.0;
        p.y = mod(p.y + uScroll * (0.6 + near * 2.4) + uTime * 0.04 * (0.5 + aSeed) + 6.0, 12.0) - 6.0;
        p.x += sin(uTime * 0.2 + aSeed * 30.0) * 0.15;
        vec4 mv = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.2 + aSeed * 2.6) * uPixel * 6.0 / max(-mv.z, 0.5);
        vA = (0.25 + 0.5 * aSeed) * uIntro;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uInk;
      uniform float uAlpha;
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(uInk, smoothstep(0.5, 0.1, d) * vA * mix(0.6, 1.0, uAlpha));
      }`,
  });
  scene.add(new THREE.Points(fieldGeo, fieldMat));

  // Where each region's label points: the brain particle furthest along its direction.
  const anchors = regionDirs.map((d) => d.clone().multiplyScalar(0.9));
  const screen = regions.map(() => ({ x: 0, y: 0, facing: 1 }));

  // The real brain: the anatomical model rendered solid, in natural tissue
  // tones under soft studio light. It forms out of the particles on arrival.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  const solidMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#e8c4bb"),
    roughness: 0.48,
    metalness: 0,
    clearcoat: 0.55,
    clearcoatRoughness: 0.32,
    sheen: 0.6,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color("#ffd7cc"),
    envMap: envTex,
    envMapIntensity: 0.9,
  });
  // Every real object, by form: its holder, its materials and how far it is faded in.
  const solids = {};
  let disposed = false;
  const addSolid = (id, holder) => {
    const mats = [];
    holder.traverse((m) => {
      if (!m.isMesh) return;
      for (const mat of [].concat(m.material)) if (!mats.includes(mat)) mats.push(mat);
    });
    group.add(holder);
    // Prepare its shaders and textures now, in the background, so the first
    // frame it is seen does not stall.
    holder.visible = true;
    holder.traverse((m) => {
      if (!m.isMesh) return;
      for (const mat of [].concat(m.material)) for (const key of ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap"]) if (mat[key]) renderer.initTexture(mat[key]);
    });
    try {
      renderer.compile(holder, camera);
    } catch {
      // Compiling ahead is only an optimisation.
    }
    holder.visible = false;
    solids[id] = { holder, mats: mats.map((mat) => ({ mat, transparent: mat.transparent, opacity: mat.opacity })), fade: 0 };
  };
  const key = new THREE.DirectionalLight("#fff4ea", 2.4);
  key.position.set(-3, 4, 5);
  const rim = new THREE.DirectionalLight("#ffe2c8", 1.6);
  rim.position.set(4, 1.5, -3);
  const fill = new THREE.HemisphereLight("#fff6ee", "#b9aaa2", 1.1);
  scene.add(key, rim, fill);
  let solidTarget = 0;

  loadBrain(lite ? "/assets/brain/brain-lite.bin" : "/assets/brain/brain.bin")
    .then((g) => {
      const sampler = new MeshSurfaceSampler(new THREE.Mesh(g)).build();
      const out = new Float32Array(N * 3);
      const v = new THREE.Vector3();
      g.computeBoundingBox();
      const c = g.boundingBox.getCenter(new THREE.Vector3());
      const s = 1.15 / Math.max(...g.boundingBox.getSize(new THREE.Vector3()).toArray()) * 2;
      const best = regionDirs.map(() => -Infinity);
      for (let i = 0; i < N; i++) {
        sampler.sample(v);
        v.sub(c).multiplyScalar(s);
        out.set([v.x, v.y, v.z], i * 3);
        regionDirs.forEach((d, k) => {
          const score = v.dot(d) - v.length() * 0.6;
          if (score > best[k]) {
            best[k] = score;
            anchors[k].copy(v);
          }
        });
      }
      const brainMesh = new THREE.Mesh(g, solidMat);
      brainMesh.position.copy(c).multiplyScalar(-s);
      brainMesh.scale.setScalar(s);
      const brainHolder = new THREE.Group();
      brainHolder.add(brainMesh);
      addSolid("brain", brainHolder);
      forms.brain.array.set(out);
      forms.brain.needsUpdate = true;
      onReady?.();
    })
    .catch((e) => console.warn("Brain model unavailable", e));

  // The chapter objects start loading at once, alongside the brain; each one's particles
  // are re-drawn from its real surfaces so the morph lands on the object.
  async function loadObjects() {
    const ringHolder = normalise(buildRing(), 2.3);
    forms.discipline.array.set(sampleSurface(ringHolder, N));
    forms.discipline.needsUpdate = true;
    addSolid("discipline", ringHolder);
    const loader = new GLTFLoader();
    for (const [id, url] of Object.entries(MODELS)) {
      if (disposed) return;
      try {
        const gltf = await loader.loadAsync(url);
        if (disposed) return;
        TWEAKS[id]?.(gltf.scene);
        const holder = normalise(gltf.scene);
        forms[id].array.set(sampleSurface(holder, N));
        forms[id].needsUpdate = true;
        addSolid(id, holder);
      } catch (e) {
        console.warn("Model unavailable", id, e);
      }
    }
  }
  loadObjects();


  // State the page drives.
  let from = "brain";
  let to = "brain";
  let mixTarget = 0;
  let view = { x: 0, y: 0, z: 6, rot: 0, scale: 1 };
  let viewTarget = { ...view };
  let colorTarget = { ink: new THREE.Color("#ffffff"), form: new THREE.Color("#ffffff"), tint: 0, alpha: 1 };
  const pointer = new THREE.Vector2(9, 9);
  const parallax = new THREE.Vector2();
  let pushTarget = 0;
  let paused = false;
  let stirTarget = 0;
  const raycaster = new THREE.Raycaster();

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  const start = performance.now();
  let last = start;
  let raf = 0;
  const tmp = new THREE.Vector3();
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (paused || document.hidden) return;
    const now = performance.now();
    const realDt = (now - last) / 1000;
    const dt = Math.min(realDt, 0.05);
    last = now;
    const t = (now - start) / 1000;
    uniforms.uTime.value = reducedMotion ? 0 : t;
    if (!reducedMotion) uniforms.uIntro.value = Math.min(uniforms.uIntro.value + dt / 2.6, 1);

    const e = 1 - Math.exp(-dt * 4);
    for (const k of Object.keys(view)) view[k] += (viewTarget[k] - view[k]) * e;
    uniforms.uMix.value += (mixTarget - uniforms.uMix.value) * (reducedMotion ? 1 : 1 - Math.exp(-Math.min(realDt, 0.25) * 5));
    uniforms.uInk.value.lerp(colorTarget.ink, e);
    uniforms.uFormColor.value.lerp(colorTarget.form, e);
    uniforms.uFormTint.value += (colorTarget.tint - uniforms.uFormTint.value) * e;
    uniforms.uAlpha.value += (colorTarget.alpha - uniforms.uAlpha.value) * e;
    // The real object of the current form appears once its particles have
    // gathered, and hands back to them when the page moves on.
    {
      const settled = Math.min(Math.max((uniforms.uMix.value - 0.6) / 0.25, 0), 1);
      const gathered = Math.min(Math.max((uniforms.uIntro.value - 0.8) / 0.2, 0), 1);
      // Real elapsed time, so fades complete even on slow frames.
      const step = 1 - Math.exp(-Math.min(realDt, 0.5) * 6);
      let shown = 0;
      for (const [id, entry] of Object.entries(solids)) {
        const want = id === to ? solidTarget * (from === to ? 1 : settled) * gathered : 0;
        entry.fade += (want - entry.fade) * step;
        if (Math.abs(want - entry.fade) < 0.02) entry.fade = want;
        entry.holder.visible = entry.fade > 0.01;
        const opaque = entry.fade >= 0.999;
        for (const m of entry.mats) {
          // Fully in, each material draws as it was authored: no see-through surfaces.
          const transparent = opaque ? m.transparent : true;
          if (m.mat.transparent !== transparent) {
            m.mat.transparent = transparent;
            m.mat.needsUpdate = true;
          }
          m.mat.opacity = m.opacity * entry.fade;
          m.mat.depthWrite = opaque ? !m.transparent || m.mat.depthWrite : false;
        }
        shown = Math.max(shown, entry.fade);
      }
      uniforms.uHide.value = shown * 0.94;
    }
    uniforms.uPush.value += (pushTarget - uniforms.uPush.value) * (1 - Math.exp(-dt * 6));
    // The stir rises with the scroll and settles once it stops.
    stirTarget *= Math.exp(-dt * 2.5);
    uniforms.uStir.value += (stirTarget - uniforms.uStir.value) * (1 - Math.exp(-dt * 5));
    parallax.lerp(pointer.x < 5 ? pointer : new THREE.Vector2(), 1 - Math.exp(-dt * 2));

    // The form turns slowly; the opening adds one long turn as it gathers.
    const intro = uniforms.uIntro.value;
    const spin = reducedMotion ? 0 : t * 0.06 + (1 - intro) * 1.4;
    group.position.set(view.x, view.y, 0);
    // Mid-morph the form turns and the camera draws back, so each change reads as an event.
    const burst = from === to ? 0 : Math.sin(Math.min(Math.max(uniforms.uMix.value, 0), 1) * Math.PI);
    group.rotation.set(0.08 + parallax.y * -0.12 + burst * 0.25, view.rot + Math.sin(spin) * 0.35 + parallax.x * 0.25 + burst * 1.1, 0);
    group.scale.setScalar(view.scale);
    camera.position.set(0, 0, view.z + burst * 1.6);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    group.updateMatrixWorld();

    if (pointer.x < 5) {
      raycaster.setFromCamera(pointer, camera);
      uniforms.uRay0.value.copy(raycaster.ray.origin);
      uniforms.uRayDir.value.copy(raycaster.ray.direction);
    }

    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    anchors.forEach((a, i) => {
      tmp.copy(a).applyMatrix4(group.matrixWorld);
      const facing = tmp.clone().sub(group.position).normalize().dot(camera.position.clone().sub(tmp).normalize());
      tmp.project(camera);
      screen[i].x = (tmp.x * 0.5 + 0.5) * W;
      screen[i].y = (-tmp.y * 0.5 + 0.5) * H;
      screen[i].facing = facing;
    });

    renderer.render(scene, camera);
  };
  loop();

  return {
    screen,
    // Morph toward a form; amount is 0..1 of the way from the current one.
    setForm(a, b, amount) {
      if (a !== from || b !== to) {
        from = a;
        to = b;
        geo.setAttribute("aFrom", forms[a]);
        geo.setAttribute("aTo", forms[b]);
        uniforms.uFromBrain.value = a === "brain" ? 1 : 0;
        uniforms.uToBrain.value = b === "brain" ? 1 : 0;
        // Start each change from the old form, so the gather is always seen.
        uniforms.uMix.value = from === to ? amount : 0;
      }
      mixTarget = amount;
    },
    setView(v) {
      viewTarget = { ...viewTarget, ...v };
    },
    jumpView() {
      view = { ...viewTarget };
    },
    setColors(ink, form, tint, alpha = 1) {
      colorTarget = { ink: new THREE.Color(ink), form: new THREE.Color(form), tint, alpha };
    },
    setMap(v) {
      uniforms.uMap.value = v;
    },
    setStir(v) {
      stirTarget = v;
    },
    setHover(i) {
      uniforms.uHover.value = i;
    },
    setPointer(x, y, active) {
      pointer.set(x, y);
      pushTarget = active ? 1 : 0;
    },
    setSolid(v) {
      solidTarget = v;
    },
    skipIntro() {
      uniforms.uIntro.value = 1;
    },
    setScroll(v) {
      fieldUniforms.uScroll.value = v;
    },
    setPaused(v) {
      paused = v;
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      geo.dispose();
      disposed = true;
      for (const entry of Object.values(solids))
        entry.holder.traverse((m) => {
          if (!m.isMesh) return;
          m.geometry.dispose();
          for (const mat of [].concat(m.material)) mat.dispose();
        });
      envTex.dispose();
      pmrem.dispose();
      fieldGeo.dispose();
      fieldMat.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}

export function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}
