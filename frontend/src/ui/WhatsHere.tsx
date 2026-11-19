/**
 * "What's here?": a click on empty ground, like the Identify tool in a
 * desktop GIS. It names the place, gives its height and water history, and
 * offers the next steps, so nobody has to find a tool before clicking.
 */
import { useEffect, useState } from "react";

import { formatLatLon } from "../app/logic";
import { reverseGeocode, useStore } from "../app/store";
import { type PointFacts, pointFacts, waterWords } from "../area/identify";

export function WhatsHere() {
  const point = useStore((s) => s.whatsHere);
  const set = useStore((s) => s.set);
  const [name, setName] = useState<string | null>(null);
  const [facts, setFacts] = useState<PointFacts | null>(null);
  useEffect(() => {
    if (!point) return;
    const controller = new AbortController();
    setName(null); setFacts(null);
    void reverseGeocode(point.lat, point.lon).then((n) => { if (!controller.signal.aborted) setName(n); });
    pointFacts(point.lon, point.lat, controller.signal).then((f) => { if (!controller.signal.aborted) setFacts(f); }, () => {});
    return () => controller.abort();
  }, [point]);
  if (!point) return null;
  const where = name ?? formatLatLon(point.lat, point.lon);
  const open = (tab: "summary" | "land" | "weather") => { useStore.getState().analyseAt(point.lon, point.lat); set({ whatsHere: null, areaTab: tab }); };
  const ask = (text: string, send: boolean) => set({ whatsHere: null, agentOpen: true, introOpen: false, agentDraft: { text, send } });
  return (
    <section className="district-card whats-here" aria-label="What's here">
      <div className="row">
        <p><strong>{where}</strong></p>
        <button className="ghost" aria-label="Close" onClick={() => set({ whatsHere: null })}>×</button>
      </div>
      <p className="muted">
        {formatLatLon(point.lat, point.lon)}
        {facts?.height != null && <> · {Math.round(facts.height).toLocaleString("en")} m above sea level</>}
        {facts?.water != null && <> · {waterWords(facts.water)}</>}
        {!facts && " · reading…"}
      </p>
      <div className="row-actions">
        <button className="primary" onClick={() => open("summary")}>Is it safe? Overview</button>
        <button onClick={() => open("land")}>Land and terrain</button>
        <button onClick={() => open("weather")}>Weather and field work</button>
        <button onClick={() => ask(`compare ${name?.split(",")[0] ?? `${point.lat.toFixed(3)}, ${point.lon.toFixed(3)}`} and [place]`, false)}>Compare…</button>
      </div>
    </section>
  );
}
