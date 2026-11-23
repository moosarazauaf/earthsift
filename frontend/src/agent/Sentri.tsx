/**
 * Sentri, the Earthsift assistant: a small satellite with a visor, solar wings,
 * a radar dish and an antenna light, in the same dusk colours as the logo and
 * the map markers. Moods change the eyes and the animation; all motion is CSS
 * (styles.css, "Sentri") and stops for visitors who ask for reduced motion.
 */
import { useId } from "react";

export type Mood = "idle" | "thinking" | "happy" | "warn";

const EYES: Record<"open" | "happy" | "up", string> = {
  open: "M6.1 5.5h1.2M8.7 5.5h1.2",
  happy: "M5.9 5.8c.3-.7 1.2-.7 1.5 0M8.6 5.8c.3-.7 1.2-.7 1.5 0",
  up: "M6.1 4.8h1.2M8.7 4.8h1.2",
};

function Wing({ x, fill }: { x: number; fill: string }) {
  return (
    <g>
      <rect x={x} y={3.4} width={4.2} height={5.6} rx={0.5} fill={fill} />
      <path d={`M${x} 5.27h4.2M${x} 7.13h4.2M${x + 2.1} 3.4v5.6`} stroke="#1a0d24" strokeWidth={0.28} fill="none" />
    </g>
  );
}

export function Sentri({ mood = "idle", size = 48, title }: { mood?: Mood; size?: number; title?: string }) {
  const id = useId();
  const dusk = `url(#${id}d)`;
  const eyes = mood === "happy" ? EYES.happy : mood === "thinking" ? EYES.up : EYES.open;
  return (
    <svg className={`sentri sentri-${mood}`} width={size} height={size} viewBox="-2 -4 20 20"
      role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd166" /><stop offset="0.45" stopColor="#ff7a45" /><stop offset="0.75" stopColor="#f0328f" /><stop offset="1" stopColor="#7a35e0" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b2350" /><stop offset="1" stopColor="#140a1e" />
        </linearGradient>
      </defs>
      <g className="sentri-body">
        <g className="sentri-panel left"><Wing x={-1.6} fill={dusk} /></g>
        <g className="sentri-panel right"><Wing x={13.4} fill={dusk} /></g>
        <path d="M2.6 6.2h1.4M12 6.2h1.4M8 1.2v-2.4M8 10.8v1.2" stroke="#c9c3d4" strokeWidth={0.55} strokeLinecap="round" />
        <path d="M4.8 12.2h6.4c-.4 1.7-1.7 2.5-3.2 2.5s-2.8-.8-3.2-2.5Z" fill="#c9c3d4" />
        <rect x={3.9} y={1.2} width={8.2} height={9.7} rx={2.7} fill={`url(#${id}b)`} stroke={dusk} strokeWidth={0.7} />
        <rect x={5} y={3.5} width={6} height={3.8} rx={1.9} fill="#07040c" stroke="#ff7a45" strokeWidth={0.3} />
        <path className="sentri-face" d={eyes} stroke="#ffe29a" strokeWidth={0.85} strokeLinecap="round" fill="none" />
        {mood === "idle" && <rect className="sentri-blink" x={5.5} y={4.5} width={5} height={2} fill="#07040c" />}
        <path d="M6.7 8.9h2.6" stroke={dusk} strokeWidth={0.5} strokeLinecap="round" />
        <circle className="sentri-light" cx={8} cy={-2} r={0.85} fill="#ffd27a" />
      </g>
      {mood === "thinking" && (
        <g className="sentri-waves" fill="#ff7a45">
          <rect x={6} y={14.9} width={4} height={0.35} />
          <rect x={4.5} y={15.4} width={7} height={0.3} />
          <rect x={3} y={15.8} width={10} height={0.3} />
        </g>
      )}
      {mood === "warn" && (
        <g className="sentri-alert" fill="#ffc24d">
          <rect x={14} y={-4} width={1.6} height={3} rx={0.4} />
          <circle cx={14.8} cy={0.4} r={0.8} />
        </g>
      )}
    </svg>
  );
}
