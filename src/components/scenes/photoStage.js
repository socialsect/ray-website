import * as THREE from "three";
import { optSrc } from "@/lib/content/images";

// A full-screen photographic stage: real photographs of real places, framed
// like cinema. While a chapter is read its photograph pushes in slowly; between
// chapters a scroll-scrubbed displacement dissolve melts one place into the
// next. Same interface as a 3D scene, so the page drives it the same way.

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D tA;
  uniform sampler2D tB;
  uniform vec2 sizeA;
  uniform vec2 sizeB;
  uniform vec2 focusA;
  uniform vec2 focusB;
  uniform float zoomA;
  uniform float zoomB;
  uniform float mixAB;
  uniform vec2 res;
  uniform vec2 pointer;
  uniform float shift;
  uniform float time;
  uniform float grain;
  uniform float reveal;
  uniform float darkGrade;
  // Depth: for photographs with a single vanishing point, depth is read from
  // the perspective itself, so a camera move behaves like a real one.
  uniform vec2 vpA;
  uniform vec2 vpB;
  uniform float depthA;
  uniform float depthB;
  uniform float dollyA;
  uniform float dollyB;
  uniform vec2 sway;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  // Cover-fit a photograph to the screen around its focal point, zoomed.
  vec2 frameUv(vec2 uv, vec2 size, vec2 focus, float zoom) {
    float sr = res.x / res.y;
    float ir = size.x / size.y;
    vec2 scale = sr > ir ? vec2(1.0, ir / sr) : vec2(sr / ir, 1.0);
    return focus + (uv - 0.5) * scale / zoom;
  }
  vec2 cover(vec2 uv, vec2 size, vec2 focus, float zoom) {
    return clamp(frameUv(uv, size, focus, zoom), vec2(0.001), vec2(0.999));
  }

  // Depth-aware framing. Distance from the vanishing point stands in for
  // nearness: walls and pavement are near, the horizon is far. A dolly
  // spreads near surfaces faster than far ones; parallax moves near ones more.
  vec2 deepUv(vec2 uv, vec2 size, vec2 focus, float zoom, vec2 vp, float dolly) {
    vec2 p = frameUv(uv, size, focus, zoom);
    vec2 d = p - vp;
    float near = smoothstep(0.03, 0.62, length(d * vec2(1.0, 1.35)));
    p = vp + d / (1.0 + dolly * (0.12 + near * 1.1));
    p -= (pointer + sway) * near * 0.024;
    return clamp(p, vec2(0.001), vec2(0.999));
  }
  vec2 sampleA(vec2 uv, float zoom) {
    return depthA > 0.5 ? deepUv(uv, sizeA, focusA, zoom, vpA, dollyA) : cover(uv, sizeA, focusA, zoom);
  }
  vec2 sampleB(vec2 uv, float zoom) {
    return depthB > 0.5 ? deepUv(uv, sizeB, focusB, zoom, vpB, dollyB) : cover(uv, sizeB, focusB, zoom);
  }

  void main() {
    vec2 uv = vUv;
    // Parallax: the frame drifts a little with the pointer; on wide screens
    // the subject sits right of centre, beside the text.
    vec2 drift = pointer * 0.012 + vec2(-shift * 0.07, 0.0);

    float t = mixAB;
    vec3 col;
    if (t < 0.001) {
      col = texture2D(tA, sampleA(uv + drift, zoomA)).rgb;
    } else if (t > 0.999) {
      col = texture2D(tB, sampleB(uv + drift, zoomB)).rgb;
    } else {
      // Displacement: the outgoing image is pulled along a noise field and
      // dissolves along a moving edge; the incoming one settles into place.
      float n = fbm(uv * 3.2 + time * 0.03);
      float edge = smoothstep(t - 0.18, t + 0.18, n * 0.7 + uv.x * 0.15 + 0.08);
      vec2 flow = vec2(fbm(uv * 2.0 + 7.0), fbm(uv * 2.0 + 13.0)) - 0.5;
      vec2 uvA = sampleA(uv + drift + flow * t * 0.22, zoomA + t * 0.08);
      vec2 uvB = sampleB(uv + drift - flow * (1.0 - t) * 0.22, zoomB + (1.0 - t) * 0.06);
      // A breath of chromatic separation only while places change.
      float ca = sin(t * 3.14159) * 0.004;
      vec3 a = vec3(texture2D(tA, uvA + vec2(ca, 0.0)).r, texture2D(tA, uvA).g, texture2D(tA, uvA - vec2(ca, 0.0)).b);
      vec3 b = vec3(texture2D(tB, uvB + vec2(ca, 0.0)).r, texture2D(tB, uvB).g, texture2D(tB, uvB - vec2(ca, 0.0)).b);
      col = mix(a, b, 1.0 - edge);
    }

    // Gentle grade: lift shadows a touch, soft vignette, fine film grain.
    col = mix(col, col * vec3(1.02, 1.0, 0.98), 0.5);
    float d = distance(vUv, vec2(0.5));
    col *= mix(1.0, smoothstep(1.05, 0.35, d), mix(0.22, 0.6, darkGrade));
    col = mix(col, pow(col, vec3(1.18)) * vec3(0.86, 0.9, 1.0), darkGrade);
    col += (hash(vUv * res + time) - 0.5) * grain;

    // Opening: the photograph resolves out of the page's light ground.
    col = mix(mix(vec3(0.945, 0.949, 0.937), vec3(0.02, 0.024, 0.04), darkGrade), col, reveal);
    gl_FragColor = vec4(col, 1.0);
  }`;

const blank = () => {
  const t = new THREE.DataTexture(new Uint8Array([241, 242, 239, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
};

export function createPhotoStage(canvas, { frames, lite = false, reducedMotion = false, dark = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  const software = isSoftwareRenderer();
  let dpr = software ? 0.6 : Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 1.5);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const loader = new THREE.TextureLoader();
  const width = lite || software ? 1600 : 2400;
  // Each photograph loads once, through the image optimiser at screen size.
  const textures = frames.map(() => ({ tex: blank(), size: new THREE.Vector2(1, 1), loaded: false, loading: false }));
  function load(i) {
    const slot = textures[i];
    if (!slot || slot.loaded || slot.loading) return;
    slot.loading = true;
    const f = frames[i];
    const done = () => {
      slot.loading = false;
      queueNext();
    };
    loader.load(optSrc(f.src, width), (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      slot.tex.dispose();
      slot.tex = tex;
      slot.size.set(tex.image.width, tex.image.height);
      slot.loaded = true;
      dirty = true;
      done();
    }, undefined, done);
  }
  // Background photographs load one at a time, after the opening.
  let nextIndex = 1;
  function queueNext() {
    while (nextIndex < frames.length && (textures[nextIndex].loaded || textures[nextIndex].loading)) nextIndex++;
    if (nextIndex < frames.length && !textures.some((t) => t.loading)) load(nextIndex);
  }

  const uniforms = {
    tA: { value: textures[0].tex },
    tB: { value: textures[0].tex },
    sizeA: { value: new THREE.Vector2(1, 1) },
    sizeB: { value: new THREE.Vector2(1, 1) },
    focusA: { value: new THREE.Vector2(0.5, 0.5) },
    focusB: { value: new THREE.Vector2(0.5, 0.5) },
    zoomA: { value: 1 },
    zoomB: { value: 1 },
    mixAB: { value: 0 },
    res: { value: new THREE.Vector2(1, 1) },
    pointer: { value: new THREE.Vector2() },
    shift: { value: 0 },
    time: { value: 0 },
    grain: { value: lite || reducedMotion || software ? 0 : 0.035 },
    reveal: { value: reducedMotion ? 1 : 0 },
    darkGrade: { value: dark ? 1 : 0 },
    vpA: { value: new THREE.Vector2(0.5, 0.5) },
    vpB: { value: new THREE.Vector2(0.5, 0.5) },
    depthA: { value: 0 },
    depthB: { value: 0 },
    dollyA: { value: 0 },
    dollyB: { value: 0 },
    sway: { value: new THREE.Vector2() },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, depthTest: false, depthWrite: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  const scene = new THREE.Scene();
  scene.add(quad);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const state = { journey: 0, intro: reducedMotion ? 1 : 0, side: 0, sideNow: 0, chapters: {} };
  const pointer = new THREE.Vector2();
  let running = true;
  let raf = 0;
  let last = performance.now();
  let dirty = true;
  let frames_ = 0;
  let slow = 0;
  let degraded = software;
  const lastDrawn = { journey: -1, zoom: -1, side: -1, px: 0, py: 0, reveal: -1, dolly: -1 };

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    uniforms.res.value.set(w * dpr, h * dpr);
    dirty = true;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // The opening photograph first; the rest follow one by one.
  load(0);

  const ease = (t) => t * t * (3 - 2 * t);

  // The opening shot: the camera pulls back to reveal the courtyard, then
  // scrolling walks it forward toward the horizon and into the next chapter.
  function dollyFor(index, read) {
    if (reducedMotion) return 0.1;
    const r = ease(Math.min(read, 1));
    if (index === 0) return 0.06 + 0.69 * r + (1 - ease(state.intro)) * 0.55;
    if (frames[index].depth && index === 1) return 0.75 + 0.25 * r;
    return 0.1 + 0.3 * r;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!running) return;
    const raw = (now - last) / 1000;
    const dt = Math.min(Math.max(raw, 0), 0.5);
    last = now;
    if (!degraded && ++frames_ > 3 && frames_ < 120) {
      if (raw > 0.04) slow++;
      if (raw > 0.2 || slow > 10) {
        degraded = true;
        uniforms.grain.value = 0;
        dpr = 1;
        renderer.setPixelRatio(dpr);
        resize();
      }
    }
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 3);

    const lastIndex = frames.length - 1;
    const s = Math.min(Math.max(state.journey, 0), lastIndex);
    const i = Math.min(Math.floor(s), lastIndex);
    const j = Math.min(i + 1, lastIndex);
    const f = s - i;
    const A = textures[i];
    const B = textures[j];
    load(j);
    uniforms.tA.value = A.tex;
    uniforms.tB.value = B.tex;
    uniforms.sizeA.value.copy(A.size);
    uniforms.sizeB.value.copy(B.size);
    uniforms.focusA.value.set(...frames[i].focus);
    uniforms.focusB.value.set(...frames[j].focus);

    // While a chapter is read its photograph pushes in, like a slow dolly.
    const read = state.chapters[frames[i].id] ?? 0;
    const push = reducedMotion ? 0 : 0.1 * ease(Math.min(read, 1));
    const introZoom = reducedMotion ? 0 : (1 - ease(state.intro)) * 0.28;
    const deepA = !!frames[i].depth;
    const deepB = !!frames[j].depth;
    uniforms.depthA.value = deepA ? 1 : 0;
    uniforms.depthB.value = deepB ? 1 : 0;
    if (deepA) uniforms.vpA.value.set(frames[i].depth[0], 1 - frames[i].depth[1]);
    if (deepB) uniforms.vpB.value.set(frames[j].depth[0], 1 - frames[j].depth[1]);
    uniforms.dollyA.value = dollyFor(i, read);
    uniforms.dollyB.value = dollyFor(j, state.chapters[frames[j].id] ?? 0);
    // Depth frames move by dolly; flat ones by a gentle zoom.
    uniforms.zoomA.value = deepA ? 1.08 : 1.04 + push + introZoom;
    uniforms.zoomB.value = deepB ? 1.08 : 1.04;

    uniforms.mixAB.value = reducedMotion ? Math.round(f) : f;
    uniforms.reveal.value = reducedMotion ? 1 : Math.min(1, state.intro * 1.6);

    state.sideNow += (state.side - state.sideNow) * k;
    uniforms.shift.value = state.sideNow;
    uniforms.pointer.value.lerp(pointer, reducedMotion ? 0 : k * 0.6);
    if (!reducedMotion) uniforms.time.value = (now / 1000) % 1000;

    // Draw only when the picture would change: grain animates every frame,
    // otherwise only journey, zoom, framing, pointer or the reveal move it.
    const p = uniforms.pointer.value;
    const changed =
      dirty ||
      uniforms.grain.value > 0 ||
      Math.abs(lastDrawn.dolly - uniforms.dollyA.value) > 1e-4 ||
      (uniforms.mixAB.value > 0.001 && uniforms.mixAB.value < 0.999) ||
      Math.abs(lastDrawn.journey - s) > 1e-4 ||
      Math.abs(lastDrawn.zoom - uniforms.zoomA.value) > 1e-4 ||
      Math.abs(lastDrawn.side - uniforms.shift.value) > 1e-4 ||
      Math.abs(lastDrawn.px - p.x) > 1e-4 ||
      Math.abs(lastDrawn.py - p.y) > 1e-4 ||
      Math.abs(lastDrawn.reveal - uniforms.reveal.value) > 1e-4;
    if (!changed) return;
    Object.assign(lastDrawn, { journey: s, zoom: uniforms.zoomA.value, side: uniforms.shift.value, px: p.x, py: p.y, reveal: uniforms.reveal.value, dolly: uniforms.dollyA.value });
    dirty = false;
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  function onVisibility() {
    running = !document.hidden;
    last = performance.now();
  }
  document.addEventListener("visibilitychange", onVisibility);

  return {
    setJourney(v) {
      state.journey = v;
      dirty = true;
    },
    setIntro(v) {
      state.intro = v;
      dirty = true;
    },
    setChapter(id, v) {
      state.chapters[id] = v;
      dirty = true;
    },
    setSide(v) {
      state.side = v;
      dirty = true;
    },
    setHighlight() {},
    setPointer(x, y) {
      pointer.set(x, y);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      textures.forEach((t) => t.tex.dispose());
      quad.geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}

// Software rasterisers (no GPU) get a lighter stage.
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
