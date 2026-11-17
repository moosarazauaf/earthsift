import { describe, expect, it } from "vitest";

import { type PlaceFacts, compareLines, verdict } from "./compare";

const place = (label: string, flood: "high" | "medium" | "low", slope: "high" | "medium" | "low"): PlaceFacts => ({
  label,
  risks: [
    { hazard: "flood", level: flood, title: "Flooding", text: "" },
    { hazard: "landslide", level: slope, title: "Landslides", text: "" },
    { hazard: "week", level: "low", title: "Next 7 days", text: "" },
  ],
  people: 120_000, areaKm2: 100,
  cover: [{ name: "Built-up", share: 0.6 }, { name: "Cropland", share: 0.3 }],
  rain: 640, hottest: { month: "June", tmax: 41.2 }, solar: 1490,
});

describe("comparing two places", () => {
  it("puts both places on one line per question", () => {
    const lines = compareLines(place("Sukkur", "high", "low"), { ...place("Murree", "low", "high"), people: null });
    expect(lines[0]).toBe("Flooding since 1984: Sukkur high · Murree low");
    expect(lines[1]).toBe("Landslide-prone slopes: Sukkur low · Murree high");
    expect(lines[3]).toContain("Murree not read");
    expect(lines[4]).toContain("built-up 60%, cropland 30%");
    expect(lines[6]).toContain("June, highs of 41 °C");
  });

  it("names the safer ground and why", () => {
    expect(verdict(place("Sukkur", "high", "low"), place("Lahore", "medium", "low"))).toBe("Lahore is the safer ground: Sukkur has more flooding risk.");
    expect(verdict(place("A", "low", "low"), place("B", "low", "low"))).toBe("A and B both have low flood and landslide risk.");
    expect(verdict(place("Sukkur", "high", "low"), place("Murree", "low", "high"))).toBe("Different risks: Sukkur's is flooding, Murree's is landslides.");
    expect(verdict({ ...place("A", "low", "low"), risks: [] }, place("B", "low", "low"))).toContain("could not be read");
  });
});
