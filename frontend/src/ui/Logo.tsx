/** The Earthsift mark: the Earth at dusk, its lower half cut into bands, circled by a satellite's orbit. */
import { useId } from "react";

export function Logo({ size = 30 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd166" /><stop offset="0.45" stopColor="#ff7a45" /><stop offset="0.72" stopColor="#f0328f" /><stop offset="1" stopColor="#7a35e0" />
        </linearGradient>
        <mask id={`${id}m`}>
          <rect width="32" height="32" fill="#fff" />
          <path d="M0 17.6h32v1.1H0ZM0 20.8h32v1.4H0ZM0 24.1h32v1.8H0Z" fill="#000" />
        </mask>
      </defs>
      <circle cx="16" cy="16" r="12" fill={`url(#${id}d)`} stroke="none" mask={`url(#${id}m)`} />
      <path d="M2.4 21.4C7 25 24.5 17.6 29.4 10.6" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="29.2" cy="10.8" r="2.1" fill="#fff" stroke="none" />
    </svg>
  );
}
