import { fetchHeights, terrainStats } from "../../frontend/src/area/elevation";
import { heightsInside } from "../../frontend/src/area/risk";
import { squareAround } from "../../frontend/src/app/logic";
(window as any).measure = async (lon: number, lat: number) => {
  const g = await fetchHeights(squareAround(lon, lat, 10));
  const s = terrainStats(g.heights, g.width, g.height, g.x0, g.y0, g.z, g.rings)!;
  const out: Record<string, number> = { flat: s.slopeShares[0]!, mean: s.mean };
  for (const km of [50, 100, 150]) {
    const h = heightsInside(await fetchHeights(squareAround(lon, lat, km * 2))).sort((a, b) => a - b);
    out["max" + km] = h[h.length - 1]! - s.mean;
    out["p99_" + km] = h[Math.floor(h.length * 0.99)]! - s.mean; // robust to single-cell spikes
    out["below" + km] = h.filter((x) => x < s.mean).length / h.length; // how low the square sits in its surroundings
  }
  return out;
};
