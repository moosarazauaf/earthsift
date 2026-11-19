/**
 * Two places side by side: the questions people weigh when choosing where
 * to buy, build, settle or put a project. Each place is read with the same
 * code as its own area overview; a part that cannot be read is left blank
 * rather than holding up the rest.
 */
import type { AoiGeometry } from "../app/types";
import { landCoverInBrowser, PIXEL_BUDGET, populationInBrowser } from "../engine/client";
import { formatPeople } from "../engine/population";
import { geometryInfo } from "./gis";
import { fetchClimate } from "./climate";
import { type RiskItem, riskCheck } from "./risk";
import { fetchSolar } from "./solar";

export interface PlaceFacts {
  label: string;
  risks: RiskItem[];
  people: number | null;
  areaKm2: number;
  cover: { name: string; share: number }[] | null;
  rain: number | null;
  hottest: { month: string; tmax: number } | null;
  solar: number | null;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ok = <T,>(r: PromiseSettledResult<T>): T | null => (r.status === "fulfilled" ? r.value : null);

export async function readPlace(geometry: AoiGeometry, label: string): Promise<PlaceFacts> {
  const g = geometryInfo(geometry);
  const [lon, lat] = g.centroid;
  const cover = landCoverInBrowser({ aoi: geometry, maxPixels: PIXEL_BUDGET.fast });
  const people = populationInBrowser({ aoi: geometry });
  const [risk, pop, lc, climate, solar] = await Promise.allSettled([riskCheck(geometry, lat, lon), people.promise, cover.promise, fetchClimate(lat, lon), fetchSolar(lat, lon)]);
  const c = ok(climate);
  const hot = c ? c.months.reduce((best, m, i) => (m.tmax > best.tmax ? { month: MONTHS[i]!, tmax: m.tmax } : best), { month: "", tmax: -Infinity }) : null;
  return {
    label,
    risks: ok(risk)?.items ?? [],
    people: ok(pop)?.people ?? null,
    areaKm2: g.areaKm2,
    cover: ok(lc)?.shares.slice(0, 3).map((s) => ({ name: s.name, share: s.share })) ?? null,
    rain: c?.annualRain ?? null,
    hottest: hot && Number.isFinite(hot.tmax) ? hot : null,
    solar: ok(solar)?.yearlyPerKw ?? null,
  };
}

const WORD = { high: "high", medium: "some", low: "low" } as const;
const blank = "not read";

/** One line per question: "Flooding: Lahore some · Islamabad low". */
export function compareLines(a: PlaceFacts, b: PlaceFacts): string[] {
  const pair = (fa: (p: PlaceFacts) => string) => `${a.label} ${fa(a)} · ${b.label} ${fa(b)}`;
  const risk = (hazard: RiskItem["hazard"]) => (p: PlaceFacts) => { const r = p.risks.find((x) => x.hazard === hazard); return r ? WORD[r.level] : blank; };
  return [
    `Flooding since 1984: ${pair(risk("flood"))}`,
    `Hill torrents: ${pair(risk("torrent"))}`,
    `Landslide-prone slopes: ${pair(risk("landslide"))}`,
    `Next 7 days: ${pair(risk("week"))}`,
    `People: ${pair((p) => (p.people === null ? blank : `${formatPeople(p.people).replace("about ", "")} (${Math.round(p.people / Math.max(p.areaKm2, 0.01)).toLocaleString("en")} per km²)`))}`,
    `Main land cover: ${pair((p) => (p.cover ? p.cover.map((c) => `${c.name.toLowerCase()} ${Math.round(c.share * 100)}%`).join(", ") : blank))}`,
    `Rain in an average year: ${pair((p) => (p.rain === null ? blank : `${Math.round(p.rain).toLocaleString("en")} mm`))}`,
    `Hottest month: ${pair((p) => (p.hottest ? `${p.hottest.month}, highs of ${Math.round(p.hottest.tmax)} °C` : blank))}`,
    `Solar power: ${pair((p) => (p.solar === null ? blank : `${Math.round(p.solar).toLocaleString("en")} kWh a year per kW of panels`))}`,
  ];
}

/** The plain differences worth saying first: where one place is clearly riskier. */
export function verdict(a: PlaceFacts, b: PlaceFacts): string {
  const rank = { high: 2, medium: 1, low: 0 } as const;
  const score = (p: PlaceFacts) => p.risks.filter((r) => r.hazard !== "week").reduce((s, r) => s + rank[r.level], 0);
  const sa = score(a), sb = score(b);
  if (!a.risks.length || !b.risks.length) return "The risk check could not be read for both places.";
  if (sa === sb) {
    const worst = (p: PlaceFacts) => p.risks.filter((r) => r.hazard !== "week" && r.level !== "low").map((r) => r.title.toLowerCase());
    const wa = worst(a), wb = worst(b);
    if (!wa.length && !wb.length) return `${a.label} and ${b.label} both have low flood and landslide risk.`;
    if (wa.join() === wb.join()) return `${a.label} and ${b.label} carry about the same risk: ${wa.join(" and ")}.`;
    return `Different risks: ${a.label}'s is ${wa.join(" and ") || "low"}, ${b.label}'s is ${wb.join(" and ") || "low"}.`;
  }
  const [safer, riskier] = sa < sb ? [a, b] : [b, a];
  const why = riskier.risks.filter((r) => r.hazard !== "week" && rank[r.level] > rank[safer.risks.find((x) => x.hazard === r.hazard)?.level ?? "low"]).map((r) => r.title.toLowerCase());
  return `${safer.label} is the safer ground: ${riskier.label} has more ${why.join(" and ")} risk.`;
}
