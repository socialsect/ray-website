import { describe, expect, it } from "vitest";
import { camera, insideNiche, layout, throughCamera, toLevel } from "@/components/museum/geometry";

const sizes = [
  [1440, 900],
  [1920, 1080],
  [768, 1024],
  [390, 844],
];

describe("the mind museum", () => {
  for (const [W, H] of sizes) {
    const L = layout(W, H);

    it(`ends each walk looking only through the niche at ${W}x${H}`, () => {
      const cam = camera(L, 1);
      for (const fx of [0, W / 2, W]) for (const fy of [0, H / 2, H]) expect(insideNiche(toLevel([fx, fy], cam, L), L.niche)).toBe(true);
    });

    it(`hands over to the next room without a jump at ${W}x${H}`, () => {
      const through = throughCamera(L, camera(L, 1), 1);
      const next = camera(L, 0);
      expect(through.scale).toBeCloseTo(next.scale, 9);
      expect(through.center[0]).toBeCloseTo(next.center[0], 6);
      expect(through.center[1]).toBeCloseTo(next.center[1], 6);
    });

    it(`shows the next room nested exactly in the niche from the hall at ${W}x${H}`, () => {
      const cam = camera(L, 0);
      const through = throughCamera(L, cam, 0);
      const f = [L.niche.cx, (L.niche.springY + L.niche.sillY) / 2];
      const viaNest = toLevel(f, cam, L).map((v, i) => (v - L.endCenter[i]) / L.childScale + (i ? H : W) / 2);
      const viaCam = toLevel(f, through, L);
      expect(viaCam[0]).toBeCloseTo(viaNest[0], 6);
      expect(viaCam[1]).toBeCloseTo(viaNest[1], 6);
    });

    it(`opens every room on the whole hall at ${W}x${H}`, () => {
      const cam = camera(L, 0);
      expect(cam.scale).toBe(1);
      expect(cam.center).toEqual([W / 2, H / 2]);
    });
  }
});
