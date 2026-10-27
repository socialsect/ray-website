import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sectionOrder } from "@/components/scenes/network";
import { getHomeContent } from "@/lib/content";

describe("the photographic stage", () => {
  it("has a real place for every chapter, in page order", async () => {
    const { stage } = await getHomeContent();
    expect(stage.map((s) => s.section)).toEqual(sectionOrder);
  });

  it("only uses photographs that exist and are credited", async () => {
    const { stage, images } = await getHomeContent();
    for (const s of stage) {
      const img = images[s.image];
      expect(img, s.image).toBeDefined();
      expect(existsSync(join(process.cwd(), "public", img.src))).toBe(true);
      expect(img.credit.license).toMatch(/^CC/);
    }
  });

  it("keeps each focal point inside the photograph", async () => {
    const { stage } = await getHomeContent();
    for (const s of stage) for (const v of s.focus) expect(v >= 0 && v <= 1).toBe(true);
  });
});
