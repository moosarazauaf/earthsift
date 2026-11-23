/** The earthquake clicked on the globe: what USGS reports, and how many people live near it. */
import { useStore } from "../app/store";
import { HAZARD_INFO, ago } from "../news/hazards";
import { PeopleNear } from "./PeopleNear";

const PAGER = { green: "little or no", yellow: "some", orange: "significant", red: "extensive" } as const;

export function EventCard() {
  const event = useStore((s) => s.selectedEvent);
  const set = useStore((s) => s.set);
  if (!event) return null;
  return (
    <section className="district-card quake-card" aria-label="Natural event">
      <div className="row">
        <p><strong>{event.title}</strong></p>
        <button className="ghost" aria-label="Close" onClick={() => set({ selectedEvent: null })}>×</button>
      </div>
      <p className="muted">{HAZARD_INFO[event.hazard].label} · last reported {event.date ? ago(event.date) : "recently"} · NASA EONET</p>
      <PeopleNear lon={event.lon} lat={event.lat} km={50} source="NASA EONET" />
      <a className="button" href={event.url} target="_blank" rel="noopener noreferrer">Source report</a>
    </section>
  );
}

export function QuakeCard() {
  const quake = useStore((s) => s.selectedQuake);
  const set = useStore((s) => s.set);
  if (!quake) return null;
  return (
    <section className="district-card quake-card" aria-label="Earthquake">
      <div className="row">
        <p><strong>M{quake.magnitude.toFixed(1)}</strong> · {quake.place}</p>
        <button className="ghost" aria-label="Close" onClick={() => set({ selectedQuake: null })}>×</button>
      </div>
      <p className="muted">
        {ago(quake.time)}, {Math.round(quake.depthKm)} km deep
        {quake.pager ? ` · USGS expects ${PAGER[quake.pager]} damage (PAGER ${quake.pager})` : ""}
        {quake.tsunami ? " · flagged for possible tsunami" : ""}.
      </p>
      <PeopleNear lon={quake.lon} lat={quake.lat} km={100} source="USGS" />
      <a className="button" href={quake.url} target="_blank" rel="noopener noreferrer">Event page on USGS</a>
    </section>
  );
}
