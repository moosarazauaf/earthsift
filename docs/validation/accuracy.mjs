// Sprint 3: score the risk check against Sentinel-1 flood maps of 2022 on random 10 km squares.
// Usage: node accuracy.mjs [count] [site]
import puppeteer from "puppeteer-core";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const COUNT = Number(process.argv[2] ?? 40);
const SITE = process.argv[3] ?? "https://moosarazauaf.github.io/earthsift/";
const OUT = process.env.OUT ?? "accuracy.json";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fixed seed so anyone can draw the same squares.
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = mulberry32(Number(process.env.SEED ?? 20220825));
// The 2022 flood region: Sindh, southern Punjab and eastern Balochistan.
const BOX = { west: 66.8, east: 71.5, south: 24.8, north: 29.8 };
const squares = Array.from({ length: COUNT }, (_, i) => ({ id: i + 1, lon: +(BOX.west + rand() * (BOX.east - BOX.west)).toFixed(4), lat: +(BOX.south + rand() * (BOX.north - BOX.south)).toFixed(4) }));

const square = (lon, lat, km = 10) => {
  const dy = km / 2 / 110.574, dx = km / 2 / (111.32 * Math.cos((lat * Math.PI) / 180));
  return { type: "Polygon", coordinates: [[[lon - dx, lat - dy], [lon + dx, lat - dy], [lon + dx, lat + dy], [lon - dx, lat + dy], [lon - dx, lat - dy]]] };
};
const b64url = (s) => Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const floodLink = (sq) => `${SITE}?run=${b64url(JSON.stringify({ v: 1, k: "flood", m: 250000, r: {
  aoi: square(sq.lon, sq.lat), label: `Square ${sq.id}`,
  before: { start: "2022-05-15", end: "2022-06-15" }, flood: { start: "2022-08-25", end: "2022-09-10" }, minAreaHa: 1,
} }))}`;

const done = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf-8")) : [];
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"], defaultViewport: { width: 1600, height: 900 } });
const ua = (await browser.userAgent()).replace("HeadlessChrome", "Chrome");

for (const sq of squares) {
  if (done.some((d) => d.id === sq.id && d.flooded !== undefined)) continue;
  const row = { ...sq };
  const p = await browser.newPage();
  await p.setUserAgent(ua);
  try {
    // 1. The risk check, as a visitor would see it.
    await p.goto(`${SITE}?at=${sq.lon},${sq.lat},10`, { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForFunction(() => document.querySelectorAll(".risks li").length >= 3, { timeout: 180000, polling: 1000 });
    const risks = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll(".risks li")].map((li) => [li.querySelector("strong")?.textContent, li.className.replace("risk ", "")])));
    row.flood = risks["Flooding"] ?? null;
    row.torrent = risks["Hill torrents"] ?? null;
    row.place = await p.evaluate(() => document.querySelector(".panel.right h2")?.textContent ?? "");
    // 2. The 2022 radar flood map of the same square.
    await p.goto(floodLink(sq), { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "Run it on this device"), { timeout: 120000, polling: 1000 });
    await p.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Run it on this device")?.click());
    await p.waitForFunction(() => /% of the analysed area|could not|No Sentinel|no radar|failed/i.test(document.querySelector(".panel.right")?.innerText ?? ""), { timeout: 600000, polling: 3000 });
    const text = await p.evaluate(() => document.querySelector(".panel.right")?.innerText ?? "");
    const m = /([\d.]+)% of the analysed area/.exec(text);
    if (m) row.flooded = Number(m[1]);
    else row.error = text.split("\n").find((l) => /could not|No Sentinel|no radar|failed/i.test(l))?.slice(0, 160) ?? "no result";
  } catch (e) {
    row.error = String(e.message).slice(0, 160);
  }
  await p.close();
  const i = done.findIndex((d) => d.id === sq.id);
  if (i >= 0) done[i] = row; else done.push(row);
  writeFileSync(OUT, JSON.stringify(done, null, 1));
  console.log(`${sq.id}\t${sq.lon},${sq.lat}\tflood=${row.flood}\ttorrent=${row.torrent}\tnewly flooded=${row.flooded ?? "-"}%\t${row.error ?? ""}\t${row.place}`);
}
await browser.close();
