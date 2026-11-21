// Terrain signals for squares in a results file, using the app's own height code. Usage: node terrain.mjs in.json out.json
import puppeteer from "puppeteer-core";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
const [IN, OUT] = process.argv.slice(2);
const rows = JSON.parse(readFileSync(IN, "utf-8"));
const done = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf-8")) : {};
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const p = await b.newPage();
await p.setBypassCSP(true);
p.on("pageerror", (e) => console.log("pageerror", e.message));
await p.goto("https://moosarazauaf.github.io/earthsift/robots.txt", { waitUntil: "domcontentloaded" }).catch(() => {});
await p.addScriptTag({ path: "terrain-bundle.js" });
for (const r of rows) {
  if (done[r.id]) continue;
  try { done[r.id] = await p.evaluate((lon, lat) => window.measure(lon, lat), r.lon, r.lat); }
  catch (e) { console.log("fail", r.id, String(e.message).slice(0, 100)); continue; }
  writeFileSync(OUT, JSON.stringify(done));
}
console.log("measured", Object.keys(done).length, "of", rows.length);
await b.close();
