import * as THREE from "three";
import { fbm, landHeight, seeded } from "./world";

// The parts of each world that make it read as a place: a sea of cloud and
// floating islands around the first door, water in the valleys, a boxing gym,
// a study, a night sky with a planet, and a traveller walking ahead.

// A sea of cloud, lit warm from the low sun, below the causeway.
function cloudSea(own) {
  const mat = own(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      fog: true,
      uniforms: { uTime: { value: 0 }, ...THREE.UniformsLib.fog },
      vertexShader: /* glsl */ `
        #include <fog_pars_vertex>
        varying vec3 vW;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          vec4 mvPosition = viewMatrix * w;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */ `
        #include <fog_pars_fragment>
        uniform float uTime; varying vec3 vW;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
          return mix(mix(h(i),h(i+vec2(1,0)),u.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x), u.y); }
        float fb(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<6;i++){ v+=a*n(p); p=p*2.03+17.0; a*=0.5; } return v; }
        void main() {
          vec2 p = vW.xz * 0.012 + vec2(uTime * 0.004, 0.0);
          float d = fb(p) ;
          float billow = fb(p * 2.6 + d * 1.8);
          float dens = smoothstep(0.32, 0.72, d * 0.7 + billow * 0.45);
          // Lit toward the sun ahead (-z), shadowed in the folds.
          float toward = clamp(-normalize(vW - cameraPosition).z, 0.0, 1.0);
          vec3 shade = vec3(0.30, 0.25, 0.28);
          vec3 lit = mix(vec3(1.0, 0.82, 0.62), vec3(1.0, 0.93, 0.8), toward);
          vec3 c = mix(shade, lit, smoothstep(0.35, 0.95, billow) * 0.85 + toward * 0.25);
          gl_FragColor = vec4(c, dens * 0.96);
          #include <fog_fragment>
        }`,
    }),
  );
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(own(new THREE.PlaneGeometry(3200, 3200)), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, -10 - i * 6, -300);
    m.renderOrder = -1 - i;
    g.add(m);
  }
  return { group: g, mat };
}

// A floating island: an inverted, eroded cone of rock with a grassed top and
// a few weathered towers.
function island(own, M, rand, r, h) {
  const geo = new THREE.ConeGeometry(r, h, 28, 16, false);
  geo.rotateX(Math.PI);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = 1 + (fbm(v.x * 0.18 + r, v.y * 0.25 + v.z * 0.18, 4) - 0.5) * 0.9;
    p.setXYZ(i, v.x * k, v.y + (fbm(v.x * 0.3, v.z * 0.3, 3) - 0.5) * (v.y > h * 0.45 ? 2 : 0), v.z * k);
  }
  geo.computeVertexNormals();
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = (p.getX(i) + p.getZ(i)) / 10;
    uv[i * 2 + 1] = p.getY(i) / 10;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  const g = new THREE.Group();
  g.add(new THREE.Mesh(own(geo), M.rock));
  const top = new THREE.Mesh(own(new THREE.CylinderGeometry(r * 0.92, r, 1.2, 28)), M.moss);
  top.position.y = h / 2 + 0.4;
  g.add(top);
  const towers = 1 + Math.floor(rand() * 3);
  for (let t = 0; t < towers; t++) {
    const th = 4 + rand() * r * 1.4;
    const tw = 1.2 + rand() * 2.2;
    const tower = new THREE.Mesh(own(new THREE.CylinderGeometry(tw * 0.7, tw, th, 8)), M.stone);
    tower.position.set((rand() - 0.5) * r, h / 2 + th / 2 + 0.6, (rand() - 0.5) * r);
    const cap = new THREE.Mesh(own(new THREE.ConeGeometry(tw * 0.95, th * 0.35, 8)), M.darkStone);
    cap.position.copy(tower.position).setY(tower.position.y + th / 2 + th * 0.17);
    g.add(tower, cap);
  }
  return g;
}

// A person, facing -z: torso, head and limbs that turn at hip and shoulder.
// `top` dresses the torso and arms, `legs` the legs; `fists` adds gloves.
function figure(own, { top, legs = top, arms = top, skin, pack, fists, scale = 1.15 }) {
  const cap = (r, l, mat) => new THREE.Mesh(own(new THREE.CapsuleGeometry(r, l, 6, 12)), mat);
  const fig = new THREE.Group();
  const torso = cap(0.21, 0.5, top);
  torso.position.y = 1.28;
  const head = new THREE.Mesh(own(new THREE.SphereGeometry(0.13, 20, 16)), skin);
  head.position.y = 1.72;
  fig.add(torso, head);
  if (pack) {
    const bag = new THREE.Mesh(own(new THREE.BoxGeometry(0.36, 0.48, 0.2)), pack);
    bag.position.set(0, 1.32, 0.22);
    fig.add(bag);
  }
  const limb = (x, y, len, r, mat, end) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const m = cap(r, len, mat);
    m.position.y = -len / 2 - r;
    pivot.add(m);
    if (end) {
      const e = new THREE.Mesh(own(new THREE.SphereGeometry(0.11, 16, 12)), end);
      e.position.y = -len - r * 2;
      pivot.add(e);
    }
    fig.add(pivot);
    return pivot;
  };
  const body = {
    group: fig,
    torso,
    legL: limb(-0.1, 0.92, 0.72, 0.085, legs),
    legR: limb(0.1, 0.92, 0.72, 0.085, legs),
    armL: limb(-0.27, 1.52, 0.5, 0.06, arms, fists),
    armR: limb(0.27, 1.52, 0.5, 0.06, arms, fists),
  };
  fig.scale.setScalar(scale);
  return body;
}

// The traveller: a figure with a backpack, seen from behind, who walks
// ahead of the camera through every world.
function traveller(own) {
  const cloth = own(new THREE.MeshStandardMaterial({ color: 0x23201d, roughness: 0.85 }));
  const skin = own(new THREE.MeshStandardMaterial({ color: 0x3b2a20, roughness: 0.7 }));
  const pack = own(new THREE.MeshStandardMaterial({ color: 0x2f2a24, roughness: 0.9 }));
  const b = figure(own, { top: cloth, skin, pack });
  return {
    group: b.group,
    pose(phase, stride) {
      const s = Math.sin(phase) * 0.55 * stride;
      b.legL.rotation.x = s;
      b.legR.rotation.x = -s;
      b.armL.rotation.x = -s * 0.7;
      b.armR.rotation.x = s * 0.7;
      b.group.position.y = Math.abs(Math.cos(phase)) * 0.04 * stride;
    },
  };
}

// A tileable ripple normal map, drawn once from a sum of waves whose
// frequencies are whole numbers, so it repeats without a seam.
function rippleNormals(own, rand) {
  const N = 256;
  const waves = Array.from({ length: 14 }, () => [Math.round((rand() - 0.5) * 16), Math.round((rand() - 0.5) * 16), rand() * 6.28, 0.4 + rand()]);
  const h = (x, y) => waves.reduce((s, [kx, ky, ph, a]) => s + (a * Math.sin(((kx * x + ky * y) / N) * 6.2832 + ph)) / (1 + Math.hypot(kx, ky) * 0.25), 0);
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d");
  const img = g.createImageData(N, N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = h(x + 1, y) - h(x - 1, y);
      const dy = h(x, y + 1) - h(x, y - 1);
      const l = Math.hypot(dx, dy, 1);
      const i = (y * N + x) * 4;
      img.data[i] = (-dx / l * 0.5 + 0.5) * 255;
      img.data[i + 1] = (-dy / l * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = own(new THREE.CanvasTexture(c));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// A sheet of water, its ripples one tile per `tile` metres whatever its size.
function waterPlane(own, mat, w, d, tile = 9) {
  const geo = new THREE.PlaneGeometry(w, d);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tile, (uv.getY(i) * d) / tile);
  const m = new THREE.Mesh(own(geo), mat);
  m.rotation.x = -Math.PI / 2;
  return m;
}

// A forest of pines on the slopes of a landscape, as one instanced mesh.
function forest(own, rand, kind, count, x0, x1, z0, z1, minH, tones) {
  const geo = own(new THREE.ConeGeometry(1, 1, 7));
  geo.translate(0, 0.5, 0);
  const mesh = new THREE.InstancedMesh(geo, own(new THREE.MeshStandardMaterial({ roughness: 1 })), count);
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  let n = 0;
  for (let tries = 0; tries < count * 12 && n < count; tries++) {
    const x = x0 + rand() * (x1 - x0);
    const z = z0 + rand() * (z1 - z0);
    if (Math.abs(x) < 14) continue;
    const y = landHeight(x, z, kind);
    const slope = Math.abs(landHeight(x + 2, z, kind) - y) + Math.abs(landHeight(x, z + 2, kind) - y);
    if (y < minH || y > 95 || slope > 1.8) continue;
    const ht = 5 + rand() * 11;
    m4.makeScale(ht * 0.27, ht, ht * 0.27).setPosition(x, y - 0.4, z);
    mesh.setMatrixAt(n, m4);
    mesh.setColorAt(n, col.setHex(tones[Math.floor(rand() * tones.length)]).multiplyScalar(0.8 + rand() * 0.4));
    n++;
  }
  mesh.count = n;
  return mesh;
}

// An additive cone of light, for shafts through dust.
function shaft(own, color, strength) {
  const mat = own(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: strength } },
      vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vV; varying float vH;
        void main(){ vH = uv.y; vec4 w = modelMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: /* glsl */ `uniform vec3 uColor; uniform float uStrength; varying vec3 vN; varying vec3 vV; varying float vH;
        void main(){ float e = pow(abs(dot(normalize(vN), vV)), 1.8); float f = smoothstep(0.0, 0.6, vH) * smoothstep(1.0, 0.9, vH);
        gl_FragColor = vec4(uColor * e * f * uStrength, 1.0); }`,
    }),
  );
  const geo = own(new THREE.ConeGeometry(1, 1, 32, 1, true));
  geo.translate(0, -0.5, 0);
  return (top, radius, length, tilt = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...top);
    m.scale.set(radius, length, radius);
    m.rotation.z = tilt;
    return m;
  };
}

export function buildRealm({ G, M, own, box, glow, tier }) {
  const rand = seeded(21);
  M.moss = own(new THREE.MeshStandardMaterial({ color: 0x4a5a2c, roughness: 1 }));
  // Water: rippled, so it breaks the sky it reflects into glints.
  const ripples = rippleNormals(own, seeded(77));
  M.water = own(new THREE.MeshStandardMaterial({ color: 0x1b5a72, metalness: 0.3, roughness: 0.07, normalMap: ripples, normalScale: new THREE.Vector2(0.35, 0.35) }));
  const updates = [(t) => ripples.offset.set(t * 0.03, t * 0.018)];
  const many = (full, lite) => (tier.shadows ? full : lite);

  // Craft that cross the sky slowly: a hull with a ring of light beneath.
  const hullGeo = own(new THREE.CylinderGeometry(3, 5, 1.4, 24));
  const lightGeo = own(new THREE.CylinderGeometry(2.6, 2.6, 0.2, 24));
  const underglow = glow(0xffc98a, 2.6);
  function fleet(g, rnd, n, y0, y1, z0, z1) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const c = new THREE.Group();
      const ring = new THREE.Mesh(lightGeo, underglow);
      ring.position.y = -0.8;
      c.add(new THREE.Mesh(hullGeo, M.steel), ring);
      c.scale.setScalar(1 + rnd() * 1.6);
      c.position.set(0, y0 + rnd() * (y1 - y0), z0 + rnd() * (z1 - z0));
      g.add(c);
      out.push({ c, off: rnd() * 900, sp: (rnd() < 0.5 ? -1 : 1) * (3 + rnd() * 5) });
    }
    updates.push((t) => out.forEach((o) => (o.c.position.x = (((o.off + t * o.sp) % 900) + 900) % 900 - 450)));
  }

  // Islands drifting in the air, bobbing slowly.
  function archipelago(g, rnd, n, xs, ys, zs) {
    const isles = [];
    for (let i = 0; i < n; i++) {
      const s = i % 2 ? 1 : -1;
      const r = 4 + rnd() * 13;
      const isl = island(own, M, rnd, r, r * (1.5 + rnd()));
      const base = new THREE.Vector3(s * (xs[0] + rnd() * (xs[1] - xs[0])), ys[0] + rnd() * (ys[1] - ys[0]), zs[0] + rnd() * (zs[1] - zs[0]));
      isl.position.copy(base);
      isl.rotation.y = rnd() * 6;
      g.add(isl);
      isles.push({ isl, base, ph: rnd() * 6, sp: 0.1 + rnd() * 0.15 });
    }
    updates.push((t) => isles.forEach((o) => (o.isl.position.y = o.base.y + Math.sin(t * o.sp + o.ph) * 1.6)));
  }

  // ---- The first door: a causeway over a sea of cloud ---------------------
  {
    const g = G.hall;
    const sea = cloudSea(own);
    g.add(sea.group);
    updates.push((t) => (sea.mat.uniforms.uTime.value = t));
    // The causeway: stone slabs on a rough plinth, leading to the door.
    g.add(box(11, 3, 170, M.rock, 0, -1.5, 80, 6));
    for (let z = 160; z > 2; z -= 3.2) g.add(box(9.4, 0.3, 3, M.granite, 0, 0.05, z, 3));
    for (let z = 150; z > 4; z -= 12) for (const s of [-1, 1]) g.add(box(0.7, 1.2 + rand() * 0.8, 0.7, M.darkStone, s * 5.2, 0.6, z, 2));
    // Floating islands drifting in the haze on either side.
    const isles = [];
    for (let i = 0; i < (tier.shadows ? 18 : 11); i++) {
      const s = i % 2 ? 1 : -1;
      const r = 5 + rand() * 16;
      const isl = island(own, M, rand, r, r * (1.6 + rand()));
      const base = new THREE.Vector3(s * (34 + rand() * 210), 8 + rand() * 70, 140 - rand() * 380);
      isl.position.copy(base);
      isl.rotation.y = rand() * 6;
      g.add(isl);
      isles.push({ isl, base, ph: rand() * 6, sp: 0.1 + rand() * 0.15 });
    }
    updates.push((t) => isles.forEach((o) => (o.isl.position.y = o.base.y + Math.sin(t * o.sp + o.ph) * 1.6)));
    // Warm light from behind the visitor, so the monolith and islands read as stone.
    const fill = new THREE.DirectionalLight(0xffc89a, 1.8);
    fill.position.set(60, 70, 260);
    fill.target.position.set(0, 30, 0);
    g.add(fill, fill.target);
    // Light burning along the edges of the first door.
    const edge = glow(0xffc070, 3.2);
    g.add(box(0.35, 27, 0.3, edge, -6.6, 13.5, 8.2), box(0.35, 27, 0.3, edge, 6.6, 13.5, 8.2), box(13.5, 0.35, 0.3, edge, 0, 27.1, 8.2));
  }

  // ---- Journey: a lake among pine-clad mountains --------------------------
  {
    const lake = waterPlane(own, M.water, 1500, 330);
    lake.position.set(0, 0.22, -165);
    G.journey.add(lake);
    G.journey.add(forest(own, seeded(31), "journey", many(2400, 1000), -460, 460, -6, -334, 1.2, [0x2c4527, 0x3a5430, 0x22382a, 0x4a5a2c]));
  }

  // ---- Ventures: a city at sunset, a spire, craft crossing the sky --------
  {
    const g = G.ventures;
    // The skyline: hundreds of lit towers beyond the avenue.
    const win = own(M.glass.emissiveMap.clone());
    win.repeat.set(3, 10);
    win.needsUpdate = true;
    const skyGlass = own(M.glass.clone());
    skyGlass.emissiveMap = win;
    const towerGeo = own(new THREE.BoxGeometry(1, 1, 1));
    towerGeo.translate(0, 0.5, 0);
    const n = many(340, 180);
    const city = new THREE.InstancedMesh(towerGeo, skyGlass, n);
    const cr = seeded(41);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const s = i % 2 ? 1 : -1;
      const w = 12 + cr() * 26;
      const h = 30 + Math.pow(cr(), 2) * 240;
      m4.makeScale(w, h, w * (0.7 + cr() * 0.6)).setPosition(s * (95 + Math.pow(cr(), 1.3) * 620), 0, -350 - cr() * 820);
      city.setMatrixAt(i, m4);
    }
    g.add(city);
    fleet(g, seeded(43), 8, 70, 170, -430, -900);
    const spire = box(9, 280, 9, M.glass, 70, 140, -560, 12);
    const ring = new THREE.Mesh(own(new THREE.TorusGeometry(26, 2.2, 16, 96)), M.steel);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(70, 210, -560);
    const disc = new THREE.Mesh(own(new THREE.CylinderGeometry(22, 18, 3, 64)), M.steel);
    disc.position.set(70, 205, -560);
    const tip = box(0.6, 60, 0.6, glow(0xffd29a, 2.2), 70, 310, -560);
    g.add(spire, ring, disc, tip);
    updates.push((t) => (ring.rotation.z = t * 0.05));
  }

  // ---- Discipline: a dark gym, shafts of light, a boxer at the heavy bag ---
  {
    const g = G.discipline;
    // The hall closed in: a roof, two walls, tall windows high in the left wall.
    g.add(box(86, 2, 292, M.ceiling, 0, 45, -785), box(2, 46, 292, M.darkStone, -42, 22, -785, 6), box(2, 46, 292, M.darkStone, 42, 22, -785, 6));
    const pane = glow(0xffe4bc, 2.8);
    const cone = shaft(own, 0xffd9a6, 0.85);
    for (let z = -676; z > -910; z -= 39) {
      g.add(box(0.3, 15, 7, pane, -40.8, 30, z));
      g.add(box(0.5, 15, 0.4, M.ceiling, -40.6, 30, z), box(0.5, 0.4, 7, M.ceiling, -40.6, 30, z));
      g.add(cone([-40, 30, z], 5.5, 52, 0.95));
    }
    // A low warm key from the windows onto the boxer.
    const key = new THREE.SpotLight(0xffd6a0, 16000, 0, 0.3, 0.7, 2);
    key.position.set(-38, 30, -740);
    key.target.position.set(7, 1.5, -748);
    g.add(key, key.target);
    // Hanging lamps down the far end.
    for (const z of [-820, -880]) {
      const p = new THREE.PointLight(0xffb870, 1400, 80, 2);
      p.position.set(0, 14, z);
      g.add(p, box(1.6, 0.5, 1.6, glow(0xffc887, 2.4), 0, 14.3, z), box(0.06, 30, 0.06, M.steel, 0, 29.5, z));
    }
    // The heavy bag and the boxer working it.
    const leather = own(new THREE.MeshStandardMaterial({ color: 0x141211, roughness: 0.45 }));
    const bagGeo = own(new THREE.CapsuleGeometry(0.42, 1.3, 8, 20));
    const hang = (x, z) => {
      const b = new THREE.Mesh(bagGeo, leather);
      b.position.set(x, 1.95, z);
      g.add(b, box(0.05, 42, 0.05, M.steel, x, 24, z));
      return b;
    };
    const bag = hang(8.05, -748);
    for (const [x, z] of [[10, -800], [-10, -812], [10, -846], [-10, -870]]) hang(x, z);
    const skin = own(new THREE.MeshStandardMaterial({ color: 0x5a3a28, roughness: 0.45 }));
    const vest = own(new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.7 }));
    const shorts = own(new THREE.MeshStandardMaterial({ color: 0x121214, roughness: 0.8 }));
    const gloves = own(new THREE.MeshStandardMaterial({ color: 0x9e1418, roughness: 0.35 }));
    const boxer = figure(own, { top: vest, legs: shorts, arms: skin, skin, fists: gloves, scale: 1.3 });
    boxer.group.position.set(6.5, 0, -748);
    boxer.group.rotation.y = -Math.PI / 2;
    boxer.torso.rotation.x = -0.15;
    boxer.legL.rotation.x = 0.32;
    boxer.legR.rotation.x = -0.28;
    const jab = (p) => Math.sin(Math.PI * Math.min(Math.max(p / 0.32, 0), 1));
    updates.push((t) => {
      const p = (t * 1.3) % 2;
      const l = jab(p);
      const r = jab(p - 1);
      boxer.armL.rotation.x = 1.2 + l * 0.4;
      boxer.armR.rotation.x = 1.2 + r * 0.4;
      boxer.armL.scale.y = 1 + l * 0.22;
      boxer.armR.scale.y = 1 + r * 0.22;
      boxer.group.position.y = Math.abs(Math.sin(t * 4)) * 0.03;
      bag.position.x = 8.05 + (jab(p - 0.12) + jab(p - 1.12)) * 0.05;
    });
    // A ring with ropes, set to one side.
    const rx = -28;
    const rz = -814;
    g.add(box(20, 1.4, 20, M.darkStone, rx, 0.7, rz, 3));
    const rope = own(new THREE.MeshStandardMaterial({ color: 0x8a1f1f, roughness: 0.6 }));
    for (const y of [2.6, 3.6, 4.6]) {
      g.add(box(19, 0.18, 0.18, rope, rx, y, rz - 9.5), box(19, 0.18, 0.18, rope, rx, y, rz + 9.5), box(0.18, 0.18, 19, rope, rx - 9.5, y, rz), box(0.18, 0.18, 19, rope, rx + 9.5, y, rz));
    }
    for (const [dx, dz] of [[-9.5, -9.5], [9.5, -9.5], [9.5, 9.5], [-9.5, 9.5]]) g.add(box(0.5, 4.4, 0.5, M.steel, rx + dx, 2.9, rz + dz));
  }

  // ---- Exploration: a sea between cliffs, crossed on a causeway -----------
  {
    const g = G.exploration;
    const sea = waterPlane(own, M.water, 2200, 400);
    sea.position.set(0, 2, -1125);
    g.add(sea);
    g.add(box(7, 3.6, 392, M.stone, 0, 1.2, -1126, 5));
    g.add(forest(own, seeded(33), "exploration", many(2600, 1100), -520, 520, -930, -1330, 3.2, [0x2a4a2a, 0x355a2e, 0x1f3b28, 0x46602f]));
  }

  // ---- Expression: a study, lined with books, a window onto the sunset ----
  {
    const g = G.expression;
    const count = tier.shadows ? 900 : 420;
    const books = new THREE.InstancedMesh(own(new THREE.BoxGeometry(1, 1, 1)), own(new THREE.MeshStandardMaterial({ roughness: 0.8 })), count);
    const m4 = new THREE.Matrix4();
    const col = new THREE.Color();
    const tones = [0x5a2e22, 0x2f3b2c, 0x6b5235, 0x23314a, 0x7a6248, 0x3d2a1e, 0x8b7355];
    let i = 0;
    for (const side of [-1, 1]) {
      for (let shelf = 0; shelf < 7; shelf++) {
        const y = 1 + shelf * 2.2;
        g.add(box(0.6, 0.12, 112, M.darkStone, side * 9.2, y - 0.06, -1380, 2));
        let z = -1324;
        while (z > -1436 && i < count) {
          const w = 0.18 + rand() * 0.22;
          const hgt = 1.2 + rand() * 0.7;
          m4.makeScale(0.9, hgt, w).setPosition(side * 9.1, y + hgt / 2, z - w / 2);
          books.setMatrixAt(i, m4);
          books.setColorAt(i, col.setHex(tones[Math.floor(rand() * tones.length)]));
          z -= w + 0.03;
          i++;
          if (rand() < 0.04) z -= 1.5;
        }
      }
    }
    books.count = i;
    g.add(books);
    // A tall window in the left wall, glowing with the evening outside.
    g.add(box(0.2, 11, 9, glow(0xffc489, 1.6), -9.6, 7, -1404));
    for (const dz of [-3, 0, 3]) g.add(box(0.4, 11, 0.25, M.darkStone, -9.4, 7, -1404 + dz));
    // A writing desk: a laptop, a lamp, a plant, and someone at work.
    const wood = own(new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: 0.55 }));
    const dx = 4.4;
    const dz = -1374;
    g.add(box(4.2, 0.12, 1.9, wood, dx, 1.75, dz, 2));
    for (const [ox, oz] of [[-1.95, -0.8], [1.95, -0.8], [-1.95, 0.8], [1.95, 0.8]]) g.add(box(0.12, 1.7, 0.12, wood, dx + ox, 0.85, dz + oz));
    g.add(box(1.1, 0.05, 0.75, M.steel, dx - 0.2, 1.835, dz + 0.1));
    const screen = box(1.1, 0.72, 0.04, glow(0xa8c8ff, 1.5), dx - 0.2, 2.2, dz - 0.3);
    screen.rotation.x = -0.18;
    g.add(screen);
    const lamp = new THREE.PointLight(0xffc27a, 16, 16, 2);
    lamp.position.set(dx + 1.55, 2.75, dz - 0.4);
    const shade = new THREE.Mesh(own(new THREE.ConeGeometry(0.32, 0.36, 24, 1, true)), glow(0xffcf94, 2.2));
    shade.position.set(dx + 1.55, 2.85, dz - 0.4);
    g.add(lamp, shade, box(0.05, 1, 0.05, M.bronze, dx + 1.55, 2.3, dz - 0.4), box(0.4, 0.05, 0.4, M.bronze, dx + 1.55, 1.83, dz - 0.4));
    const leaves = new THREE.Mesh(own(new THREE.IcosahedronGeometry(0.42, 1)), own(new THREE.MeshStandardMaterial({ color: 0x3c5a2a, roughness: 0.9, flatShading: true })));
    leaves.position.set(dx - 1.6, 2.35, dz - 0.5);
    g.add(leaves, box(0.36, 0.42, 0.36, M.darkStone, dx - 1.6, 2.02, dz - 0.5));
    // A stack of books at the corner of the desk.
    for (let b = 0; b < 4; b++) g.add(box(0.7 - b * 0.05, 0.1, 0.5, own(new THREE.MeshStandardMaterial({ color: [0x5a2e22, 0x23314a, 0x6b5235, 0x2f3b2c][b], roughness: 0.8 })), dx + 0.9, 1.86 + b * 0.1, dz + 0.45));
    // Chair and writer.
    g.add(box(1.1, 0.12, 1, wood, dx - 0.2, 1.1, dz + 1.6), box(1.1, 1.5, 0.12, wood, dx - 0.2, 1.9, dz + 2.15));
    const sweater = own(new THREE.MeshStandardMaterial({ color: 0x2b2a2e, roughness: 0.9 }));
    const jeans = own(new THREE.MeshStandardMaterial({ color: 0x1d2230, roughness: 0.85 }));
    const writer = figure(own, { top: sweater, legs: jeans, skin: own(new THREE.MeshStandardMaterial({ color: 0x6e4a33, roughness: 0.6 })), scale: 1.5 });
    writer.group.position.set(dx - 0.2, -0.23, dz + 1.45);
    writer.legL.rotation.x = writer.legR.rotation.x = 1.45;
    updates.push((t) => {
      writer.armL.rotation.x = 1.35 + Math.sin(t * 9) * 0.03;
      writer.armR.rotation.x = 1.35 + Math.sin(t * 9 + 2) * 0.03;
    });
  }

  // ---- Ideas: an open court under the stars; a planet above the last door -
  {
    const g = G.ideas;
    const starGeo = new THREE.BufferGeometry();
    const n = 2400;
    const pos = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(rand() * 0.9);
      pos.set([Math.sin(ph) * Math.cos(th) * 3000, Math.cos(ph) * 3000, -1600 + Math.sin(ph) * Math.sin(th) * 3000], k * 3);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.add(new THREE.Points(own(starGeo), own(new THREE.PointsMaterial({ color: 0xdfe8ff, size: 3, sizeAttenuation: false, fog: false }))));
    const planet = new THREE.Mesh(
      own(new THREE.SphereGeometry(70, 64, 48)),
      own(new THREE.ShaderMaterial({
        fog: false,
        uniforms: {},
        vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vV; varying vec3 vP;
          void main(){ vP = position; vec4 w = modelMatrix*vec4(position,1.0); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix*viewMatrix*w; }`,
        fragmentShader: /* glsl */ `varying vec3 vN; varying vec3 vV; varying vec3 vP;
          float h(vec3 p){ return fract(sin(dot(p, vec3(12.9,78.2,37.7))) * 43758.5); }
          void main(){
            vec3 L = normalize(vec3(-0.6, 0.3, 0.8));
            float d = clamp(dot(vN, L), 0.0, 1.0);
            float bands = 0.5 + 0.5 * sin(vP.y * 0.25 + sin(vP.x * 0.05) * 2.0);
            vec3 base = mix(vec3(0.16,0.2,0.32), vec3(0.45,0.55,0.78), bands);
            float rim = pow(1.0 - abs(dot(vN, vV)), 3.0);
            gl_FragColor = vec4(base * (0.08 + d) + vec3(0.5,0.65,1.0) * rim * 1.4, 1.0);
          }`,
      })),
    );
    planet.position.set(-50, 170, -2100);
    g.add(planet);
    const moon = new THREE.Mesh(own(new THREE.SphereGeometry(9, 32, 24)), own(new THREE.MeshBasicMaterial({ color: 0xcfd8ec, fog: false })));
    moon.position.set(110, 140, -1900);
    const moonLight = new THREE.DirectionalLight(0xb9c8ff, 1.4);
    moonLight.position.set(-150, 175, -2000);
    moonLight.target.position.set(0, 0, -1600);
    g.add(moonLight, moonLight.target);
    g.add(moon);
    updates.push((t) => (planet.rotation.y = t * 0.02));
    // A night sea below the court, and islands adrift among the stars.
    const sea = waterPlane(own, M.water, 4000, 1600, 22);
    sea.position.set(0, -6, -1800);
    g.add(sea);
    archipelago(g, seeded(51), many(14, 9), [55, 300], [24, 150], [-1600, -2250]);
  }

  // ---- The light beyond: a split door standing in a sea at sunset ---------
  const halves = [];
  {
    const g = G.light;
    const sea = waterPlane(own, M.water, 4000, 1400, 26);
    sea.position.set(0, -0.2, -2100);
    g.add(sea);
    // Two halves of a great disc of stone, parting on the light behind.
    const R = 46;
    const core = glow(0xffd9a0, 1.6);
    for (const s of [1, -1]) {
      const half = new THREE.Group();
      const disc = new THREE.Mesh(own(new THREE.CylinderGeometry(R, R, 10, 96, 1, false, s > 0 ? 0 : Math.PI, Math.PI)), M.darkStone);
      disc.rotation.x = Math.PI / 2;
      half.add(disc);
      for (const [r, tube] of [[R - 4, 0.9], [R - 13, 0.7], [R - 24, 1.1], [R - 34, 0.6]]) {
        const ring = new THREE.Mesh(own(new THREE.TorusGeometry(r, tube, 10, 80, Math.PI)), M.bronze);
        ring.rotation.z = -s * Math.PI / 2;
        ring.position.z = 5;
        half.add(ring);
      }
      // The cut face burns with the light it held.
      half.add(box(0.7, R * 2, 10.4, core, s * 0.35, 0, 0));
      half.position.set(38, 34, -2060);
      g.add(half);
      halves.push({ half, s });
    }
    const light = box(30, R * 2 - 6, 0.5, glow(0xffe7c2, 1.7), 38, 34, -2066);
    g.add(light);
    halves.push({ light });
    // A far skyline, and islands and craft in the evening air.
    const sil = new THREE.InstancedMesh(own(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)), own(new THREE.MeshStandardMaterial({ color: 0x2c2420, roughness: 1 })), 120);
    const sr = seeded(63);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 120; i++) {
      const s = i % 2 ? 1 : -1;
      m4.makeScale(6 + sr() * 16, 5 + Math.pow(sr(), 2) * 34, 10).setPosition(s * (70 + sr() * 900), -1, -2330 - sr() * 90);
      sil.setMatrixAt(i, m4);
    }
    g.add(sil);
    archipelago(g, seeded(61), many(10, 7), [70, 320], [26, 110], [-1960, -2280]);
    fleet(g, seeded(65), 5, 50, 120, -1950, -2250);
  }

  const walker = traveller(own);
  const smooth = (a, b, v) => {
    const x = Math.min(Math.max((v - a) / (b - a), 0), 1);
    return x * x * (3 - 2 * x);
  };
  return {
    walker,
    // `t` is time in seconds; `journey` is the scroll position along the sections.
    update(t, journey = 0) {
      updates.forEach((f) => f(t));
      const open = smooth(7.15, 8, journey);
      for (const h of halves) {
        if (h.half) {
          h.half.position.x = 38 + h.s * (1.5 + open * 9);
          h.half.rotation.y = -h.s * open * 0.12;
        } else h.light.scale.x = 0.1 + open * 0.9;
      }
    },
  };
}
