import { type ReactNode } from "react";
import { glyphs, GLYPH_BOX, type GlyphName, type Prim } from "../../../icons/geometry";

/**
 * Web renderer for the MicroHealth glyph set.
 *
 * The geometry lives in `src/icons/geometry.ts` so the React Native build can
 * paint the same shapes — this file only turns that data into SVG elements.
 * Nothing is authored here; to change how a glyph looks, change the geometry.
 */

export interface GlyphProps {
  size?: number;
  className?: string;
  /** Overrides the outline register's default 1.9 stroke. */
  strokeWidth?: number;
}

/** Map a paint token onto what SVG wants. */
const paint = (v: "current" | "cut" | "none" | undefined) =>
  v === undefined ? undefined : v === "current" ? "currentColor" : v === "cut" ? "#FFFFFF" : "none";

function renderPrim(prim: Prim, key: number): ReactNode {
  if (prim.t === "g") {
    return (
      <g key={key} transform={prim.transform}>
        {prim.kids.map(renderPrim)}
      </g>
    );
  }
  const common = {
    fill: paint(prim.fill),
    stroke: paint(prim.stroke),
    strokeWidth: prim.sw,
    strokeOpacity: prim.so,
    fillOpacity: prim.fo,
    strokeLinecap: prim.cap,
  };

  switch (prim.t) {
    case "p":
      return <path key={key} d={prim.d} {...common} />;
    case "c":
      return <circle key={key} cx={prim.cx} cy={prim.cy} r={prim.r} {...common} />;
    case "e":
      return <ellipse key={key} cx={prim.cx} cy={prim.cy} rx={prim.rx} ry={prim.ry} {...common} />;
    case "r":
      return <rect key={key} x={prim.x} y={prim.y} width={prim.w} height={prim.h} rx={prim.rx} {...common} />;
  }
}

function Glyph({ name, size = 20, className, strokeWidth }: GlyphProps & { name: GlyphName }) {
  const glyph = glyphs[name];
  const solid = glyph.reg === "solid";
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${GLYPH_BOX} ${GLYPH_BOX}`}
      fill={solid ? "currentColor" : "none"}
      stroke={solid ? "none" : "currentColor"}
      strokeWidth={solid ? undefined : strokeWidth ?? glyph.sw ?? 1.9}
      /* Round caps and joins belong to the outline register. A solid glyph
         paints solid shapes; its only strokes are the pale inset lines, which
         ask for a round cap individually. */
      strokeLinecap={solid ? undefined : "round"}
      strokeLinejoin={solid ? undefined : "round"}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {glyph.prims.map(renderPrim)}
    </svg>
  );
}

/** One component per glyph, so call sites keep reading like `HeartIcon`. */
const bind = (name: GlyphName) =>
  function BoundGlyph(props: GlyphProps) {
    return <Glyph name={name} {...props} />;
  };

/**
 * A glyph by name, for call sites that get the name from data rather than
 * from the source — the metric registry holds a `GlyphName` per metric, and a
 * screen rendering the registry cannot know at build time which ones it will
 * be handed.
 *
 * Prefer the bound exports (`HeartIcon`) wherever the glyph is known. This
 * exists so a data-driven list does not need a 40-entry lookup table.
 */
export function GlyphIcon({ name, ...props }: GlyphProps & { name: GlyphName }) {
  return <Glyph name={name} {...props} />;
}

export const HeartIcon = bind("heart");
export const DropletIcon = bind("droplet");
export const OxygenIcon = bind("oxygen");
export const ThermometerIcon = bind("thermometer");
export const CapsuleIcon = bind("capsule");
export const CalendarIcon = bind("calendar");
export const FlaskIcon = bind("flask");
export const PersonFilledIcon = bind("personFilled");
export const HomeFilledIcon = bind("homeFilled");
export const HomeOutlineIcon = bind("homeOutline");
export const PulseIcon = bind("pulse");
export const HeartOutlineIcon = bind("heartOutline");
export const PersonIcon = bind("person");
export const WatchIcon = bind("watch");
export const BellIcon = bind("bell");
export const ChatIcon = bind("chat");
export const ShieldIcon = bind("shield");
export const SecurityIcon = bind("security");
export const EmergencyIcon = bind("emergency");
export const HelpIcon = bind("help");
export const InfoIcon = bind("info");
export const LogOutIcon = bind("logOut");
export const SparkIcon = bind("spark");
export const TrendIcon = bind("trend");
export const ChevronRightIcon = bind("chevronRight");
export const ChevronLeftIcon = bind("chevronLeft");
export const ChevronDownIcon = bind("chevronDown");
export const MoreIcon = bind("more");
export const ArrowUpIcon = bind("arrowUp");
export const ArrowDownIcon = bind("arrowDown");
export const MinusIcon = bind("minus");
export const SendIcon = bind("send");
export const SpeakerIcon = bind("speaker");
export const CheckIcon = bind("check");
export const CheckAllIcon = bind("checkAll");
export const AlertIcon = bind("alert");
export const BatteryIcon = bind("battery");
export const CheckCircleIcon = bind("checkCircle");
export const InsightMarkIcon = bind("insightMark");

/* ---- Metric glyphs ---- */
export const LungsIcon = bind("lungs");
export const EcgIcon = bind("ecg");
export const MoonIcon = bind("moon");
export const BatteryLowIcon = bind("batteryLow");
export const SweatIcon = bind("sweat");
export const RunIcon = bind("run");
export const FlameIcon = bind("flame");
export const FootstepsIcon = bind("footsteps");
export const RouteIcon = bind("route");
export const GaugeIcon = bind("gauge");
export const SmileIcon = bind("smile");
export const HrvIcon = bind("hrv");
export const BodyCompositionIcon = bind("bodyComposition");
export const GlucoseIcon = bind("glucose");
