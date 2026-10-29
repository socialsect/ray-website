import { describe, expect, it } from "vitest";
import { cameraAt, chapters, crossings, doorOpen, doors, keyframes, landHeight, LAST, moods, obstacles, sectionOrder, zoneAt, zones } from "@/components/doors/world";

const samples = Array.from({ length: LAST * 200 + 1 }, (_, i) => (i / 200));

describe("the Doors of Possibility", () => {
  it("has a camera position for every section and a light for every space", () => {
    for (const id of sectionOrder) expect(keyframes[id], id).toBeDefined();
    for (const z of zones) expect(moods[z.id], z.id).toBeDefined();
  });

  it("names six chapters, in page order", () => {
    expect(chapters.map((c) => c.id)).toEqual(sectionOrder.slice(2, 8));
  });

  it("puts one door between each pair of spaces", () => {
    expect(doors).toHaveLength(zones.length - 1);
    doors.forEach((d, k) => expect(d.z).toBe(zones[k].to));
  });

  it("opens every door before the camera reaches it, and passes through the opening", () => {
    doors.forEach((d, k) => {
      expect(crossings[k], d.id).toBeGreaterThan(0.2);
      expect(crossings[k], d.id).toBeLessThan(0.95);
      // The journey value at which the camera is at the door plane.
      const j = samples.find((s) => cameraAt(s).pos[2] <= d.z);
      const { pos } = cameraAt(j);
      expect(doorOpen(k, j), d.id).toBeGreaterThan(0.9);
      expect(Math.abs(pos[0]), d.id).toBeLessThan(d.width / 2 - 1.5);
      expect(pos[1], d.id).toBeGreaterThan(1.5);
      expect(pos[1], d.id).toBeLessThan(d.height - 2);
    });
  });

  it("keeps every door shut until its approach, and ajar only slightly", () => {
    doors.forEach((d, k) => expect(doorOpen(k, k), d.id).toBeLessThan(0.15));
  });

  it("never flies the camera through architecture", () => {
    const solids = obstacles();
    const hits = [];
    for (const s of samples) {
      const p = cameraAt(s).pos;
      for (const o of solids) {
        if (p.every((v, i) => v > o.min[i] - 1.5 && v < o.max[i] + 1.5)) hits.push(`${o.kind} at ${p.map((v) => v.toFixed(1))}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("keeps the camera above the ground in the open landscapes", () => {
    for (const s of samples) {
      const p = cameraAt(s).pos;
      const zone = zones[zoneAt(p[2])].id;
      if (zone === "journey" || zone === "exploration") expect(p[1] - landHeight(p[0], p[2], zone)).toBeGreaterThan(2.5);
    }
  });

  it("travels forward through the spaces in order", () => {
    let last = Infinity;
    for (const s of samples) {
      const z = cameraAt(s).pos[2];
      expect(z).toBeLessThanOrEqual(last + 1e-6);
      last = z;
    }
    expect(zoneAt(cameraAt(LAST).pos[2])).toBe(zones.length - 1);
  });
});
