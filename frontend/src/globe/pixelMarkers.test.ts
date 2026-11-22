import { describe, expect, it } from "vitest";

import { ICON_MAX, ICON_MIN, PHI, iconBasePx, iconPx, iconWeight, spreadOffsets } from "./pixelMarkers";

describe("spreading markers drawn on top of each other", () => {
  it("leaves lone and off-screen markers in place and fans out an overlapping group in a ring", () => {
    const o = spreadOffsets([{ x: 300, y: 200 }, { x: 304, y: 203 }, { x: 600, y: 400 }, null]);
    expect(o[2]).toEqual([0, 0]);
    expect(o[3]).toEqual([0, 0]);
    expect(o[0]).not.toEqual(o[1]);
    expect(Math.hypot(...o[0]!)).toBeCloseTo(16, 0);
  });

  it("fans out close markers that sit on either side of a grid line", () => {
    const o = spreadOffsets([{ x: 35, y: 100 }, { x: 37, y: 100 }]);
    expect(o[0]).not.toEqual([0, 0]);
    expect(o[1]).not.toEqual([0, 0]);
  });

  it("widens the ring for bigger groups", () => {
    const many = Array.from({ length: 8 }, () => ({ x: 100, y: 100 }));
    expect(Math.hypot(...spreadOffsets(many)[0]!)).toBeCloseTo(40, 0);
  });
});

describe("icon size follows the zoom", () => {
  it("steps by the golden ratio for each tenfold change in height", () => {
    expect(iconBasePx(200_000)).toBeCloseTo(34, 5);
    expect(iconBasePx(2_000_000)).toBeCloseTo(34 / PHI, 5);
    expect(iconBasePx(20_000_000)).toBeCloseTo(ICON_MIN, 0);
  });

  it("never passes its limits, however far the camera goes or however important the marker", () => {
    expect(iconBasePx(100)).toBe(ICON_MAX);
    expect(iconBasePx(1e9)).toBe(ICON_MIN);
    expect(iconPx(iconBasePx(100), iconWeight(5))).toBe(ICON_MAX);
    expect(iconPx(ICON_MIN, iconWeight(-5))).toBeCloseTo(ICON_MIN / Math.sqrt(PHI), 5);
  });
});
