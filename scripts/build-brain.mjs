// Turns the anatomical brain scan model (Brain AS.stl, 3M triangles, Agnieszka
// Starostecka, CC BY 4.0, Wikimedia Commons) into a web-sized mesh:
// weld vertices, simplify with meshoptimizer, quantise and compress.
// Usage: node scripts/build-brain.mjs <path/to/Brain_AS.stl>
// Output: public/assets/brain/brain.bin (+ brain.json with layout)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";

const src = process.argv[2];
if (!src) throw new Error("Pass the path to Brain_AS.stl");
const TARGETS = [{ name: "brain", tris: 260000 }, { name: "brain-lite", tris: 90000 }];

const buf = readFileSync(src);
const triCount = buf.readUInt32LE(80);
console.log("source triangles", triCount);

// Weld identical vertices (STL repeats every corner).
const map = new Map();
const positions = [];
const indices = new Uint32Array(triCount * 3);
let off = 84;
for (let t = 0; t < triCount; t++) {
  off += 12; // facet normal
  for (let k = 0; k < 3; k++) {
    const x = buf.readFloatLE(off), y = buf.readFloatLE(off + 4), z = buf.readFloatLE(off + 8);
    off += 12;
    const key = `${x.toFixed(5)},${y.toFixed(5)},${z.toFixed(5)}`;
    let id = map.get(key);
    if (id === undefined) {
      id = positions.length / 3;
      positions.push(x, y, z);
      map.set(key, id);
    }
    indices[t * 3 + k] = id;
  }
  off += 2;
}
const pos = new Float32Array(positions);
console.log("welded vertices", pos.length / 3);

// Centre and scale to a unit-ish radius, measuring bounds.
let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], pos[i + k]); max[k] = Math.max(max[k], pos[i + k]); }
const centre = min.map((v, k) => (v + max[k]) / 2);
const extent = Math.max(...max.map((v, k) => v - min[k]));
console.log("bounds", min.map((v) => v.toFixed(2)), max.map((v) => v.toFixed(2)));

await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;
mkdirSync("public/assets/brain", { recursive: true });

for (const target of TARGETS) {
  const [simplified, error] = MeshoptSimplifier.simplify(indices, pos, 3, target.tris * 3, 0.02, ["LockBorder"]);
  // Compact: keep only used vertices.
  const remap = new Int32Array(pos.length / 3).fill(-1);
  const out = [];
  const idx = new Uint32Array(simplified.length);
  for (let i = 0; i < simplified.length; i++) {
    const v = simplified[i];
    if (remap[v] < 0) {
      remap[v] = out.length / 3;
      out.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]);
    }
    idx[i] = remap[v];
  }
  const vcount = out.length / 3;
  // Quantise positions to int16 in [-1, 1] * 32767 around the centre.
  const q = new Int16Array(vcount * 4);
  for (let i = 0; i < vcount; i++) for (let k = 0; k < 3; k++) q[i * 4 + k] = Math.round(((out[i * 3 + k] - centre[k]) / (extent / 2)) * 32767);
  // reorderMesh rewrites idx in place for the vertex cache and returns the
  // vertex remap to apply to the vertex data.
  const [vremap, unique] = MeshoptEncoder.reorderMesh(idx, true, false);
  const qq = new Int16Array(unique * 4);
  for (let i = 0; i < vcount; i++) {
    const n = vremap[i];
    if (n === 0xffffffff) continue;
    for (let k = 0; k < 4; k++) qq[n * 4 + k] = q[i * 4 + k];
  }
  const reordered = idx;
  const ev = MeshoptEncoder.encodeVertexBuffer(new Uint8Array(qq.buffer), unique, 8);
  const ei = MeshoptEncoder.encodeIndexBuffer(new Uint8Array(reordered.buffer), reordered.length, 4);
  const header = new Uint32Array([unique, reordered.length, ev.length, ei.length]);
  const file = new Uint8Array(16 + ev.length + ei.length);
  file.set(new Uint8Array(header.buffer), 0);
  file.set(ev, 16);
  file.set(ei, 16 + ev.length);
  writeFileSync(`public/assets/brain/${target.name}.bin`, file);
  console.log(target.name, "tris", reordered.length / 3, "verts", unique, "error", error.toFixed(4), "bytes", file.length);
}
writeFileSync(
  "public/assets/brain/brain.json",
  JSON.stringify({ sourceTriangles: triCount, extent, centre, bounds: { min, max }, unit: "1 = half the largest extent" }, null, 1),
);
