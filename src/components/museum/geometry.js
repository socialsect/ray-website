// The Mind Museum's geometry. One real photograph of an empty gallery; its
// blind niche becomes a doorway that holds the same gallery again. Walking
// forward means zooming toward the niche until only the room inside it is
// visible, then continuing in that room. Everything is measured in "level
// pixels": viewport pixels with the photograph cover-fitted at scale 1.

// Measured from the 4932 x 3799 original (Leeds Art Gallery, Andy Beecroft).
export const PHOTO = {
  width: 4932,
  height: 3799,
  niche: { x0: 2156, x1: 2750, springY: 2997, sillY: 3580, radius: 297 },
  // The bare lunette wall above the pediment, where each room's text hangs.
  wallText: { x0: 1825, x1: 3080, y0: 1915, y1: 2275 },
  focusX: 2453 / 4932,
};

// How the photograph sits on a viewport of W x H at scale 1.
export function coverFit(W, H) {
  const k = Math.max(W / PHOTO.width, H / PHOTO.height);
  const dw = PHOTO.width * k;
  const dh = PHOTO.height * k;
  let ox = W / 2 - PHOTO.focusX * dw;
  ox = Math.min(0, Math.max(W - dw, ox));
  const oy = (H - dh) / 2;
  return { k, dw, dh, ox, oy };
}

// Everything the camera and the shader need for one viewport size.
export function layout(W, H) {
  const fit = coverFit(W, H);
  const px = (x) => fit.ox + x * fit.k;
  const py = (y) => fit.oy + y * fit.k;
  const n = PHOTO.niche;
  const niche = { x0: px(n.x0), x1: px(n.x1), springY: py(n.springY), sillY: py(n.sillY), radius: n.radius * fit.k };
  niche.cx = (niche.x0 + niche.x1) / 2;
  niche.topY = niche.springY - niche.radius;
  const rectH = niche.sillY - niche.springY;
  const rectW = niche.x1 - niche.x0;
  // The last view of a room: a viewport-shaped window wholly inside the niche.
  const endScale = 0.94 * Math.min(rectW / W, rectH / H);
  const endCenter = [niche.cx, niche.sillY - (endScale * H) / 2 - 0.03 * rectH];
  // The room inside the niche: a viewport-shaped box centred on that window
  // and large enough to fill the whole niche, arch included.
  const childScale =
    1.001 *
    Math.max(
      (2 * Math.max(niche.cx - niche.x0, niche.x1 - niche.cx)) / W,
      (2 * Math.max(endCenter[1] - niche.topY, niche.sillY - endCenter[1])) / H,
    );
  const t = PHOTO.wallText;
  const wall = { x: px(t.x0), y: py(t.y0), w: (t.x1 - t.x0) * fit.k, h: (t.y1 - t.y0) * fit.k };
  return { W, H, fit, niche, endScale, endCenter, childScale, wall };
}

// Inside the niche opening (rectangle below the springline, half-disc above).
export function insideNiche(p, n) {
  if (p[0] < n.x0 || p[0] > n.x1 || p[1] > n.sillY) return false;
  if (p[1] >= n.springY) return true;
  const dx = p[0] - n.cx;
  const dy = p[1] - n.springY;
  return dx * dx + dy * dy <= n.radius * n.radius;
}

// A point in a room, expressed in the room inside its niche.
export function toChild(p, L) {
  return [(p[0] - L.endCenter[0]) / L.childScale + L.W / 2, (p[1] - L.endCenter[1]) / L.childScale + L.H / 2];
}

// The camera in a room at walk progress u (0..1): a centre in level pixels
// and a scale (1 = the whole viewport shows the cover-fitted photo). Every
// room opens on the whole hall; the scale shrinks geometrically about a fixed
// point, so the walk feels like one steady forward move into the niche.
export function camera(L, u) {
  const c0 = [L.W / 2, L.H / 2];
  const s0 = 1;
  const s1 = L.endScale;
  const r = s1 / s0;
  const q = [(L.endCenter[0] - c0[0] * r) / (1 - r), (L.endCenter[1] - c0[1] * r) / (1 - r)];
  const s = s0 * Math.pow(r, u);
  const f = s / s0;
  return { center: [q[0] + (c0[0] - q[0]) * f, q[1] + (c0[1] - q[1]) * f], scale: s };
}

// The camera for the room seen through the niche. Far from the doorway the
// next room sits inside it exactly as the photograph nests it; nearer, the
// frame grows faster than the room beyond, so more of that room shows, until
// at the threshold it fills the view at its natural size: real parallax.
export function throughCamera(L, cam, u) {
  const nested = {
    center: [(cam.center[0] - L.endCenter[0]) / L.childScale + L.W / 2, (cam.center[1] - L.endCenter[1]) / L.childScale + L.H / 2],
    scale: cam.scale / L.childScale,
  };
  const w = Math.pow(u, 2.4);
  // Blend the scale geometrically and the centre along with it.
  const scale = Math.pow(nested.scale, 1 - w);
  const t = (1 - scale) / (1 - nested.scale || 1);
  const k = Math.abs(1 - nested.scale) < 1e-9 ? w : 1 - t;
  return {
    center: [nested.center[0] + (L.W / 2 - nested.center[0]) * k, nested.center[1] + (L.H / 2 - nested.center[1]) * k],
    scale,
  };
}

// Screen pixel -> level pixel for a camera.
export function toLevel(f, cam, L) {
  return [cam.center[0] + (f[0] - L.W / 2) * cam.scale, cam.center[1] + (f[1] - L.H / 2) * cam.scale];
}
