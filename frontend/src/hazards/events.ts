/** Natural events NASA is tracking now (EONET): wildfires, storms, volcanoes and more, active in the past 30 days. */
import type { Hazard } from "../news/types";

const EONET = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=30&limit=500";
const HAZARD: Record<string, Hazard> = {
  wildfires: "wildfire", severeStorms: "storm", volcanoes: "volcano", floods: "flood", drought: "drought",
  dustHaze: "dust", landslides: "landslide", snow: "winter", tempExtremes: "heat",
};

export interface NaturalEvent { id: string; title: string; hazard: Hazard; lon: number; lat: number; date: string; url: string }

interface RawGeometry { date?: string; type?: string; coordinates?: unknown }
interface RawEvent { id?: string; title?: string; categories?: { id?: string }[]; sources?: { url?: string }[]; geometry?: RawGeometry[] }

/** A point, or the middle of a polygon's outer ring. */
function centre(g: RawGeometry): [number, number] | null {
  const pts = g.type === "Point" ? [g.coordinates] : g.type === "Polygon" ? (g.coordinates as unknown[])?.[0] : null;
  if (!Array.isArray(pts) || !pts.length) return null;
  const valid = pts.filter((p): p is [number, number] => Array.isArray(p) && typeof p[0] === "number" && typeof p[1] === "number");
  if (!valid.length) return null;
  return [valid.reduce((a, p) => a + p[0], 0) / valid.length, valid.reduce((a, p) => a + p[1], 0) / valid.length];
}

/** The latest position of each event. Sea ice and anything malformed is dropped. */
export function parseEvents(body: unknown): NaturalEvent[] {
  const events = (body as { events?: RawEvent[] } | null)?.events;
  if (!Array.isArray(events)) return [];
  const out: NaturalEvent[] = [];
  for (const e of events) {
    const hazard = HAZARD[e.categories?.[0]?.id ?? ""];
    const last = e.geometry?.at(-1);
    const at = last ? centre(last) : null;
    if (!hazard || !at || !e.id) continue;
    const url = e.sources?.[0]?.url ?? "";
    out.push({ id: e.id, title: String(e.title ?? "Natural event"), hazard, lon: at[0], lat: at[1], date: String(last?.date ?? ""), url: url.startsWith("https://") ? url : "https://eonet.gsfc.nasa.gov/" });
  }
  return out;
}

export async function fetchEvents(): Promise<NaturalEvent[]> {
  const response = await fetch(EONET);
  if (!response.ok) throw new Error("NASA EONET did not respond.");
  return parseEvents(await response.json());
}
