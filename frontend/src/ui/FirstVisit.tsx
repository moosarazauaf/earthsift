/**
 * The first thirty seconds: three things a newcomer cannot guess, shown once
 * after the opening screen closes, then never again in this browser.
 */
import { useState } from "react";

import { useStore } from "../app/store";

const KEY = "earthsift.firstVisit.v1";
const seen = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };

export function FirstVisit() {
  const introOpen = useStore((s) => s.introOpen);
  const mode = useStore((s) => s.mode);
  const [done, setDone] = useState(seen);
  // Only on the open globe: not over the opening screen, an analysis or a shared link's overview.
  if (done || introOpen || !["explore", "live"].includes(mode)) return null;
  const close = () => { try { localStorage.setItem(KEY, "1"); } catch { /* private window: show again next time */ } setDone(true); };
  return (
    <aside className="first-visit" aria-label="Getting started">
      <ol>
        <li><strong>Click any place</strong> on the globe to see what is there and whether it is safe.</li>
        <li>Each place opens in <strong>tabs</strong>: the Summary first, then Land, People, Weather and Analyse.</li>
        <li><strong>Ask anything</strong> in the search box or to Sentri: <em>"Is Sukkur safe?"</em>, <em>"compare Lahore and Islamabad"</em>.</li>
      </ol>
      <button className="primary" onClick={close}>Got it</button>
    </aside>
  );
}
