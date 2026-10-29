// Pre-built WebP renditions (scripts/optimize-images.mjs), served as plain
// static files so nothing is resized on the fly when a visitor arrives.
export const OPT_WIDTHS = [960, 1600, 2400];
const ALL_WIDTHS = [960, 1600, 2400, 4000];

export function optSrc(src, width) {
  const m = /^\/assets\/(stage|world|ray|museum)\/(.+)\.(jpe?g|png|webp)$/i.exec(src);
  if (!m) return src;
  const widths = m[1] === "museum" ? ALL_WIDTHS : OPT_WIDTHS;
  const w = widths.find((x) => x >= width) ?? widths[widths.length - 1];
  return `/assets/opt/${m[1]}-${m[2]}-${w}.webp`;
}

export function optSrcSet(src) {
  return OPT_WIDTHS.map((w) => `${optSrc(src, w)} ${w}w`).join(", ");
}
