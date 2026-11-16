/**
 * Field work in the next 48 hours, for farmers and anyone working outdoors:
 * when heat makes heavy work unsafe, and when the weather suits spraying
 * crops. Hourly forecast from Open-Meteo, at the area's centre.
 */
import { getJson } from "../news/weather";

/**
 * Wet-bulb temperature combines heat and humidity, which is what stops sweat cooling the body.
 * Earthsift's lines, as rules of thumb: heavy work needs long rests from 27 °C, any work outdoors is risky from 30 °C.
 * Full sun adds to the strain, so these are lenient.
 */
export const WET_BULB_HEAVY = 27;
export const WET_BULB_DANGER = 30;
/** Spraying: enough breeze to avoid still-air drift and inversions, not so much that drops blow away; dry, not hot, in daylight. */
export const SPRAY = { minWind: 3, maxWind: 15, maxRainChance: 30, maxTemp: 30, firstHour: 6, lastHour: 18, minHours: 2 };

export interface Hour { time: string; wetBulb: number; wind: number; rainChance: number; rain: number; temp: number }
export interface Window { start: string; end: string; hours: number }

export function parseHours(body: unknown): Hour[] {
  const h = (body as { hourly?: Record<string, unknown[]> }).hourly;
  if (!h || !Array.isArray(h.time)) return [];
  const n = (k: string, i: number) => (typeof h[k]?.[i] === "number" ? (h[k]![i] as number) : NaN);
  return h.time.map((t, i) => ({ time: String(t), wetBulb: n("wet_bulb_temperature_2m", i), wind: n("wind_speed_10m", i), rainChance: n("precipitation_probability", i), rain: n("precipitation", i), temp: n("temperature_2m", i) }))
    .filter((x) => Number.isFinite(x.wetBulb) && Number.isFinite(x.wind) && Number.isFinite(x.temp));
}

/** Runs of consecutive hours that pass `ok`, at least `min` long; `end` is the hour after the last good one. */
export function runs(hours: Hour[], ok: (h: Hour, i: number) => boolean, min: number): Window[] {
  const out: Window[] = [];
  let start = -1;
  for (let i = 0; i <= hours.length; i += 1) {
    const good = i < hours.length && ok(hours[i]!, i);
    if (good && start < 0) start = i;
    if (!good && start >= 0) {
      if (i - start >= min) out.push({ start: hours[start]!.time, end: hours[i]?.time ?? addHour(hours[i - 1]!.time), hours: i - start });
      start = -1;
    }
  }
  return out;
}
const addHour = (t: string) => { const d = new Date(`${t}:00Z`); d.setUTCHours(d.getUTCHours() + 1); return d.toISOString().slice(0, 16); };
const hourOf = (t: string) => Number(t.slice(11, 13));

export function heatWindows(hours: Hour[]): { heavy: Window[]; danger: Window[]; maxWetBulb: number } {
  return {
    heavy: runs(hours, (h) => h.wetBulb >= WET_BULB_HEAVY, 1),
    danger: runs(hours, (h) => h.wetBulb >= WET_BULB_DANGER, 1),
    maxWetBulb: Math.max(...hours.map((h) => h.wetBulb)),
  };
}

export function sprayWindows(hours: Hour[]): Window[] {
  const dryAround = (i: number) => hours.slice(i, i + 3).every((h) => !(h.rain > 0) && !(h.rainChance > SPRAY.maxRainChance));
  return runs(hours, (h, i) => h.wind >= SPRAY.minWind && h.wind <= SPRAY.maxWind && h.temp <= SPRAY.maxTemp
    && hourOf(h.time) >= SPRAY.firstHour && hourOf(h.time) < SPRAY.lastHour && dryAround(i), SPRAY.minHours);
}

/** "Tue 09:00 to 13:00" in the place's own time (Open-Meteo returns local times with timezone=auto). */
export function windowText(w: Window): string {
  const day = new Date(`${w.start.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en", { weekday: "short", timeZone: "UTC" });
  return `${day} ${w.start.slice(11, 16)} to ${w.end.slice(11, 16)}`;
}

export async function fetchFieldHours(lat: number, lon: number): Promise<Hour[]> {
  return parseHours(await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&hourly=wet_bulb_temperature_2m,wind_speed_10m,precipitation_probability,precipitation,temperature_2m&forecast_hours=48&timezone=auto`));
}
