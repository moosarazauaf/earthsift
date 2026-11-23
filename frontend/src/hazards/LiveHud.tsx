/** The Live console on the map: the UTC clock and one switch per feed, each with its live count. */
import { useEffect, useState } from "react";

import { useStore } from "../app/store";
import { HAZARD_INFO } from "../news/hazards";
import type { Hazard } from "../news/types";
import { HazardIcon } from "../ui/HazardIcon";
import { Icon } from "../ui/Icon";

export function LiveHud() {
  const s = useStore();
  const [now, setNow] = useState(() => new Date());
  const live = s.mode === "live" && !s.introOpen;
  useEffect(() => {
    if (!live) return;
    const st = useStore.getState();
    if (st.quakes === null) void st.loadQuakes();
    if (st.alerts === null) void st.loadAlerts();
    if (st.news === null) void st.loadNews();
    if (st.events === null) void st.loadEvents();
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [live]);
  if (!live) return null;

  const shown = (key: string) => !s.liveHidden.includes(key);
  const flip = (key: string) => s.set({ liveHidden: shown(key) ? [...s.liveHidden, key] : s.liveHidden.filter((k) => k !== key) });
  const kinds = [...new Set((s.events ?? []).map((e) => e.hazard))] as Hazard[];
  const quakeCount = s.quakes === null ? null : s.quakes.length + s.minorQuakes.length;
  const feed = (key: string, on: boolean, toggle: () => void, icon: React.ReactNode, label: string, count: number | null | undefined, title: string) => (
    <button key={key} className={on ? "hud-feed on" : "hud-feed"} aria-pressed={on} onClick={toggle} title={title}>
      {icon}<span>{label}</span><b>{count ?? "…"}</b>
    </button>
  );
  return (
    <section className="live-hud" aria-label="Live feeds">
      <p className="hud-clock"><i aria-hidden="true" />LIVE <time>{now.toISOString().slice(11, 19)} UTC</time></p>
      {feed("quakes", s.quakesOn, () => s.set({ quakesOn: !s.quakesOn }), <HazardIcon hazard="earthquake" size={13} />, "Quakes", quakeCount, "Earthquakes of M2.5 and above, past 7 days (USGS)")}
      {kinds.map((h) => feed(h, shown(h), () => flip(h), <HazardIcon hazard={h} size={13} />, HAZARD_INFO[h].label, (s.events ?? []).filter((e) => e.hazard === h).length, `${HAZARD_INFO[h].label}: events NASA EONET lists as active in the past 30 days`))}
      {feed("alerts", shown("alerts"), () => flip("alerts"), <Icon name="alert" size={13} />, "Alerts", s.alerts?.length, "Red and orange alerts, past 14 days (GDACS)")}
      {feed("news", shown("news"), () => flip("news"), <Icon name="live" size={13} />, "News", s.news?.stories.length, "Hazard stories from the news scan, past 72 hours")}
      {feed("sats", s.satellitesOn, () => s.set({ satellitesOn: !s.satellitesOn }), <Icon name="satellite" size={13} />, "Satellites", null, "Landsat and Sentinel satellites, live position and orbit")}
    </section>
  );
}
