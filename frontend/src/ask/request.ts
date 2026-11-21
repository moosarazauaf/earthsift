/** From a typed request to a recipe ready for confirmation: find the place, size the area, plan the run. */
import { api } from "../app/api";
import { formatLatLon, squareAround } from "../app/logic";
import type { SharedRun } from "../app/shareRun";
import type { AoiGeometry, Place } from "../app/types";
import { type Ask, planFor } from "./interpret";

const DEFAULT_KM = 10;
const MAX_KM = 50;
/** Search results that are a street or a building rather than a place to analyse. */
export const STREET = /road|street|highway|railway|building|house|amenity|shop|office|bus|parking|square/i;
const MINOR = /village|hamlet|isolated_dwelling|farm|locality/i;
const ADMIN_WORD = /(\s+(taluka|tehsil|tahsil|district|subdistrict|city|county|municipality))+$/i;
const baseName = (p: Place) => p.name.split(",")[0]!.trim().replace(ADMIN_WORD, "").toLowerCase();
const apartKm = (a: Place, b: Place) => Math.hypot((a.lon - b.lon) * 111.32 * Math.cos((a.lat * Math.PI) / 180), (a.lat - b.lat) * 110.57);

/** The place a name most likely means: not a street, and not a village when a taluka or district has the same name (Mehar, Sindh). */
export function bestPlace(results: Place[]): Place | undefined {
  const top = results.find((r) => !STREET.test(r.kind)) ?? results[0];
  if (!top || !MINOR.test(top.kind)) return top;
  return results.find((r) => !STREET.test(r.kind) && !MINOR.test(r.kind) && baseName(r) === baseName(top)) ?? top;
}

/** The place's name, with its district when another place of the same name exists, so a reader can see which one was used. */
export function placeLabel(found: Place, results: Place[]): string {
  const parts = found.name.split(",").map((s) => s.trim()).filter((s) => !/^\d+$/.test(s));
  const twin = results.some((r) => !STREET.test(r.kind) && baseName(r) === baseName(found) && apartKm(r, found) > 25);
  if (!twin || parts.length < 3) return parts[0]!;
  return `${parts[0]}, ${parts.slice(1).find((s) => /district|county/i.test(s)) ?? parts.at(-2)}`;
}

export async function requestRun(
  text: string, ask: Ask, current: { geometry: AoiGeometry; label: string } | null, maxPixels: number,
): Promise<{ run: SharedRun; aoi: { geometry: AoiGeometry; label: string } } | { error: string }> {
  let km = Math.min(MAX_KM, Math.max(1, ask.sizeKm ?? DEFAULT_KM));
  const sized = () => `a ${km} km square around`;
  let where: { lat: number; lon: number; label: string; geometry?: AoiGeometry; note: string };
  if (ask.point) {
    where = { ...ask.point, label: formatLatLon(ask.point.lat, ask.point.lon), note: `Area: ${sized()} ${formatLatLon(ask.point.lat, ask.point.lon)}.` };
  } else if (ask.place) {
    const { results } = await api.geocode(ask.place);
    // Nominatim often ranks a street named after a town above the town itself.
    const found = bestPlace(results);
    if (!found) return { error: `No place called "${ask.place}" was found. Try adding the region or country.` };
    const parts = found.name.split(",").map((s) => s.trim());
    const named = placeLabel(found, results);
    const label = named.includes(",") || parts.length < 2 ? named : `${parts[0]}, ${parts[parts.length - 1]}`;
    // Without a size, cover the place itself (a lake, a city) up to the largest area that stays quick.
    const [w, s, e, n] = found.bbox;
    const extentKm = Math.max((e - w) * 111.32 * Math.cos((found.lat * Math.PI) / 180), (n - s) * 111.32);
    if (!ask.sizeKm && extentKm > 300) return { error: `${label} is about ${Math.round(extentKm)} km across. Name a town or district in it, for example "floods in Layyah, Pakistan, August 2022".` };
    const fit = !ask.sizeKm && extentKm > km;
    if (fit) km = Math.min(MAX_KM, Math.ceil(extentKm));
    const [lat, lon] = fit ? [(s + n) / 2, (w + e) / 2] : [found.lat, found.lon];
    const tail = !fit ? ' Add a size such as "25 km" to change it.' : extentKm > MAX_KM ? ` The place is about ${Math.round(extentKm)} km across, so this covers its centre only.` : " This covers the whole place.";
    where = { lat, lon, label, note: `Area: ${sized()} ${found.name}.${ask.sizeKm ? "" : tail}` };
  } else if (current) {
    const ring = current.geometry.type === "Polygon" ? current.geometry.coordinates[0]! : current.geometry.coordinates[0]![0]!;
    const lats = ring.map((p) => p[1]!);
    where = { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lon: 0, label: current.label, geometry: current.geometry, note: `Area: the one already chosen, ${current.label}.` };
  } else {
    return { error: 'Say where, for example "floods in Layyah in August 2022", or choose an area first.' };
  }
  const geometry = where.geometry ?? squareAround(where.lon, where.lat, km);
  const plan = planFor(ask, geometry, where.label, where.lat, maxPixels);
  if ("error" in plan) return plan;
  return { run: { ...plan.run, fromAsk: { text, notes: [where.note, ...plan.notes] } }, aoi: { geometry, label: where.label } };
}
