// Pre-builds every photograph the page shows into WebP at fixed widths, so
// nothing is resized on the fly when a visitor arrives.
// Output: public/assets/opt/<folder>-<name>-<width>.webp
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, parse } from "node:path";
import sharp from "sharp";

const root = "public/assets";
const out = join(root, "opt");
const widths = [960, 1600, 2400];
// The museum walks deep into one photograph, so it keeps a near-full rendition.
const extra = { museum: [4000] };
mkdirSync(out, { recursive: true });

for (const folder of ["stage", "world", "ray", "museum", "mind"]) {
  const dir = join(root, folder);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)) {
    if (!/\.(jpe?g|png|webp)$/i.test(file)) continue;
    const src = join(dir, file);
    const { name } = parse(file);
    const meta = await sharp(src).metadata();
    for (const w of [...widths, ...(extra[folder] || [])]) {
      const target = join(out, `${folder}-${name}-${w}.webp`);
      if (existsSync(target) && statSync(target).mtimeMs > statSync(src).mtimeMs) continue;
      await sharp(src)
        .resize({ width: Math.min(w, meta.width), withoutEnlargement: true })
        .webp({ quality: w >= 4000 ? 80 : w >= 2400 ? 74 : 78, effort: 5 })
        .toFile(target);
    }
  }
}
console.log("images optimised into", out);
