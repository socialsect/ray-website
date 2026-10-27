import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

// The anatomical brain (Brain AS, Agnieszka Starostecka, CC BY 4.0),
// simplified and compressed by scripts/build-brain.mjs.
async function loadBrain(url) {
  const [buf] = await Promise.all([fetch(url).then((r) => r.arrayBuffer()), MeshoptDecoder.ready]);
  const head = new Uint32Array(buf, 0, 4);
  const [vcount, icount, vbytes, ibytes] = head;
  const vsrc = new Uint8Array(buf, 16, vbytes);
  const isrc = new Uint8Array(buf, 16 + vbytes, ibytes);
  const q = new Int16Array(vcount * 4);
  MeshoptDecoder.decodeVertexBuffer(new Uint8Array(q.buffer), vcount, 8, vsrc);
  const indices = new Uint32Array(icount);
  MeshoptDecoder.decodeIndexBuffer(new Uint8Array(indices.buffer), icount, 4, isrc);
  const pos = new Float32Array(vcount * 3);
  for (let i = 0; i < vcount; i++) for (let k = 0; k < 3; k++) pos[i * 3 + k] = q[i * 4 + k] / 32767;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(indices, 1));
  // The scan is Z-up; the web is Y-up.
  g.rotateX(-Math.PI / 2);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

const NOISE = /* glsl */ `
  vec3 hash3(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }
  float gnoise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(dot(hash3(i), f), dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                   mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)), dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
               mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)), dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                   mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)), dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
  }`;

export function createBrainScene(canvas, { regions, lite = false, reducedMotion = false, onReady }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  let dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);
  scene.fog = new THREE.FogExp2(0x05060a, 0.06);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.5;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 80);

  // Cinematic three-point light: warm key, electric-blue rim, violet kicker.
  const key = new THREE.SpotLight(0xfff1e2, 0, 30, 0.5, 0.6, 1.4);
  key.position.set(-3.5, 4.5, 4.5);
  const rim = new THREE.DirectionalLight(0x5e8bff, 0);
  rim.position.set(3.5, 1.5, -4);
  const kicker = new THREE.DirectionalLight(0x9a7dff, 0);
  kicker.position.set(-4, -2, -2.5);
  const fill = new THREE.HemisphereLight(0x8fa2c8, 0x0a0a12, 0);
  scene.add(key, key.target, rim, kicker, fill);

  const uniforms = {
    uTime: { value: 0 },
    uSweep: { value: reducedMotion ? 2 : -2 },
    uActivity: { value: reducedMotion ? 0.6 : 0 },
    uRegionPos: { value: regions.map(() => new THREE.Vector3()) },
    uRegionColor: { value: regions.map((r) => new THREE.Color(r.color)) },
    uRegionGlow: { value: regions.map(() => 0) },
    uMap: { value: 0 },
  };

  // A deep, glassy cortex: dark blue tissue that the light and the neural
  // activity paint from within.
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x1a2350,
    roughness: 0.32,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    sheen: 1,
    sheenRoughness: 0.35,
    sheenColor: new THREE.Color(0x6f8cff),
    iridescence: 0.35,
    iridescenceIOR: 1.4,
  });
  const N = regions.length;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObj;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObj = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vObj;
        uniform float uTime; uniform float uSweep; uniform float uActivity;
        uniform vec3 uRegionPos[${N}]; uniform vec3 uRegionColor[${N}]; uniform float uRegionGlow[${N}];
        uniform float uMap;
        ${NOISE}`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        {
          // Neural pathways: thin filaments where a slow noise field crosses zero.
          float n = gnoise(vObj * 3.1 + vec3(0.0, uTime * 0.05, 0.0));
          float n2 = gnoise(vObj * 6.3 - vec3(uTime * 0.03));
          float filament = (1.0 - smoothstep(0.0, 0.03, abs(n))) * smoothstep(-0.2, 0.35, n2);
          // Signals travel along them; where they peak, warm sparks fire.
          float pulse = pow(0.5 + 0.5 * sin(dot(vObj, vec3(4.0, 2.7, 3.3)) * 2.2 - uTime * 1.6), 6.0);
          float spark = pow(max(0.0, gnoise(vObj * 9.0 + vec3(uTime * 0.4))), 3.0) * 40.0 * filament;
          vec3 neural = (vec3(0.32, 0.5, 1.0) * filament * (0.6 + 2.6 * pulse) + vec3(1.0, 0.55, 0.22) * spark * (0.9 + 2.0 * pulse)) * uActivity;
          // A glassy rim: light caught at the edges of the folds.
          float rim = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), 2.4);
          neural += mix(vec3(0.3, 0.42, 1.0), vec3(0.62, 0.42, 1.0), 0.5 + 0.5 * vObj.y) * rim * 0.9 * uActivity;
          // The map: each chapter's region in its colour, with lit borders.
          float best = 1e9; float second = 1e9; vec3 mapColor = vec3(0.0);
          for (int i = 0; i < ${N}; i++) {
            float d = distance(vObj, uRegionPos[i]);
            if (d < best) { second = best; best = d; mapColor = uRegionColor[i]; } else if (d < second) { second = d; }
          }
          float border = 1.0 - smoothstep(0.0, 0.035, second - best);
          // In map mode the cortex takes its region's colour; the blue network dims.
          neural = mix(neural, neural * 0.35, uMap);
          neural += uMap * (mapColor * (0.1 + 0.55 * filament + 0.4 * pulse * filament) + mapColor * border * 0.45);
          vec3 regionLight = vec3(0.0);
          for (int i = 0; i < ${N}; i++) {
            float d = distance(vObj, uRegionPos[i]);
            float halo = exp(-d * d * 14.0);
            float ring = exp(-pow((d - mod(uTime * 0.45, 1.0) * 0.9) * 12.0, 2.0)) * (1.0 - smoothstep(0.2, 0.9, d));
            regionLight += uRegionColor[i] * uRegionGlow[i] * (halo * 0.55 + filament * halo * 2.4 + ring * 0.5);
          }
          // The opening: a blade of light sweeps across the surface.
          float sweep = exp(-pow((vObj.x - uSweep) * 6.0, 2.0));
          totalEmissiveRadiance += neural + regionLight + vec3(0.75, 0.85, 1.0) * sweep * 0.7;
        }`,
      );
  };

  const brain = new THREE.Group();
  scene.add(brain);
  let mesh = null;

  // Dust in the void, only a little, catching the rim light.
  const dustCount = lite ? 260 : 700;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const r = 2 + Math.random() * 9;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    dustPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    dustPos[i * 3 + 1] = (r * Math.cos(ph)) * 0.6;
    dustPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) - 2;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xb9c8ff, size: 0.018, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // A faint volumetric halo behind the brain.
  const haloMat = new THREE.SpriteMaterial({
    map: (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const x = c.getContext("2d");
      const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgba(90,120,255,0.55)");
      g.addColorStop(0.4, "rgba(70,60,160,0.18)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g;
      x.fillRect(0, 0, 128, 128);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 64),
    new THREE.MeshBasicMaterial({ map: haloMat.map, color: 0x6f8cff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = -0.95;
  pool.scale.set(1.6, 1, 0.55);
  scene.add(pool);
  const halo = new THREE.Sprite(haloMat);
  halo.scale.setScalar(5.5);
  halo.position.set(0, 0, -1.6);
  scene.add(halo);

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: lite ? 0 : 4 }));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.75, 0.45, 0.42);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Camera rig: an orbit around the brain, driven by the page.
  const rig = { yaw: 0.0, pitch: 0.05, dist: 5.2, x: 0, y: 0, roll: 0 };
  const want = { ...rig };
  const intro = { t: reducedMotion ? 1 : 0 };
  const pointer = new THREE.Vector2();
  const pointerSmooth = new THREE.Vector2();
  const regionLocal = regions.map(() => new THREE.Vector3());
  let hover = -1;
  let mapWant = 0;
  let mapNow = 0;
  let paused = false;
  let active = -1;
  let width = 1;
  let height = 1;
  let raf = 0;
  let last = performance.now();
  let running = true;
  let frames = 0;
  let slow = 0;
  let degraded = lite;

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    composer.setPixelRatio(dpr);
    composer.setSize(width, height);
    bloom.resolution.set(width / 2, height / 2);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // Anchor each region on the actual surface: cast from the centre outwards.
  function placeRegions() {
    const ray = new THREE.Raycaster();
    regions.forEach((r, i) => {
      const dir = new THREE.Vector3(...r.dir).normalize();
      ray.set(dir.clone().multiplyScalar(3), dir.clone().negate());
      const hit = ray.intersectObject(mesh, false)[0];
      regionLocal[i].copy(hit ? hit.point : dir.multiplyScalar(0.8));
      uniforms.uRegionPos.value[i].copy(regionLocal[i]);
    });
  }

  loadBrain(lite ? "/assets/brain/brain-lite.bin" : "/assets/brain/brain.bin")
    .then((geo) => {
      mesh = new THREE.Mesh(geo, material);
      brain.add(mesh);
      mesh.updateMatrixWorld();
      placeRegions();
      onReady?.();
    })
    .catch((e) => console.warn("Brain model failed to load", e));

  const tmp = new THREE.Vector3();
  const screen = regions.map(() => ({ x: 0, y: 0, visible: false, facing: 0 }));

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!running || paused) {
      last = now;
      return;
    }
    const raw = (now - last) / 1000;
    const dt = Math.min(Math.max(raw, 0), 0.1);
    last = now;
    if (!degraded && ++frames > 5 && frames < 160) {
      if (raw > 0.04) slow++;
      if (slow > 18) {
        degraded = true;
        bloom.strength = 0.35;
        dpr = 1;
        renderer.setPixelRatio(1);
        resize();
      }
    }
    const t = now / 1000;
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 2.4);

    // Opening sequence, as uniforms of one progress value (0..1, ~5 s).
    if (!reducedMotion && mesh && intro.t < 1) intro.t = Math.min(1, intro.t + dt / 5.2);
    const p = intro.t;
    const s = (a, b) => THREE.MathUtils.smoothstep(p, a, b);
    dustMat.opacity = 0.55 * s(0.0, 0.25);
    haloMat.opacity = 0.75 * s(0.05, 0.4) * (1 - 0.6 * mapNow);
    pool.material.opacity = 0.9 * s(0.3, 0.7);
    mapNow += (mapWant - mapNow) * k;
    uniforms.uMap.value = mapNow;
    key.intensity = 340 * s(0.18, 0.55) * (1 - 0.6 * mapNow);
    rim.intensity = 5.5 * s(0.1, 0.45);
    kicker.intensity = 1.6 * s(0.25, 0.6);
    fill.intensity = 0.9 * s(0.2, 0.6);
    uniforms.uSweep.value = reducedMotion ? 3 : THREE.MathUtils.lerp(-1.6, 1.8, s(0.15, 0.55));
    uniforms.uActivity.value = reducedMotion ? 0.55 : s(0.45, 0.8) * (0.8 + 0.2 * Math.sin(t * 0.7));
    const introDist = THREE.MathUtils.lerp(8.5, 0, s(0.1, 0.9));

    // Camera: follows the chapter's framing, drifts with the pointer.
    for (const key2 of Object.keys(rig)) rig[key2] += (want[key2] - rig[key2]) * k;
    pointerSmooth.lerp(pointer, reducedMotion ? 0 : 1 - Math.exp(-dt * 2));
    // A slow sway, never a drift: the framing always returns to its view.
    const yaw = rig.yaw + pointerSmooth.x * 0.18 + (reducedMotion ? 0 : Math.sin(t * 0.12) * 0.1);
    const pitch = rig.pitch - pointerSmooth.y * 0.1;
    const d = rig.dist + introDist;
    camera.position.set(Math.sin(yaw) * Math.cos(pitch) * d, Math.sin(pitch) * d, Math.cos(yaw) * Math.cos(pitch) * d);
    camera.lookAt(0, 0, 0);
    // Frame the brain off-centre so text has room beside it.
    camera.setViewOffset(width, height, -rig.x * width, -rig.y * height, width, height);

    if (!reducedMotion) {
      brain.rotation.y = Math.sin(t * 0.18) * 0.04;
      dust.rotation.y = t * 0.008;
    }
    uniforms.uTime.value = reducedMotion ? 4 : t;

    regions.forEach((_, i) => {
      const target = i === active ? 1 : i === hover ? 0.75 : 0;
      uniforms.uRegionGlow.value[i] += (target - uniforms.uRegionGlow.value[i]) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 6));
      if (!mesh) return;
      tmp.copy(regionLocal[i]).applyMatrix4(brain.matrixWorld);
      const normal = tmp.clone().normalize();
      const toCam = camera.position.clone().sub(tmp).normalize();
      screen[i].facing = normal.dot(toCam);
      tmp.project(camera);
      screen[i].x = (tmp.x * 0.5 + 0.5) * width;
      screen[i].y = (-tmp.y * 0.5 + 0.5) * height;
      screen[i].visible = mesh && p > 0.75 && screen[i].facing > 0.12;
    });
    composer.render();
  }
  raf = requestAnimationFrame(frame);

  const onVis = () => {
    running = !document.hidden;
    last = performance.now();
  };
  document.addEventListener("visibilitychange", onVis);

  return {
    screen,
    get introProgress() {
      return intro.t;
    },
    skipIntro() {
      intro.t = 1;
    },
    setView(v) {
      Object.assign(want, v);
    },
    setMap(v) {
      mapWant = v;
    },
    setPaused(v) {
      paused = v;
    },
    setHover(i) {
      hover = i;
    },
    setActive(i) {
      active = i;
    },
    setPointer(x, y) {
      pointer.set(x, y);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      mesh?.geometry.dispose();
      material.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      pool.geometry.dispose();
      pool.material.dispose();
      haloMat.map.dispose();
      haloMat.dispose();
      env.dispose();
      composer.dispose();
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
