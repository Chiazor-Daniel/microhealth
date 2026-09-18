/**
 * The Health Agent's presence.
 *
 * A soft orb with a face, sitting in a pale mint aura — the agent reads as
 * someone rather than as a labelled feature. Native vector, self-contained
 * (one local gradient, no external references), so it lifts into the native
 * build unchanged.
 */
export function AgentOrb({
  size = 92,
  active = false,
  className,
}: {
  size?: number;
  /** Slight lift while the agent is thinking. */
  active?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ transition: "transform 0.3s ease", transform: active ? "scale(1.04)" : "scale(1)" }}
    >
      <defs>
        <radialGradient id="mhOrbAura" cx="50%" cy="50%" r="50%">
          <stop offset="42%" stopColor="#85C0CE" stopOpacity="0.55" />
          <stop offset="72%" stopColor="#85C0CE" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#85C0CE" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mhOrbBody" x1="30%" y1="10%" x2="72%" y2="96%">
          <stop offset="0%" stopColor="#4C9FB3" />
          <stop offset="45%" stopColor="#005F73" />
          <stop offset="100%" stopColor="#08546C" />
        </linearGradient>
      </defs>

      {/* Aura — seats the orb on the surface instead of pasting it on */}
      <circle cx="48" cy="48" r="47" fill="url(#mhOrbAura)" />

      {/* Body */}
      <circle cx="48" cy="48" r="34" fill="url(#mhOrbBody)" />
      {/* Lit top edge */}
      <ellipse cx="39" cy="31" rx="15" ry="9" fill="#FFFFFF" fillOpacity="0.20" />

      {/* Face */}
      <circle cx="39.5" cy="45" r="3.1" fill="#032B35" fillOpacity="0.55" />
      <circle cx="56.5" cy="45" r="3.1" fill="#032B35" fillOpacity="0.55" />
      <path
        d="M39.5 56.5c2.4 3.4 5.4 5 8.5 5s6.1-1.6 8.5-5"
        stroke="#032B35"
        strokeOpacity="0.55"
        strokeWidth="3.1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
