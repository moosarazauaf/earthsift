/**
 * Identify: what is at one point, read in a second from two map tiles.
 * Height from AWS Terrain Tiles; how often the point has been water from
 * JRC Global Surface Water (share of clear Landsat views 1984 to 2021).
 */
import { WATER_TILES, occurrence } from "./waterHistory";
import { latToTileY, lonToTileX, readPixels, readTile } from "./elevation";

const TILE = 256;
const Z = 12;

/** The tile, and the pixel within it, holding a point at zoom `z`. */
export function tilePixel(lon: number, lat: number, z: number) {
  const fx = lonToTileX(lon, z), fy = latToTileY(lat, z);
  const x = Math.floor(fx), y = Math.floor(fy);
  return { x, y, i: Math.min(TILE - 1, Math.floor((fy - y) * TILE)) * TILE + Math.min(TILE - 1, Math.floor((fx - x) * TILE)) };
}

export interface PointFacts { height: number | null; water: number | null }

export async function pointFacts(lon: number, lat: number, signal?: AbortSignal): Promise<PointFacts> {
  const t = tilePixel(lon, lat, Z);
  const [h, w] = await Promise.allSettled([
    readTile(Z, t.x, t.y, signal),
    readPixels(`${WATER_TILES}/${Z}/${t.x}/${t.y}.png`, signal).catch((e: unknown) => {
      // An unpublished tile (404) has no water in it.
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }),
  ]);
  return {
    height: h.status === "fulfilled" ? h.value[t.i]! : null,
    water: w.status === "rejected" ? null : w.value === null ? 0 : occurrence(w.value[t.i * 4 + 2]!, w.value[t.i * 4 + 3]!),
  };
}

/** One plain sentence about the water at a point. */
export function waterWords(pct: number): string {
  if (pct === 0) return "never seen under water since 1984";
  if (pct >= 90) return "permanent water (a river, lake or reservoir)";
  if (pct >= 50) return `water most of the time (${pct}% of views since 1984)`;
  return `under water in ${pct}% of satellite views since 1984: it has flooded before`;
}
