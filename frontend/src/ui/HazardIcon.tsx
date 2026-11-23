/**
 * A hazard's icon in the panels: a plain line drawing in the hazard's colour, to
 * suit the dashboard. The map markers (globe/pixelMarkers) draw the same glyphs in their own style.
 */
import { HAZARD_INFO } from "../news/hazards";
import type { Hazard } from "../news/types";

/** Glyphs on a 24-unit grid: a filled shape and a stroked one. */
export const GLYPHS: Record<Hazard, { fill?: string; line?: string }> = {
  flood: { fill: "M12 2.5c3 4 5 6.5 5 9.3a5 5 0 0 1-10 0C7 9 9 6.5 12 2.5Z", line: "M3 19.5c2-1.8 4-1.8 6 0s4 1.8 6 0 4-1.8 6 0" },
  tsunami: { fill: "M2 20c1-9 6-15 13-15 3 0 5 1 7 3-3-.5-6 .5-6.5 3.5-.4 2.5 2 4 4.5 3.5-.5 2.5-1 5-1 5H2Z" },
  earthquake: { line: "M2 12h4l2.5-7 4 15 3-11 1.7 3H22" },
  volcano: { fill: "M9 9h6l7 12H2L9 9Z", line: "M12 6V2M8 5 6 2.5M16 5l2-2.5" },
  landslide: { fill: "M3 21 15 9l6 5v7H3ZM5 10.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0ZM10 4.5a1.8 1.8 0 1 1 3.6 0 1.8 1.8 0 0 1-3.6 0Z" },
  storm: { fill: "M9.5 12a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0Z", line: "M18 3c-3 0-9 1-11 5a6.5 6.5 0 0 0 11 7M6 21c3 0 9-1 11-5a6.5 6.5 0 0 0-11-7" },
  tornado: { line: "M3 4h18M5.5 8.5h13M8 13h8M10 17h4M11.5 21h1" },
  wildfire: { fill: "M12 2c.7 3.5 3 5 4.7 7.5A8 8 0 0 1 12 22a7.5 7.5 0 0 1-7-10c.6-1.8 1.6-3 2.6-4 .2 1.7.9 2.9 2 3.6C9.5 8 10 4.5 12 2Z" },
  rain: { fill: "M7 15a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 7.5 3.8 3.8 0 0 1 17.5 15H7Z", line: "M8 18l-1 3M13 18l-1 3M18 18l-1 3" },
  heat: { fill: "M9.5 17a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0Z", line: "M14 13.5V5a2 2 0 1 0-4 0v8.5a4 4 0 1 0 4 0ZM18 5h3M18 9h3" },
  drought: { fill: "M7 9a5 5 0 1 0 10 0A5 5 0 1 0 7 9Z", line: "M12 1v1.5M3.5 9H2M22 9h-1.5M5.5 3l1 1M18.5 3l-1 1M2 19h6l2-2 2 3 2-3 2 2h6" },
  winter: { line: "M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17M12 6 9.5 3.5M12 6l2.5-2.5M12 18l-2.5 2.5M12 18l2.5 2.5" },
  dust: { line: "M2 8h12a3 3 0 1 0-3-3M2 13h17a3 3 0 1 1-3 3M2 18h8" },
};

export function HazardIcon({ hazard, size = 16 }: { hazard: Hazard; size?: number }) {
  const colour = HAZARD_INFO[hazard].colour, glyph = GLYPHS[hazard];
  return (
    <svg className="hazard-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colour} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {glyph.fill && <path d={glyph.fill} fill={colour} stroke="none" />}
      {glyph.line && <path d={glyph.line} />}
    </svg>
  );
}
