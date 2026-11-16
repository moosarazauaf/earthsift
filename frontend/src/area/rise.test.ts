import { describe, expect, it } from "vitest";

import { heatWindows, parseHours, sprayWindows, windowText } from "./fieldwork";
import { riseMask } from "./rise";

describe("if the river rises", () => {
  // 40 × 40 cells near the equator: a river channel at 100 m in column 5, a valley floor rising 1 m per column,
  // a 20 m ridge at column 25, and a low bowl at 101 m beyond it.
  const z = 12, w = 40, x0 = 2 ** z / 2, y0 = 2 ** z / 2 - w / 512;
  const heights = new Float32Array(w * w);
  for (let r = 0; r < w; r++) for (let c = 0; c < w; c++) heights[r * w + c] = c === 5 ? 100 : c < 25 ? 100 + Math.abs(c - 5) * 0.5 : c === 25 ? 120 : 101;
  const lon = (c: number) => ((x0 + c / 256) / 2 ** z) * 360 - 180, lat = (r: number) => 0 + 0 * r;
  void lat;
  const ring = [[lon(0), -1], [lon(w), -1], [lon(w), 1], [lon(0), 1], [lon(0), -1]];
  const g = { heights, width: w, height: w, x0, y0, z, rings: [ring] };

  it("floods the valley floor up to the risen level and not the bowl behind the ridge", () => {
    const r = riseMask(g, 2)!;
    expect(r.base).toBe(100);
    const row = [...r.mask.slice(20 * w, 21 * w)];
    // Columns 1 to 9 are within 2 m of the river (|c - 5| * 0.5 <= 2); the bowl beyond the ridge is 1 m up but cut off.
    expect(row.slice(1, 10).every((v) => v === 1)).toBe(true);
    expect(row[0]).toBe(0);
    expect(row.slice(26).every((v) => v === 0)).toBe(true);
    expect(r.share).toBeGreaterThan(0.2);
    expect(r.share).toBeLessThan(0.3);
  });

  it("reaches further as the water rises", () => {
    expect(riseMask(g, 5)!.share).toBeGreaterThan(riseMask(g, 1)!.share);
  });
});

describe("field work planner", () => {
  const hourly = (rows: [string, number, number, number, number, number][]) => ({
    hourly: {
      time: rows.map((r) => r[0]), wet_bulb_temperature_2m: rows.map((r) => r[1]), wind_speed_10m: rows.map((r) => r[2]),
      precipitation_probability: rows.map((r) => r[3]), precipitation: rows.map((r) => r[4]), temperature_2m: rows.map((r) => r[5]),
    },
  });
  const day = (t: number, wb: number, wind: number, chance = 0, rain = 0, temp = 25): [string, number, number, number, number, number] => [`2026-07-14T${String(t).padStart(2, "0")}:00`, wb, wind, chance, rain, temp];

  it("finds the hours too hot for heavy work", () => {
    const hours = parseHours(hourly([day(10, 25, 8), day(11, 27.5, 8), day(12, 30.5, 8), day(13, 28, 8), day(14, 26, 8)]));
    const heat = heatWindows(hours);
    expect(heat.heavy).toEqual([{ start: "2026-07-14T11:00", end: "2026-07-14T14:00", hours: 3 }]);
    expect(heat.danger).toEqual([{ start: "2026-07-14T12:00", end: "2026-07-14T13:00", hours: 1 }]);
    expect(heat.maxWetBulb).toBe(30.5);
  });

  it("finds daylight spraying windows with a light breeze and no rain due", () => {
    const hours = parseHours(hourly([
      day(5, 15, 8), day(7, 15, 8), day(8, 15, 9), day(9, 15, 10), day(10, 15, 25), day(11, 15, 6), day(12, 15, 6, 70), day(13, 15, 6),
    ].map((r, i) => (i === 0 ? r : r))));
    const w = sprayWindows(hours);
    // 05:00 is before dawn, 10:00 too windy, 11:00 has rain due within the next hours.
    expect(w.map(windowText)).toEqual(["Tue 07:00 to 10:00"]);
  });

  it("ignores hours with missing values", () => {
    expect(parseHours({ hourly: { time: ["2026-07-14T10:00"], wet_bulb_temperature_2m: [null], wind_speed_10m: [5], temperature_2m: [20] } })).toEqual([]);
  });
});
