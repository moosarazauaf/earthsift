/**
 * The interface's icon set: one 24-unit grid and one stroke, so every control
 * reads as part of the same drawing as the map markers.
 */
const PATHS = {
  home: "M3 11 12 3l9 8M5.5 9.5V21h13V9.5M10 21v-6h4v6",
  wave: "M3 7.5c2-1.8 4-1.8 6 0s4 1.8 6 0 4-1.8 6 0M3 13.5c2-1.8 4-1.8 6 0s4 1.8 6 0 4-1.8 6 0M3 19.5c2-1.8 4-1.8 6 0s4 1.8 6 0 4-1.8 6 0",
  live: "M12 12h.01M8.5 15.5a5 5 0 0 1 0-7M15.5 8.5a5 5 0 0 1 0 7M5 19a10 10 0 0 1 0-14M19 5a10 10 0 0 1 0 14",
  weather: "M8 2.5V4M2.5 8H4M4.1 4.1l1 1M11.9 4.1l-1 1M5 10.5a3.5 3.5 0 1 1 6-3M8 20a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 18 13.5a3.3 3.3 0 0 1-.5 6.5H8Z",
  tree: "M12 22v-8M12 2 6 10h3l-4 6h14l-4-6h3l-6-8Z",
  city: "M3 21h18M5 21V8l6-3v16M11 11h8v10M8 10v.01M8 14v.01M8 18v.01M15 14v.01M15 18v.01",
  map: "M9 4 3 6.5v14L9 18l6 2.5 6-2.5v-14L15 6.5 9 4ZM9 4v14M15 6.5v14",
  ruler: "M3 16 16 3l5 5L8 21l-5-5ZM7 12l2 2M10 9l3 3M13 6l2 2",
  check: "M4 12.5 9.5 18 20 6",
  close: "M6 6l12 12M18 6 6 18",
  alert: "M12 5v9M12 19v.01",
  trash: "M4 7h16M9 7V4h6v3M6.5 7l1 14h9l1-14M10 11v6M14 11v6",
  send: "M4 12 20 4l-5 16-3-7-8-1Z",
  play: "M7 4.5v15l12-7.5-12-7.5Z",
  pause: "M8 5v14M16 5v14",
  swap: "M8 4 3 9l5 5M3 9h15M16 10l5 5-5 5M21 15H6",
  chevron: "M6 9l6 6 6-6",
  reset: "M4 4v6h6M4.5 10A8 8 0 1 1 4 14",
  star: "M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z",
  satellite: "M13 7 9 3 5 7l4 4M17 11l4 4-4 4-4-4M8 12l4 4 4-4-4-4-4 4ZM19 5l-3 3M3 21c0-3 1-5 3-6",
  scale: "M12 3v18M7 21h10M5 7h14M5 7l-3 7a3.5 3.5 0 0 0 6 0L5 7ZM19 7l-3 7a3.5 3.5 0 0 0 6 0l-3-7Z",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  return (
    <svg className="ui-icon" width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
