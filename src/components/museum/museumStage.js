import * as THREE from "three";
import { optSrc } from "@/lib/content/images";
import { camera, layout, throughCamera } from "./geometry";

// Draws the gallery with rooms inside rooms: every pixel that falls in the
// niche is re-projected into the room behind it, a few levels deep, so the
// visitor sees the corridor of doorways ahead. One photograph, one quad.

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D photo;
  uniform vec2 res;
  uniform float dpr;
  uniform vec2 center;
  uniform float scale;
  uniform vec2 fitOrigin;
  uniform vec2 fitSize;
  uniform vec4 niche;      // x0, x1, springY, sillY
  uniform float radius;
  uniform vec2 endCenter;
  uniform float childScale;
  uniform float depthLeft;
  uniform vec2 thruCenter;
  uniform float thruScale;
  uniform float reveal;

  bool inside(vec2 p) {
    if (p.x < niche.x || p.x > niche.y || p.y > niche.w) return false;
    if (p.y >= niche.z) return true;
    return distance(p, vec2((niche.x + niche.y) * 0.5, niche.z)) <= radius;
  }

  // How far a point is from the niche's edge, in level pixels.
  float edge(vec2 p) {
    float d = min(min(p.x - niche.x, niche.y - p.x), niche.w - p.y);
    if (p.y < niche.z) d = min(d, radius - distance(p, vec2((niche.x + niche.y) * 0.5, niche.z)));
    return d;
  }

  void main() {
    vec2 f = vec2(gl_FragCoord.x, res.y * dpr - gl_FragCoord.y) / dpr;
    vec2 p = center + (f - res * 0.5) * scale;
    float light = 1.0;
    float width = niche.y - niche.x;
    for (int i = 0; i < 6; i++) {
      if (float(i) >= depthLeft || !inside(p)) break;
      // The reveal of the doorway: the light falls off where the wall turns in,
      // and each room further away a touch dimmer, as light falls off.
      light *= mix(0.62, 1.0, smoothstep(0.0, width * 0.07, edge(p))) * 0.94;
      // The first doorway is seen with real parallax; rooms further in nest.
      p = i == 0 ? thruCenter + (f - res * 0.5) * thruScale : (p - endCenter) / childScale + res * 0.5;
    }
    vec2 uv = clamp((p - fitOrigin) / fitSize, vec2(0.0005), vec2(0.9995));
    uv.y = 1.0 - uv.y; // textures start at the bottom; level pixels at the top
    vec3 col = texture2D(photo, uv).rgb * light;
    // A whisper of vignette, like a lens in a white room.
    float v = distance(f / res, vec2(0.5));
    col *= mix(1.0, smoothstep(1.0, 0.3, v), 0.16);
    col = mix(vec3(0.955, 0.955, 0.95), col, reveal);
    gl_FragColor = vec4(col, 1.0);
  }`;

export function createMuseumStage(canvas, { src, rooms, onFrame, reducedMotion = false }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const uniforms = {
    photo: { value: null },
    res: { value: new THREE.Vector2(1, 1) },
    dpr: { value: dpr },
    center: { value: new THREE.Vector2() },
    scale: { value: 1 },
    fitOrigin: { value: new THREE.Vector2() },
    fitSize: { value: new THREE.Vector2(1, 1) },
    niche: { value: new THREE.Vector4() },
    radius: { value: 1 },
    endCenter: { value: new THREE.Vector2() },
    childScale: { value: 1 },
    depthLeft: { value: 0 },
    thruCenter: { value: new THREE.Vector2() },
    thruScale: { value: 1 },
    reveal: { value: reducedMotion ? 1 : 0 },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, depthTest: false, depthWrite: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  const scene = new THREE.Scene();
  scene.add(quad);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // A sharp photograph for the walk in; a light one first so the room shows at once.
  const loader = new THREE.TextureLoader();
  const setTexture = (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const old = uniforms.photo.value;
    uniforms.photo.value = tex;
    old?.dispose();
    dirty = true;
  };
  let sharp = false;
  loader.load(optSrc(src, 1600), (t) => !sharp && setTexture(t));
  loader.load(optSrc(src, 4000), (t) => {
    sharp = true;
    setTexture(t);
  });

  let L = null;
  let walk = 0;
  let walkShown = 0;
  let reveal = reducedMotion ? 1 : 0;
  let dirty = true;
  let raf = 0;
  let last = performance.now();
  let running = true;

  function resize() {
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (!W || !H) return;
    renderer.setSize(W, H, false);
    L = layout(W, H);
    uniforms.res.value.set(W, H);
    uniforms.fitOrigin.value.set(L.fit.ox, L.fit.oy);
    uniforms.fitSize.value.set(L.fit.dw, L.fit.dh);
    uniforms.niche.value.set(L.niche.x0, L.niche.x1, L.niche.springY, L.niche.sillY);
    uniforms.radius.value = L.niche.radius;
    uniforms.endCenter.value.set(...L.endCenter);
    uniforms.childScale.value = L.childScale;
    dirty = true;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const maxWalk = rooms - 1 + 0.38;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!running || !L || !uniforms.photo.value) return;
    const dt = Math.min(Math.max((now - last) / 1000, 0), 0.1);
    last = now;
    const before = walkShown;
    walkShown += (walk - walkShown) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 5));
    if (Math.abs(walk - walkShown) < 1e-4) walkShown = walk;
    if (reveal < 1) reveal = Math.min(1, reveal + dt / 1.6);
    if (!dirty && walkShown === before && reveal === uniforms.reveal.value) return;
    dirty = false;

    const t = Math.min(Math.max(walkShown, 0), maxWalk);
    const level = Math.min(Math.floor(t), rooms - 1);
    const u = t - level;
    // The opening: the camera settles back from a step inside the room.
    const settle = reducedMotion ? 0 : (1 - reveal) * (1 - reveal);
    const c = camera(L, u);
    const scale = c.scale * (1 - 0.12 * settle);
    uniforms.center.value.set(...c.center);
    uniforms.scale.value = scale;
    const thru = throughCamera(L, { center: c.center, scale }, u);
    uniforms.thruCenter.value.set(...thru.center);
    uniforms.thruScale.value = thru.scale;
    uniforms.depthLeft.value = rooms - 1 - level;
    uniforms.reveal.value = reveal;
    renderer.render(scene, cam);
    onFrame?.({ level, u, camera: { center: c.center, scale: uniforms.scale.value }, layout: L });
  }
  raf = requestAnimationFrame(frame);

  const onVisibility = () => {
    running = !document.hidden;
    last = performance.now();
  };
  document.addEventListener("visibilitychange", onVisibility);

  return {
    setWalk(v) {
      walk = v;
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      uniforms.photo.value?.dispose();
      quad.geometry.dispose();
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
