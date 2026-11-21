import { describe, expect, it } from "vitest";

import type { Place } from "../app/types";
import { bestPlace, placeLabel } from "./request";

const at = (name: string, kind: string, lon: number, lat: number): Place => ({ name, kind, lon, lat, bbox: [lon, lat, lon, lat] });
// Real search results, in the order OpenStreetMap ranked them (21 November 2026).
const mehar = [
  at("Mehar, Kot Diji Taluka, Khairpur District, Sukkur Division, Sindh, Pakistan", "village", 68.6321, 27.3537),
  at("Mehari, Mithi Taluka, Tharparkar District, Mirpur Khas Division, Sindh, 69230, Pakistan", "village", 69.9864, 24.8946),
  at("Mehar Taluka, Dadu District, Hyderabad Division, Sindh, Pakistan", "municipality", 68.003, 27.1219),
];

describe("choosing the place a name means", () => {
  it("prefers a taluka over a village of the same name, and says which one", () => {
    const found = bestPlace(mehar)!;
    expect(found.name).toContain("Dadu District");
    expect(placeLabel(found, mehar)).toBe("Mehar Taluka, Dadu District");
  });

  it("skips a railway station, and keeps a plain name when it is unique", () => {
    const r = [at("Charsadda, Mardan Road, Charsadda Tehsil, Pakistan", "railway", 71.7593, 34.1509), at("Charsadda, Charsadda Tehsil, Charsadda District, Pakistan", "city", 71.7337, 34.1462)];
    expect(bestPlace(r)).toBe(r[1]);
    expect(placeLabel(r[1]!, r)).toBe("Charsadda");
  });

  it("keeps a village when nothing larger has its name", () => {
    const r = [at("Thatta, Jand Tehsil, Attock District, Pakistan", "village", 72, 33), at("Thattar, Lahore District, Pakistan", "town", 74, 31)];
    expect(bestPlace(r)).toBe(r[0]);
  });

  it("names the region for same-named cities far apart", () => {
    const r = [at("Springfield, Sangamon County, Illinois, United States", "city", -89.65, 39.8), at("Springfield, Hampden County, Massachusetts, United States", "city", -72.59, 42.1)];
    expect(placeLabel(r[0]!, r)).toBe("Springfield, Sangamon County");
  });

  it("sees a two-word admin name as the same name", () => {
    const r = [at("Hyderabad, Bahadurpura mandal, Hyderabad, Telangana, India", "city", 78.47, 17.36), at("Hyderabad City Taluka, Hyderabad District, Sindh, Pakistan", "city", 68.37, 25.39)];
    expect(placeLabel(r[0]!, r)).toBe("Hyderabad, Telangana");
  });
});
