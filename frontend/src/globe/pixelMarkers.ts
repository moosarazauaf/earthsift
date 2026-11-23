/**
 * Map markers in an open-world game style: a white glyph on a dark glass disc
 * with a neon rim that runs from the hazard's colour to magenta. Alerts are
 * diamonds, so official warnings stand apart from news and earthquakes.
 * Proportions and on-screen sizes follow the golden ratio.
 */
import { HAZARD_INFO } from "../news/hazards";
import type { Hazard } from "../news/types";
import { GLYPHS } from "../ui/HazardIcon";

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
    const ring = ctx.createLinearGradient(c - R, c - R, c + R, c + R);
    ring.addColorStop(0, colour); ring.addColorStop(1 / PHI, colour); ring.addColorStop(1, border === "#ffffff" ? "#ffffff" : NEON);
    ctx.fillStyle = ring; outline(R * (flag ? 0.8 : 0.86)); ctx.fill();
    ctx.fillStyle = "#0d0914"; outline(R * (flag ? 0.46 : 0.5)); ctx.fill();
    ctx.fillStyle = "#ffffff"; outline(R / PHI ** 3); ctx.fill();
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
    // A dense swarm stays in place: a ring of dozens would hide where it really is.
    if (members.length < 2 || members.length > 8) continue;
    const r = Math.max(radiusPx, (members.length * 5 * radiusPx) / 16);
    members.forEach((i, k) => {
      const angle = (2 * Math.PI * k) / members.length - Math.PI / 2;
      out[i] = [Math.round(Math.cos(angle) * r), Math.round(Math.sin(angle) * r)];
    });
  }
  return out;
}
