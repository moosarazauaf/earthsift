// Score accuracy.json: the risk check's Flooding rating against 2022 radar flood maps.
import { readFileSync } from "node:fs";

const rows = JSON.parse(readFileSync("accuracy.json", "utf-8"));
const wilson = (k, n) => {
  if (!n) return "n/a";
  const z = 1.96, p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return `${Math.round(p * 100)}% (95% CI ${Math.round(((c - h) / d) * 100)} to ${Math.round(((c + h) / d) * 100)}%)`;
};
const score = (set, cut, label) => {
  const ok = set.filter((r) => typeof r.flooded === "number" && r.flood);
  const pred = (r) => r.flood === "high" || r.flood === "medium";
  const tp = ok.filter((r) => pred(r) && r.flooded >= cut).length, fn = ok.filter((r) => !pred(r) && r.flooded >= cut).length;
  const fp = ok.filter((r) => pred(r) && r.flooded < cut).length, tn = ok.filter((r) => !pred(r) && r.flooded < cut).length;
  console.log(`\n${label}, flooded = at least ${cut}% newly under water: n = ${ok.length} (${tp + fn} flooded, ${fp + tn} not)`);
  console.log(`  confusion: hit ${tp}, missed ${fn}, false alarm ${fp}, correct low ${tn}`);
  console.log(`  recall (flooded squares flagged): ${wilson(tp, tp + fn)}`);
  console.log(`  precision (flagged squares that flooded): ${wilson(tp, tp + fp)}`);
  console.log(`  specificity (dry squares rated Low): ${wilson(tn, tn + fp)}`);
  // High only, as a stricter prediction.
  const hi = ok.filter((r) => r.flood === "high");
  console.log(`  rated High: ${hi.length}, of which flooded ${hi.filter((r) => r.flooded >= cut).length}; rated Low: ${ok.filter((r) => r.flood === "low").length}, of which flooded ${ok.filter((r) => r.flood === "low" && r.flooded >= cut).length}`);
};
const pk = rows.filter((r) => /Pakistan/.test(r.place ?? ""));
console.log(`squares drawn: ${rows.length}; in Pakistan: ${pk.length}; with no radar result: ${rows.filter((r) => typeof r.flooded !== "number").length}`);
for (const r of rows.filter((r) => r.error)) console.log(`  square ${r.id} (${r.place || `${r.lon}, ${r.lat}`}): ${r.error}`);
score(pk, 5, "Pakistan squares");
score(pk, 2, "Pakistan squares (sensitivity)");
score(pk, 10, "Pakistan squares (sensitivity)");
score(rows, 5, "All squares");
console.log("\nmean newly flooded by rating (Pakistan):", ["high", "medium", "low"].map((l) => { const s = pk.filter((r) => r.flood === l && typeof r.flooded === "number"); return `${l} ${s.length ? (s.reduce((a, r) => a + r.flooded, 0) / s.length).toFixed(1) : "-"}% (n=${s.length})`; }).join(", "));
console.log("torrent rating vs flooded (Pakistan):", ["medium", "low"].map((l) => { const s = pk.filter((r) => r.torrent === l && typeof r.flooded === "number"); return `${l}: ${s.filter((r) => r.flooded >= 5).length} of ${s.length} flooded`; }).join(", "));
