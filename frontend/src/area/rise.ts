/**
 * "If the river rises 2 m, what floods?" A preparedness scenario on the
 * height data: water starts at the area's lowest ground (where its river or
 * drain runs) and spreads to neighbouring ground no more than `rise` metres
 * above that level. Ground that is low but cut off by higher ground stays
 * dry, as it would behind an embankment or ridge.
 */
import type { AoiGeometry, Overlay } from "../app/types";
import { type HeightGrid, fetchHeights, insideRings, latToTileY, lonToTileX, readPixels, rowResolution, tileYToLat } from "./elevation";
import { WATER_TILES, occurrence } from "./waterHistory";

const TILE = 256;
export const RISES = [1, 2, 5] as const;

export interface RiseResult {
  /** 1 where the risen water reaches, row-major over the grid. */
  mask: Uint8Array;
  /** The starting water level, in m above sea level. */
  base: number;
  /** "river": the median height of ground that is water most of the time (JRC); "lowest": the area's 2nd-percentile height. */
  baseFrom: "river" | "lowest";
  /** Share of the area, and hectares, that the risen water reaches. */
  share: number;
  ha: number;
}

/** Fewer permanent-water cells than this and the river is too small to set a level: fall back to the lowest ground. */
export const MIN_RIVER_CELLS = 20;

/**
 * The water starts where the river is: cells that JRC Global Surface Water saw as water in at least half of all
 * views (`water`), at their median height. Without a river in the area, the 2nd-percentile height stands in.
 * shortcut: river slope along the reach, flows, drains and embankments narrower than the ~30 m data are ignored;
 * a gauged water level would replace the median where one is published.
 */
export function riseMask(g: Pick<HeightGrid, "heights" | "width" | "height" | "x0" | "y0" | "z" | "rings">, rise: number, water?: Uint8Array): RiseResult | null {
  const { heights, width: w, height: h } = g;
  const inside = new Uint8Array(w * h);
  const values: number[] = [];
  for (let r = 0; r < h; r += 1) {
    const lat = tileYToLat(g.y0 + (r + 0.5) / TILE, g.z);
    for (let c = 0; c < w; c += 1) {
      const lon = ((g.x0 + (c + 0.5) / TILE) / 2 ** g.z) * 360 - 180;
      if (insideRings(lon, lat, g.rings)) { inside[r * w + c] = 1; values.push(heights[r * w + c]!); }
    }
  }
  if (!values.length) return null;
  values.sort((a, b) => a - b);
  const river: number[] = [];
  if (water) for (let i = 0; i < w * h; i += 1) if (inside[i] && water[i]) river.push(i);
  const fromRiver = river.length >= MIN_RIVER_CELLS;
  const riverHeights = river.map((i) => heights[i]!).sort((a, b) => a - b);
  const base = fromRiver ? riverHeights[Math.floor(riverHeights.length / 2)]! : values[Math.floor(values.length * 0.02)]!;
  const level = base + rise;
  const mask = new Uint8Array(w * h);
  const queue: number[] = [];
  // Seeds: the river itself, or the lowest ground; water then spreads only below the risen level.
  for (let i = 0; i < w * h; i += 1) {
    if (inside[i] && (fromRiver ? water![i] && heights[i]! <= level : heights[i]! <= base)) { mask[i] = 1; queue.push(i); }
  }
  // Spread through neighbouring ground below the risen level (4-connected, so water does not leak through diagonal gaps).
  for (let q = 0; q < queue.length; q += 1) {
    const i = queue[q]!, r = Math.floor(i / w), c = i % w;
    for (const j of [c > 0 ? i - 1 : -1, c < w - 1 ? i + 1 : -1, r > 0 ? i - w : -1, r < h - 1 ? i + w : -1]) {
      if (j >= 0 && !mask[j] && heights[j]! <= level) { mask[j] = 1; queue.push(j); }
    }
  }
  let reached = 0, all = 0, m2 = 0;
  for (let r = 0; r < h; r += 1) {
    const px = rowResolution(g, r) ** 2;
    for (let c = 0; c < w; c += 1) {
      const i = r * w + c;
      if (!inside[i]) continue;
      all += 1;
      if (mask[i]) { reached += 1; m2 += px; }
    }
  }
  // Water that spread outside the area is drawn too: it shows where the flood comes from.
  return { mask, base, baseFrom: fromRiver ? "river" : "lowest", share: reached / all, ha: m2 / 10_000 };
}

const WORLD_M = 40_075_016.686;

/** The scenario's mask as a web-mercator raster, for counting the people who live on the flooded ground. */
export function riseRaster(g: Pick<HeightGrid, "width" | "height" | "x0" | "y0" | "z">, mask: Uint8Array) {
  const cell = WORLD_M / (TILE * 2 ** g.z);
  return { data: mask, epsg: 3857, west: (g.x0 / 2 ** g.z) * WORLD_M - WORLD_M / 2, north: WORLD_M / 2 - (g.y0 / 2 ** g.z) * WORLD_M, res: cell, width: g.width, height: g.height };
}

/** 1 for each height cell whose centre JRC Global Surface Water saw as water in at least half of all views. */
export async function permanentWater(g: Pick<HeightGrid, "width" | "height" | "x0" | "y0" | "z">, signal?: AbortSignal): Promise<Uint8Array> {
  const Z = Math.min(g.z, 12); // the water tiles stop at zoom 12
  const out = new Uint8Array(g.width * g.height);
  const cells = new Map<string, number[]>();
  for (let r = 0; r < g.height; r += 1) {
    const lat = tileYToLat(g.y0 + (r + 0.5) / TILE, g.z);
    const fy = latToTileY(lat, Z);
    for (let c = 0; c < g.width; c += 1) {
      const lon = ((g.x0 + (c + 0.5) / TILE) / 2 ** g.z) * 360 - 180;
      const fx = lonToTileX(lon, Z);
      const key = `${Math.floor(fx)}/${Math.floor(fy)}`;
      const px = Math.min(TILE - 1, Math.floor((fy - Math.floor(fy)) * TILE)) * TILE + Math.min(TILE - 1, Math.floor((fx - Math.floor(fx)) * TILE));
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key)!.push(r * g.width + c, px);
    }
  }
  await Promise.all([...cells].map(async ([key, list]) => {
    const pixels = await readPixels(`${WATER_TILES}/${Z}/${key}.png`, signal).catch((e: unknown) => {
      if ((e as { status?: number }).status === 404) return null; // no water published in this tile
      throw e;
    });
    if (!pixels) return;
    for (let k = 0; k < list.length; k += 2) {
      const px = list[k + 1]! * 4;
      if (occurrence(pixels[px + 2]!, pixels[px + 3]!) >= 50) out[list[k]!] = 1;
    }
  }));
  return out;
}

export async function riseOverlay(aoi: AoiGeometry, rise: number, signal?: AbortSignal): Promise<{ overlay: Overlay; result: RiseResult; raster: ReturnType<typeof riseRaster> }> {
  const g = await fetchHeights(aoi, signal);
  const water = await permanentWater(g, signal).catch(() => undefined);
  const result = riseMask(g, rise, water);
  if (!result) throw new Error("No elevation inside this area.");
  const pixels = new Uint8ClampedArray(g.width * g.height * 4);
  for (let i = 0; i < result.mask.length; i += 1) if (result.mask[i]) pixels.set([33, 118, 230, 175], i * 4);
  const canvas = Object.assign(document.createElement("canvas"), { width: g.width, height: g.height });
  canvas.getContext("2d")!.putImageData(new ImageData(pixels, g.width, g.height), 0, 0);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  if (!blob) throw new Error("The flood scenario could not be drawn.");
  const lon = (x: number) => (x / 2 ** g.z) * 360 - 180;
  return {
    result,
    raster: riseRaster(g, result.mask),
    overlay: {
      title: `If the water rises ${rise} m above ${result.baseFrom === "river" ? "the river" : "the lowest ground"} (${Math.round(result.base)} m), AWS Terrain Tiles and JRC Global Surface Water`,
      url: URL.createObjectURL(blob),
      geotiff: "",
      bounds: [lon(g.x0), tileYToLat(g.y0 + g.height / TILE, g.z), lon(g.x0 + g.width / TILE), tileYToLat(g.y0, g.z)],
      legend: { classes: [{ label: `Under water at +${rise} m`, color: "rgb(33,118,230)" }] },
    },
  };
}
