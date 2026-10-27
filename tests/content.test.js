import { describe, expect, it } from "vitest";
import { getHomeContent } from "@/lib/content";
import { homeFixture } from "@/lib/content/fixtures/home";
import { homeContent } from "@/lib/content/schema";

describe("home content", () => {
  it("validates against the CMS schema", async () => {
    const content = await getHomeContent();
    expect(content.stations).toHaveLength(7);
  });

  it("only marks a fact verified when it cites where Ray published it", async () => {
    const content = await getHomeContent();
    for (const t of content.timeline.filter((e) => e.verificationStatus === "verified")) {
      expect(t.sourceNotes).toMatch(/gosocialsect\.com|Apple Podcasts/);
    }
    for (const q of Object.values(content.quotes)) expect(q.source.href.startsWith("https://")).toBe(true);
  });

  it("uses the book title as Ray published it", async () => {
    const content = await getHomeContent();
    expect(content.book.title).toBe("A Suitcase of Memories");
  });

  it("labels every ambition as a future possibility", async () => {
    const content = await getHomeContent();
    for (const p of content.possibilities) expect(p.verificationStatus).toBe("future-possibility");
  });

  it("has no invented dates in the timeline", async () => {
    const content = await getHomeContent();
    for (const t of content.timeline) expect(t.date).toBeNull();
  });

  it("credits every world image", async () => {
    const content = await getHomeContent();
    for (const img of Object.values(content.images)) {
      expect(img.credit.license).toMatch(/^CC/);
      expect(img.alt.length).toBeGreaterThan(10);
    }
  });

  it("rejects content missing a verification status", () => {
    const broken = structuredClone(homeFixture);
    delete broken.timeline[0].verificationStatus;
    expect(homeContent.safeParse(broken).success).toBe(false);
  });
});
