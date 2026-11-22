/**
 * Map markers in an open-world game style: a white glyph on a dark glass disc
 * with a neon rim that runs from the hazard's colour to magenta. Alerts are
 * diamonds, so official warnings stand apart from news and earthquakes.
 * Proportions and on-screen sizes follow the golden ratio.
 */
import { HAZARD_INFO } from "../news/hazards";
import type { Hazard } from "../news/types";

export const PHI = (1 + Math.sqrt(5)) / 2;
/** On-screen sizes are Fibonacci numbers, each about PHI times the last; ICON_MAX is a hard cap. */
export const ICON_MIN = 13, ICON_MID = 21, ICON_MAX = 34;
/** Camera height at which icons reach full size; every tenfold step away shrinks them by PHI. */
const FULL_SIZE_HEIGHT_M = 200_000;

/** The icon size for a camera height: 34 px at 200 km, 21 at 2,000 km, 13 at 20,000 km, clamped beyond. */
export function iconBasePx(heightM: number): number {
  const px = ICON_MAX * PHI ** -Math.log10(Math.max(heightM, 1) / FULL_SIZE_HEIGHT_M);
  return Math.min(ICON_MAX, Math.max(ICON_MIN, px));
}

/** Importance from -1 (minor) to 1 (major) as a size factor between PHI^-0.5 and PHI^0.5. */
export const iconWeight = (importance: number) => PHI ** (Math.max(-1, Math.min(1, importance)) / 2);
export const iconPx = (base: number, weight: number) => Math.min(ICON_MAX, base * weight);

/** Glyphs on a 24-unit grid: a filled shape and a stroked one. */
const GLYPHS: Record<Hazard, { fill?: string; line?: string }> = {
  flood: { fill: "M12 2.5c3 4 5 6.5 5 9.3a5 5 0 0 1-10 0C7 9 9 6.5 12 2.5Z", line: "M3 19.5c2-1.8 4-1.8 6 0s4 1.8 6 0 4-1.8 6 0" },
  tsunami: { fill: "M2 20c1-9 6-15 13-15 3 0 5 1 7 3-3-.5-6 .5-6.5 3.5-.4 2.5 2 4 4.5 3.5-.5 2.5-1 5-1 5H2Z" },
  earthquake: { line: "M2 12h4l2.5-7 4 15 3-11 1.7 3H22" },
  volcano: { fill: "M9 9h6l7 12H2L9 9Z", line: "M12 6V2M8 5 6 2.5M16 5l2-2.5" },
  landslide: { fill: "M3 21 15 9l6 5v7H3ZM5 10.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0ZM10 4.5a1.8 1.8 0 1 1 3.6 0 1.8 1.8 0 0 1-3.6 0Z" },
  storm: { fill: "M9.5 12a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0Z", line: "M18 3c-3 0-9 1-11 5a6.5 6.5 0 0 0 11 7M6 21c3 0 9-1 11-5a6.5 6.5 0 0 0-11-7" },
  tornado: { line: "M3 4h18M5.5 8.5h13M8 13h8M10 17h4M11.5 21h1" },
  wildfire: { fill: "M12 2c.7 3.5 3 5 4.7 7.5A8 8 0 0 1 12 22a7.5 7.5 0 0 1-7-10c.6-1.8 1.6-3 2.6-4 .2 1.7.9 2.9 2 3.6C9.5 8 10 4.5 12 2Z" },
  rain: { fill: "M7 15a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 7.5 3.8 3.8 0 0 1 17.5 15H7Z", line: "M8 18l-1 3M13 18l-1 3M18 18l-1 3" },
  heat: { fill: "M9.5 17a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0Z", line: "M14 13.5V5a2 2 0 1 0-4 0v8.5a4 4 0 1 0 4 0ZM18 5h3M18 9h3" },
  drought: { fill: "M7 9a5 5 0 1 0 10 0A5 5 0 1 0 7 9Z", line: "M12 1v1.5M3.5 9H2M22 9h-1.5M5.5 3l1 1M18.5 3l-1 1M2 19h6l2-2 2 3 2-3 2 2h6" },
  winter: { line: "M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17M12 6 9.5 3.5M12 6l2.5-2.5M12 18l-2.5 2.5M12 18l2.5 2.5" },
  dust: { line: "M2 8h12a3 3 0 1 0-3-3M2 13h17a3 3 0 1 1-3 3M2 18h8" },
};

const NEON = "#ff2d95";
const cache = new Map<string, HTMLCanvasElement>();

/**
 * A marker drawn `res` pixels wide. `border` overrides the hazard colour; `flag` makes it a diamond
 * with a corner pip in that colour. Below 50 px it is a plain blip: a glyph that small would be a smudge.
 */
export function badge(hazard: Hazard, border?: string, flag?: string, res = 68): HTMLCanvasElement {
  const key = `${hazard}|${border ?? ""}|${flag ?? ""}|${res}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const canvas = Object.assign(document.createElement("canvas"), { width: res, height: res });
  const ctx = canvas.getContext("2d")!;
  const c = res / 2, R = res * 0.44, rim = R / PHI ** 4;
  const outline = (r: number) => {
    ctx.beginPath();
    if (!flag) { ctx.arc(c, c, r, 0, Math.PI * 2); return; }
    ctx.moveTo(c, c - r); ctx.lineTo(c + r, c); ctx.lineTo(c, c + r); ctx.lineTo(c - r, c); ctx.closePath();
  };
  const colour = border ?? HAZARD_INFO[hazard].colour;
  if (res < 50) {
    ctx.fillStyle = "#0d0914"; outline(R); ctx.fill();
    ctx.fillStyle = colour; outline(R * (flag ? 0.72 : 0.8)); ctx.fill();
    ctx.fillStyle = "#ffffff"; outline(R / PHI ** 2); ctx.fill();
    cache.set(key, canvas);
    return canvas;
  }
  const neon = ctx.createLinearGradient(c - R, c - R, c + R, c + R);
  neon.addColorStop(0, colour);
  neon.addColorStop(1 / PHI, colour);
  neon.addColorStop(1, border === "#ffffff" ? "#ffffff" : NEON);
  // The glow lifts the marker off bright imagery.
  ctx.save();
  ctx.shadowColor = colour; ctx.shadowBlur = res * 0.09;
  ctx.fillStyle = neon; ctx.lineJoin = "round"; ctx.strokeStyle = neon; ctx.lineWidth = flag ? rim : 0;
  outline(flag ? R - rim / 2 : R); ctx.fill(); if (flag) ctx.stroke();
  ctx.restore();
  const glass = ctx.createRadialGradient(c, c - R / PHI, 0, c, c, R);
  glass.addColorStop(0, "#3a2147");
  glass.addColorStop(1, "#0d0914");
  ctx.fillStyle = glass;
  outline(R - rim * (flag ? 1.6 : 1)); ctx.fill();
  const glyph = GLYPHS[hazard], size = flag ? R : (2 * R) / PHI, unit = size / 24;
  ctx.save();
  ctx.translate(c - size / 2, c - size / 2);
  ctx.scale(unit, unit);
  ctx.fillStyle = ctx.strokeStyle = "#ffffff";
  ctx.lineCap = ctx.lineJoin = "round";
  ctx.lineWidth = 2.5;
  if (glyph.fill) ctx.fill(new Path2D(glyph.fill));
  if (glyph.line) ctx.stroke(new Path2D(glyph.line));
  ctx.restore();
  if (flag) {
    const r = R / PHI ** 2.5, x = c + R * 0.62, y = c - R * 0.62;
    ctx.fillStyle = "#0d0914"; ctx.beginPath(); ctx.arc(x, y, r * PHI ** 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = flag; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  cache.set(key, canvas);
  return canvas;
}

/** GDACS event types as the hazards whose icons they use. */
export const GDACS_HAZARD: Record<string, Hazard> = { FL: "flood", WF: "wildfire", TC: "storm", EQ: "earthquake", DR: "drought", VO: "volcano" };

/**
 * Pixel offsets that fan out markers drawn on top of each other: points (in
 * screen pixels) falling in the same `cell` form a ring, wider for bigger
 * groups, so each badge can be seen and clicked; lone markers stay put.
 */
export function spreadOffsets(points: ({ x: number; y: number } | null)[], cell = 24, radiusPx = 16): [number, number][] {
  // Grouped by distance, not a fixed grid, so two close markers on either side of a grid line still fan out.
  const groups: number[][] = [];
  points.forEach((p, i) => {
    if (!p) return;
    const near = groups.find((g) => g.some((j) => Math.hypot(points[j]!.x - p.x, points[j]!.y - p.y) < cell));
    if (near) near.push(i); else groups.push([i]);
  });
  const out: [number, number][] = points.map(() => [0, 0]);
  for (const members of groups) {
    if (members.length < 2) continue;
    const r = Math.max(radiusPx, (members.length * 5 * radiusPx) / 16);
    members.forEach((i, k) => {
      const angle = (2 * Math.PI * k) / members.length - Math.PI / 2;
      out[i] = [Math.round(Math.cos(angle) * r), Math.round(Math.sin(angle) * r)];
    });
  }
  return out;
}
