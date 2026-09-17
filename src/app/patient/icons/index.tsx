import { type ReactNode } from "react";

/**
 * MicroHealth glyph set — native vector.
 *
 * The design system uses **two registers**, and keeping them apart is what
 * makes a screen read as one system rather than a pile of borrowed marks:
 *
 *   FILLED  — the thing being measured. A metric glyph is solid colour inside
 *             a pale tinted tile (a solid red droplet, a solid rose heart, a
 *             two-tone capsule). It should carry weight at 20px.
 *   OUTLINE — navigation and rows. A 1.9 stroke on `currentColor`, no fill.
 *             These are signposts, not measurements, so they stay quiet.
 *
 * Shared contract either way: a 24×24 canvas, artwork inside a 2px optical
 * margin, round caps and joins, and one colour in / one colour out via
 * `currentColor`. Geometry only — no gradients, ids or external references,
 * so every glyph lifts into the native build unchanged.
 */

const VB = 24;
const SW = 1.9;

export interface GlyphProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

/** Outline register — stroked, unfilled. */
function Glyph({ size = 20, className, strokeWidth = SW, children }: GlyphProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VB} ${VB}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

/** Filled register — solid shapes; any stroke is drawn per-element. */
function Solid({ size = 20, className, children }: GlyphProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VB} ${VB}`}
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

/** The pale cut the mockup uses inside a solid glyph (thermometer stem, calendar grid). */
const CUT = "#FFFFFF";

/* ------------------------------------------------------------------ */
/* FILLED — metrics and categories                                     */
/* ------------------------------------------------------------------ */

export function HeartIcon(p: GlyphProps) {
  return (
    <Solid {...p}>
      <path d="M12 20.7C10.7 19.8 3.3 14.9 3.3 9.6a4.85 4.85 0 0 1 8.7-3 4.85 4.85 0 0 1 8.7 3c0 5.3-7.4 10.2-8.7 11.1Z" />
    </Solid>
  );
}

export function DropletIcon(p: GlyphProps) {
  return (
    <Solid {...p}>
      <path d="M12 3.1c2.1 2.4 6.4 7.7 6.4 11.4a6.4 6.4 0 0 1-12.8 0C5.6 10.8 9.9 5.5 12 3.1Z" />
      {/* Light catching the shoulder of the drop */}
      <path d="M9.6 13.4a2.6 2.6 0 0 0 2.6 2.8" stroke={CUT} strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </Solid>
  );
}

/** Blood oxygen — the magnifier the design system uses, with a solid centre. */
export function OxygenIcon(p: GlyphProps) {
  return (
    <svg width={p.size ?? 20} height={p.size ?? 20} viewBox={`0 0 ${VB} ${VB}`} fill="none" aria-hidden="true" focusable="false" className={p.className}>
      <circle cx="10.4" cy="10.4" r="6.1" stroke="currentColor" strokeWidth="2.3" />
      <circle cx="10.4" cy="10.4" r="2.6" fill="currentColor" />
      <path d="m15 15 5.2 5.2" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function ThermometerIcon(p: GlyphProps) {
  return (
    <Solid {...p}>
      <path d="M14.5 13.9V6.5a2.5 2.5 0 0 0-5 0v7.4a4.35 4.35 0 1 0 5 0Z" />
      <path d="M12 10.5v6.6" stroke={CUT} strokeOpacity="0.7" strokeWidth="1.7" strokeLinecap="round" fill="none" />
    </Solid>
  );
}

/**
 * Prescription — a capsule on the diagonal, one half solid and one hollow.
 * The two-tone is what the design system draws; it reads as a capsule rather
 * than as a rounded rectangle with a line through it.
 */
export function CapsuleIcon(p: GlyphProps) {
  return (
    <svg width={p.size ?? 20} height={p.size ?? 20} viewBox={`0 0 ${VB} ${VB}`} fill="none" aria-hidden="true" focusable="false" className={p.className}>
      <g transform="rotate(-45 12 12)">
        <path d="M15.6 8.4a3.6 3.6 0 0 1 0 7.2H12V8.4Z" fill="currentColor" />
        <rect x="2.6" y="8.4" width="18.8" height="7.2" rx="3.6" stroke="currentColor" strokeWidth="1.8" />
      </g>
    </svg>
  );
}

/** Lab / appointment — a solid calendar with its grid cut out. */
export function CalendarIcon(p: GlyphProps) {
  return (
    <Solid {...p}>
      <path d="M6.4 3.2a1 1 0 0 1 1 1v1.6h9.2V4.2a1 1 0 1 1 2 0v1.6h.9a2.9 2.9 0 0 1 2.9 2.9v9.4a2.9 2.9 0 0 1-2.9 2.9H5.5a2.9 2.9 0 0 1-2.9-2.9V8.7a2.9 2.9 0 0 1 2.9-2.9h.9V4.2a1 1 0 0 1 1-1Z" />
      <path d="M2.9 10.6h18.2" stroke={CUT} strokeOpacity="0.75" strokeWidth="1.7" fill="none" />
    </Solid>
  );
}

/** The lab flask the results feed uses. */
export function FlaskIcon(p: GlyphProps) {
  return (
    <Solid {...p}>
      <path d="M9.6 3.4a1 1 0 0 1 1-1h2.8a1 1 0 1 1 0 2h-.3v4.1l4.6 8a2.9 2.9 0 0 1-2.5 4.4H8.8a2.9 2.9 0 0 1-2.5-4.4l4.6-8V4.4h-.3a1 1 0 0 1-1-1Z" />
    </Solid>
  );
}

/** A person, solid — notification rows and the Profile nav destination. */
export function PersonFilledIcon(p: GlyphProps) {
  return (
    <Solid {...p}>
      <circle cx="12" cy="7.7" r="4.1" />
      <path d="M4.2 20.6a7.8 7.8 0 0 1 15.6 0Z" />
    </Solid>
  );
}

/* ------------------------------------------------------------------ */
/* OUTLINE — navigation, rows, controls                                */
/* ------------------------------------------------------------------ */

/** Home, solid — the one destination that reads filled when selected. */
export function HomeFilledIcon(p: GlyphProps) {
  return (
    <Solid {...p}>
      <path d="M11.1 3.5a1.45 1.45 0 0 1 1.8 0l7.5 6.2c.32.27.5.66.5 1.07v8.03a2 2 0 0 1-2 2H5.1a2 2 0 0 1-2-2v-8.03c0-.41.18-.8.5-1.07Z" />
    </Solid>
  );
}

export function HomeOutlineIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M11.1 3.5a1.45 1.45 0 0 1 1.8 0l7.5 6.2c.32.27.5.66.5 1.07v8.03a2 2 0 0 1-2 2H5.1a2 2 0 0 1-2-2v-8.03c0-.41.18-.8.5-1.07Z" />
    </Glyph>
  );
}

/** Vitals — a pulse trace. */
export function PulseIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M2.8 12h3.4l1.7-4.8 2.9 9.6 2.3-6.4 1.5 3.4h6.6" />
    </Glyph>
  );
}

export function HeartOutlineIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M12 20.3C10.8 19.5 3.7 14.8 3.7 9.7a4.6 4.6 0 0 1 8.3-2.8 4.6 4.6 0 0 1 8.3 2.8c0 5.1-7.1 9.8-8.3 10.6Z" />
    </Glyph>
  );
}

export function PersonIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <circle cx="12" cy="8.2" r="4.1" />
      <path d="M4.6 20.4a7.4 7.4 0 0 1 14.8 0" />
    </Glyph>
  );
}

export function WatchIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <rect x="6.4" y="6.6" width="11.2" height="10.8" rx="3.4" />
      <path d="M9.4 3.4h5.2v3.2H9.4zM9.4 17.4h5.2v3.2H9.4z" />
    </Glyph>
  );
}

export function BellIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M18.4 15.6V11a6.4 6.4 0 1 0-12.8 0v4.6L4 18.2h16z" />
      <path d="M10 20.8a2.2 2.2 0 0 0 4 0" />
    </Glyph>
  );
}

export function ChatIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M20.4 11.8c0 4.2-3.8 7.6-8.4 7.6a9.6 9.6 0 0 1-2.7-.4L4.4 20.6l1.2-3.6a7.2 7.2 0 0 1-2-4.9C3.6 7.6 7.4 4.2 12 4.2s8.4 3.4 8.4 7.6Z" />
    </Glyph>
  );
}

export function ShieldIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M12 3.4 5.2 6v5.5c0 4.3 2.9 7.7 6.8 9.1 3.9-1.4 6.8-4.8 6.8-9.1V6L12 3.4Z" />
    </Glyph>
  );
}

/** Security & Privacy — a shield holding a keyhole. */
export function SecurityIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M12 3.4 5.2 6v5.5c0 4.3 2.9 7.7 6.8 9.1 3.9-1.4 6.8-4.8 6.8-9.1V6L12 3.4Z" />
      <circle cx="12" cy="10.6" r="1.9" />
      <path d="M12 12.4v2.5" />
    </Glyph>
  );
}

/** Emergency — a cross in a ring. */
export function EmergencyIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 8.2v7.6M8.2 12h7.6" />
    </Glyph>
  );
}

/** Help & Support — a question mark in a ring. */
export function HelpIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.5v.4" />
      <path d="M12 17.1v.1" />
    </Glyph>
  );
}

export function InfoIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11.2v5M12 7.9v.1" />
    </Glyph>
  );
}

export function LogOutIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M14.4 3.6H7.2a2.6 2.6 0 0 0-2.6 2.6v11.6a2.6 2.6 0 0 0 2.6 2.6h7.2" />
      <path d="M16.4 8.4 20.4 12l-4 3.6M20.4 12H9.6" />
    </Glyph>
  );
}

/** Insights — a four-point star with a smaller companion. */
export function SparkIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M11.4 3.4c.8 4.1 2.2 5.5 6.3 6.3-4.1.8-5.5 2.2-6.3 6.3-.8-4.1-2.2-5.5-6.3-6.3 4.1-.8 5.5-2.2 6.3-6.3Z" />
      <path d="M17.8 14.6c.4 1.9 1 2.5 2.9 2.9-1.9.4-2.5 1-2.9 2.9-.4-1.9-1-2.5-2.9-2.9 1.9-.4 2.5-1 2.9-2.9Z" />
    </Glyph>
  );
}

export function TrendIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M3.6 16.4 9 11l3.6 3.6L20.4 6.8" />
      <path d="M15.4 6.8h5v5" />
    </Glyph>
  );
}

export function ChevronRightIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="m9.6 5.6 6.4 6.4-6.4 6.4" />
    </Glyph>
  );
}

export function ChevronLeftIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M14.4 5.6 8 12l6.4 6.4" />
    </Glyph>
  );
}

/** The kebab used in sub-page headers. */
export function MoreIcon(p: GlyphProps) {
  return (
    <Solid {...p}>
      <circle cx="12" cy="5.2" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="18.8" r="1.7" />
    </Solid>
  );
}

export function ArrowUpIcon(p: GlyphProps) {
  return (
    <Glyph {...p} strokeWidth={2.6}>
      <path d="M12 19.4V5.4M5.8 11.6 12 5.4l6.2 6.2" />
    </Glyph>
  );
}

export function ArrowDownIcon(p: GlyphProps) {
  return (
    <Glyph {...p} strokeWidth={2.6}>
      <path d="M12 4.6v14M18.2 12.4 12 18.6l-6.2-6.2" />
    </Glyph>
  );
}

export function MinusIcon(p: GlyphProps) {
  return (
    <Glyph {...p} strokeWidth={2.6}>
      <path d="M5.4 12h13.2" />
    </Glyph>
  );
}

/** Send — the composer's submit control. */
export function SendIcon(p: GlyphProps) {
  return (
    <Solid {...p}>
      <path d="M20.4 3.9a1 1 0 0 1 1.3 1.3l-6.2 15.3a1 1 0 0 1-1.85.06l-2.6-5.7-5.7-2.6a1 1 0 0 1 .06-1.85Z" />
    </Solid>
  );
}

/** Speaker — the agent's "read this aloud" affordance. */
export function SpeakerIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M11.4 4.6 6.9 8.4H4.2a1.4 1.4 0 0 0-1.4 1.4v4.4a1.4 1.4 0 0 0 1.4 1.4h2.7l4.5 3.8a.9.9 0 0 0 1.5-.7V5.3a.9.9 0 0 0-1.5-.7Z" />
      <path d="M16.2 9.2a4 4 0 0 1 0 5.6" />
    </Glyph>
  );
}

export function CheckIcon(p: GlyphProps) {
  return (
    <Glyph {...p} strokeWidth={2.4}>
      <path d="m5.4 12.4 4.2 4.2 9-9.2" />
    </Glyph>
  );
}

/** Mark-all-read — a double tick. */
export function CheckAllIcon(p: GlyphProps) {
  return (
    <Glyph {...p} strokeWidth={2.2}>
      <path d="m2.6 12.6 3.6 3.6 6.8-7" />
      <path d="m11 15.4 1.4 1.4 8.6-8.8" />
    </Glyph>
  );
}

export function AlertIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M10.3 3.9a2 2 0 0 1 3.4 0l7.1 12.3a2 2 0 0 1-1.7 3H4.9a2 2 0 0 1-1.7-3Z" />
      <path d="M12 9.4v4M12 16.4v.1" />
    </Glyph>
  );
}

export function BatteryIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <rect x="2.4" y="7.4" width="16.2" height="9.2" rx="2.6" />
      <path d="M21.4 10.6v2.8" />
    </Glyph>
  );
}

/** Filled disc with a tick — the bullet the agent's advice list uses. */
export function CheckCircleIcon(p: GlyphProps) {
  return (
    <svg width={p.size ?? 20} height={p.size ?? 20} viewBox={`0 0 ${VB} ${VB}`} fill="none" aria-hidden="true" focusable="false" className={p.className}>
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <path d="m8.2 12.3 2.6 2.6 5-5.4" stroke={CUT} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Insights — the mark the AI Insights card leads with                 */
/* ------------------------------------------------------------------ */

/**
 * The AI Insights featured mark: a dark rounded square holding a plotted
 * point. Deliberately not a tinted tile like the metric glyphs — it sits
 * above them in the hierarchy.
 */
export function InsightMarkIcon(p: GlyphProps) {
  const s = p.size ?? 20;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${VB} ${VB}`} fill="none" aria-hidden="true" focusable="false" className={p.className}>
      <rect x="1.6" y="1.6" width="20.8" height="20.8" rx="7" fill="currentColor" />
      <path d="M4.6 15.4c2-3.2 3.7-4.8 5.4-4.8 2.4 0 2.6 3.4 4.8 3.4 1.4 0 2.6-1 4.6-3" stroke={CUT} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="10" cy="10.6" r="2" fill={CUT} />
    </svg>
  );
}
