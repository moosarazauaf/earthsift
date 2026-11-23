import { describe, expect, it } from "vitest";

import { parseEvents } from "./events";

describe("NASA natural events", () => {
  it("keeps the latest position and maps the category to a hazard", () => {
    const [e] = parseEvents({ events: [{ id: "E1", title: "Fire", categories: [{ id: "wildfires" }], sources: [{ url: "https://x.gov/1" }],
      geometry: [{ type: "Point", date: "2026-11-01", coordinates: [1, 2] }, { type: "Point", date: "2026-11-20", coordinates: [3, 4] }] }] });
    expect(e).toMatchObject({ hazard: "wildfire", lon: 3, lat: 4, date: "2026-11-20", url: "https://x.gov/1" });
  });

  it("takes the middle of a polygon", () => {
    const [e] = parseEvents({ events: [{ id: "E2", categories: [{ id: "volcanoes" }], geometry: [{ type: "Polygon", coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2]]] }] }] });
    expect([e!.lon, e!.lat]).toEqual([1, 1]);
  });

  it("drops sea ice, malformed entries and unsafe links", () => {
    expect(parseEvents({ events: [{ id: "I", categories: [{ id: "seaLakeIce" }], geometry: [{ type: "Point", coordinates: [1, 1] }] }, { id: "B", categories: [{ id: "floods" }], geometry: [] }] })).toEqual([]);
    expect(parseEvents(null)).toEqual([]);
    const [e] = parseEvents({ events: [{ id: "U", categories: [{ id: "floods" }], sources: [{ url: "javascript:alert(1)" }], geometry: [{ type: "Point", coordinates: [1, 1] }] }] });
    expect(e!.url).toBe("https://eonet.gsfc.nasa.gov/");
  });
});
