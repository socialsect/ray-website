// The Doors of Possibility: one connected journey through seven spaces,
// each sealed from the next by a monumental wall and its door. Units are
// metres; y = 0 is the ground along the route; -z is "ahead". Pure data and
// maths, shared by the WebGL scene, the page and the tests.

export const sectionOrder = ["hero", "threshold", "journey", "ventures", "discipline", "exploration", "expression", "ideas", "close"];

export const chapters = [
  { id: "journey", name: "Journey", line: "How healthcare chose Ray" },
  { id: "ventures", name: "Ventures", line: "Founding Socialsect" },
  { id: "discipline", name: "Discipline", line: "What boxing taught him" },
  { id: "exploration", name: "Exploration", line: "India, the US, the UK, the UAE" },
  { id: "expression", name: "Expression", line: "His book, A Suitcase of Memories" },
  { id: "ideas", name: "Ideas", line: "One Day with Ray, and what comes next" },
];

// The spaces, in order. Each runs from `from` (nearer) to `to` (further).
export const zones = [
  { id: "hall", from: 160, to: 0 },
  { id: "journey", from: 0, to: -330 },
  { id: "ventures", from: -330, to: -640 },
  { id: "discipline", from: -640, to: -930 },
  { id: "exploration", from: -930, to: -1320 },
  { id: "expression", from: -1320, to: -1440 },
  { id: "ideas", from: -1440, to: -1720 },
  { id: "light", from: -1720, to: -2400 },
];

// The doors, one between each pair of spaces. The opening is centred on
// x = 0 and rises from the ground. Each type opens in its own way.
export const doors = [
  { id: "gate", z: 0, width: 13, height: 27, type: "swing", wall: "stone" },
  { id: "cliff", z: -330, width: 11, height: 24, type: "slide", wall: "cliff" },
  { id: "pivot", z: -640, width: 12, height: 22, type: "pivot", wall: "stone" },
  { id: "cleft", z: -930, width: 14, height: 30, type: "slide", wall: "cliff" },
  { id: "salon", z: -1320, width: 6.4, height: 10, type: "swing", wall: "marble" },
  { id: "slot", z: -1440, width: 7, height: 16, type: "slide", wall: "marble" },
  { id: "final", z: -1720, width: 16, height: 34, type: "swing", wall: "stone" },
];

// Where the camera stands for each section, what it looks at, and how much
// of the section it holds still (so the words can be read) before it moves on.
export const keyframes = {
  hero: { pos: [0, 7, 96], target: [0, 13, -40], hold: 0 },
  threshold: { pos: [0, 8, 30], target: [0, 11, -60], hold: 0.35 },
  journey: { pos: [0, 5.5, -110], target: [-28, 16, -330], hold: 0.45 },
  ventures: { pos: [0, 8, -440], target: [22, 34, -640], hold: 0.45 },
  discipline: { pos: [0, 3.4, -733], target: [11, 3.4, -800], hold: 0.45 },
  exploration: { pos: [0, 9, -1040], target: [-50, 24, -1320], hold: 0.45 },
  expression: { pos: [0, 4.2, -1352], target: [2, 4.5, -1440], hold: 0.45 },
  ideas: { pos: [0, 6, -1530], target: [0, 15, -1720], hold: 0.45 },
  close: { pos: [0, 9, -1800], target: [0, 12, -2000], hold: 0 },
};

// The light of each space: a physical sky (sun height and direction, haze),
// fog, exposure and the strength of the sun and the ambient light.
export const moods = {
  hall: { sky: true, elevation: 13, azimuth: 180, turbidity: 7, fog: "#8f7466", density: 0.0018, sun: 3.2, ambient: 0.8, exposure: 0.62, glow: 2.2 },
  journey: { sky: true, elevation: 14, azimuth: 150, turbidity: 6, fog: "#d7b99a", density: 0.0009, sun: 3.6, ambient: 1.1, exposure: 0.62, glow: 0.4 },
  ventures: { sky: true, elevation: 3, azimuth: 150, turbidity: 4, fog: "#4a3a3c", density: 0.0015, sun: 1.2, ambient: 0.6, exposure: 0.6, glow: 1 },
  discipline: { sky: false, background: "#0c0a08", fog: "#1c150f", density: 0.004, sun: 0, ambient: 0.45, exposure: 1.25, glow: 0.8 },
  // A clear dusk over the lake: low, side-on sun and little haze, so no milky wash.
  exploration: { sky: true, elevation: 5, azimuth: 115, turbidity: 2.5, fog: "#25313b", density: 0.0011, sun: 1.6, ambient: 0.65, exposure: 0.42, glow: 0.8 },
  expression: { sky: false, background: "#1a1209", fog: "#24170c", density: 0.01, sun: 0, ambient: 0.3, exposure: 1.0, glow: 1 },
  ideas: { sky: true, elevation: -6, azimuth: 180, turbidity: 2, fog: "#0c1220", density: 0.0016, sun: 0.25, ambient: 0.4, exposure: 0.85, glow: 1.4 },
  light: { sky: true, elevation: 4, azimuth: 172, turbidity: 5, fog: "#5b4636", density: 0.0016, sun: 1.8, ambient: 0.5, exposure: 0.32, glow: 1 },
};

const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t * t * (3 - 2 * t);
const smoothstep = (a, b, v) => ease(Math.min(Math.max((v - a) / (b - a), 0), 1));

// Uniform Catmull-Rom through the keyframe positions (matches
// THREE.CatmullRomCurve3 "catmullrom" with tension 0.5).
function catmull(points, t) {
  const n = points.length;
  const get = (i) => {
    if (i < 0) return points[0].map((v, k) => 2 * v - points[1][k]);
    if (i >= n) return points[n - 1].map((v, k) => 2 * v - points[n - 2][k]);
    return points[i];
  };
  const s = Math.min(Math.max(t, 0), n - 1);
  const i = Math.min(Math.floor(s), n - 2);
  const u = s - i;
  const p0 = get(i - 1);
  const p1 = get(i);
  const p2 = get(i + 1);
  const p3 = get(i + 2);
  return p1.map((_, k) => {
    const a = -0.5 * p0[k] + 1.5 * p1[k] - 1.5 * p2[k] + 0.5 * p3[k];
    const b = p0[k] - 2.5 * p1[k] + 2 * p2[k] - 0.5 * p3[k];
    const c = -0.5 * p0[k] + 0.5 * p2[k];
    return ((a * u + b) * u + c) * u + p1[k];
  });
}

const POS = sectionOrder.map((id) => keyframes[id].pos);
const TGT = sectionOrder.map((id) => keyframes[id].target);
export const LAST = sectionOrder.length - 1;

// Scroll position (section index + progress) to a point on the camera path:
// the camera holds at a section's keyframe for its `hold` fraction, then
// travels, eased, to the next.
export function pathParam(journey) {
  const j = Math.min(Math.max(journey, 0), LAST);
  const i = Math.min(Math.floor(j), LAST - 1);
  const p = j - i;
  const h = keyframes[sectionOrder[i]].hold;
  const travel = p <= h ? 0 : ease((p - h) / (1 - h));
  return i + travel;
}

export function cameraAt(journey) {
  const t = pathParam(journey);
  return { pos: catmull(POS, t), target: catmull(TGT, t), t };
}

// Where along its transition (0..1 of eased travel) the camera crosses each door.
export const crossings = doors.map((d, k) => {
  const a = k + 1;
  let lo = 0;
  let hi = 1;
  for (let n = 0; n < 40; n++) {
    const mid = (lo + hi) / 2;
    if (catmull(POS, a + mid)[2] > d.z) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
});

// How far each door stands open (0 closed, 1 open). A door opens in the
// stretch of travel before the camera reaches it, so the visitor watches it
// open, then passes through. Before that it stands just ajar, leaking light.
export function doorOpen(k, journey) {
  const a = k + 1;
  const t = pathParam(journey);
  const c = crossings[k];
  const local = t - a;
  const open = smoothstep(c - 0.42, c - 0.12, local);
  // The first door already stands a little open, light spilling through it.
  const ajar = k === 0 ? 0.13 : smoothstep(a - 1.6, a - 0.2, t) * 0.035;
  return Math.max(open, local > 0.999 ? 1 : 0, ajar);
}

// The space the camera is in, and how far it has passed into it.
export function zoneAt(z) {
  for (let i = 0; i < zones.length; i++) if (z <= zones[i].from && z > zones[i].to) return i;
  return z > zones[0].from ? 0 : zones.length - 1;
}

// Value noise and fbm, for the landscapes.
const hash = (x, z) => {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function noise(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  return lerp(lerp(hash(ix, iz), hash(ix + 1, iz), ux), lerp(hash(ix, iz + 1), hash(ix + 1, iz + 1), ux), uz);
}
export function fbm(x, z, octaves = 5) {
  let v = 0;
  let a = 0.5;
  for (let i = 0; i < octaves; i++) {
    v += a * noise(x, z);
    x = x * 2.03 + 17.1;
    z = z * 2.03 + 9.2;
    a *= 0.5;
  }
  return v;
}

// Ground height in the two open landscapes. The route stays level; mountains
// rise away from it. `kind` is "journey" (warm ranges) or "exploration"
// (higher, sharper country).
export function landHeight(x, z, kind) {
  const ax = Math.abs(x);
  const route = smoothstep(16, 70, ax);
  const amp = kind === "exploration" ? 260 : 170;
  const ridges = Math.pow(fbm(x * 0.0045 + (kind === "exploration" ? 40 : 0), z * 0.0045, 6), 1.6) * amp * smoothstep(60, 420, ax);
  const rolling = (fbm(x * 0.02, z * 0.02, 4) - 0.35) * 9 * route;
  return Math.max(0, ridges + rolling) * route;
}

// Seeded random for layouts, so the world is the same on every visit.
export function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The solid objects placed near the route, as axis-aligned boxes, so tests
// can prove the camera never passes through architecture.
export function obstacles() {
  const rand = seeded(3);
  const out = [];
  // Hall: two rows of giant pillars.
  for (let z = 150; z > 10; z -= 22) for (const s of [-1, 1]) out.push({ min: [s * 19 - 2.5, 0, z - 2.5], max: [s * 19 + 2.5, 34, z + 2.5], kind: "pillar" });
  // Ventures: towers either side of an avenue.
  for (let z = -360; z > -620; z -= 34 + rand() * 10) {
    for (const s of [-1, 1]) {
      const w = 14 + rand() * 12;
      const x = s * (26 + rand() * 14 + w / 2);
      out.push({ min: [x - w / 2, 0, z - w / 2], max: [x + w / 2, 70 + rand() * 120, z + w / 2], kind: "tower" });
    }
  }
  // Discipline: a colonnade of massive stone piers, and scattered blocks.
  for (let z = -660; z > -910; z -= 28) for (const s of [-1, 1]) out.push({ min: [s * 16 - 3, 0, z - 3], max: [s * 16 + 3, 38, z + 3], kind: "pier" });
  for (let k = 0; k < 10; k++) {
    const s = rand() < 0.5 ? -1 : 1;
    const x = s * (30 + rand() * 60);
    const z = -660 - rand() * 250;
    const e = 6 + rand() * 10;
    out.push({ min: [x - e / 2, 0, z - e / 2], max: [x + e / 2, e * (0.8 + rand()), z + e / 2], kind: "block" });
  }
  // Exploration: rock spires off the route.
  for (let k = 0; k < 14; k++) {
    const s = k % 2 ? 1 : -1;
    const x = s * (40 + rand() * 180);
    const z = -960 - rand() * 330;
    const r = 5 + rand() * 9;
    out.push({ min: [x - r, 0, z - r], max: [x + r, 40 + rand() * 90, z + r], kind: "spire" });
  }
  return out;
}

// The arch of rock that spans the route in Exploration.
export const arch = { z: -1150, span: 46, height: 52, thickness: 9 };
