import { describe, expect, it } from "vitest";

import { heightsInside, highGround, rateRisks } from "./risk";

describe("risk check", () => {
  // A 64 × 64 grid at zoom 12 near the equator: flat at 100 m with a 20 m plateau in the east.
  const z = 12, size = 64, x0 = 2 ** z / 2, y0 = 2 ** z / 2 - size / 512;
  const heights = new Float32Array(size * size).fill(100);
  for (let r = 0; r < size; r++) for (let c = 48; c < size; c++) heights[r * size + c] = 120;
  // A lone spike to the west, which must not count as high ground.
  heights[32 * size + 20] = 200;
  const grid = { heights, width: size, height: size, x0, y0, z };
  const lonAt = (c: number) => ((x0 + (c + 0.5) / 256) / 2 ** z) * 360 - 180;
  const centreLat = 0;

  it("finds the nearest broad higher ground, east, and ignores a single spike", () => {
    const g = highGround(grid, lonAt(24), centreLat)!;
    expect(g.direction).toBe("east");
    // The plateau's first full 3 × 3 cell is column 49, 25 pixels (about 0.95 km at 38 m) away.
    expect(g.km).toBeGreaterThan(0.85);
    expect(g.km).toBeLessThan(1.05);
    expect(g.aboveM).toBeCloseTo(20);
  });

  it("finds none when nothing is high enough, or the point is outside the grid", () => {
    expect(highGround(grid, lonAt(24), centreLat, 50)).toBeNull();
    expect(highGround(grid, lonAt(200), centreLat)).toBeNull();
  });

  it("rates floodplain ground high and says where higher ground is", () => {
    const [flood] = rateRisks({ water: { ever: 0.3, often: 0.1, sometimes: 0.2, pixels: 100 }, groundSearched: true, ground: { lon: 0, lat: 0, km: 2.34, direction: "north-east", aboveM: 12 } });
    expect(flood).toMatchObject({ hazard: "flood", level: "high" });
    expect(flood!.text).toContain("2.3 km north-east");
  });

  it("rates dry, gentle ground with a calm week low", () => {
    const items = rateRisks({ water: { ever: 0, often: 0, sometimes: 0, pixels: 100 }, steep: 0.02, week: [] });
    expect(items.map((i) => i.level)).toEqual(["low", "low", "low"]);
  });

  it("rates steep ground and a heavy-rain week high, and leaves out what could not be read", () => {
    const items = rateRisks({ steep: 0.4, week: [{ kind: "rain", dates: ["2026-08-01"], text: "Heavy rain." }] });
    expect(items.map((i) => [i.hazard, i.level])).toEqual([["landslide", "high"], ["week", "high"]]);
  });
});

describe("heights inside an area", () => {
  it("ignores the parts of the tiles outside the area, where far mountains would inflate the maximum", () => {
    const z = 12, size = 8, x0 = 2 ** z / 2, y0 = 2 ** z / 2 - size / 512;
    const heights = new Float32Array(size * size).fill(100);
    heights[3 * size + 7] = 8000; // a peak in the last column, outside the ring
    const lon = (c: number) => ((x0 + c / 256) / 2 ** z) * 360 - 180;
    const ring = [[lon(0), -1], [lon(6), -1], [lon(6), 1], [lon(0), 1], [lon(0), -1]];
    const inside = heightsInside({ heights, width: size, height: size, x0, y0, z, rings: [ring] });
    expect(inside.length).toBe(6 * size);
    expect(Math.max(...inside)).toBe(100);
  });
});

describe("hill torrents", () => {
  const torrent = (flat: number, nearbyRise: number) => rateRisks({ flat, nearbyRise }).find((r) => r.hazard === "torrent")!;
  it("flags flat ground below nearby mountains, at most as Some", () => {
    expect(torrent(0.32, 1377).level).toBe("medium"); // Rajanpur, below the Sulaiman range
    expect(torrent(0.67, 214).level).toBe("low"); // Faisalabad: flat, but no mountains
    expect(torrent(0, 2103).level).toBe("low"); // Murree: mountains, but no plain for water to spread on
    expect(torrent(0.9, 5000).level).not.toBe("high");
  });
});
