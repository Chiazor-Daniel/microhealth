/**
 * React Native renderer for the MicroHealth glyph set.
 *
 * The geometry lives in `src/icons/geometry.ts` — the same file the web
 * renderer paints — so a glyph cannot look different on the two platforms.
 * Nothing is authored here; to change how a glyph looks, change the geometry.
 *
 * The web build tints glyphs with `currentColor` inherited from CSS. React
 * Native has no such thing, so every glyph takes an explicit `color`.
 */

import { memo, type ReactNode } from "react";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { glyphs, GLYPH_BOX, type GlyphName, type Prim } from "@glyphs";
import { semantic } from "@tokens";

export interface GlyphProps {
  size?: number;
  /** Defaults to the primary ink — the same colour web inherits from text. */
  color?: string;
  /** Overrides the outline register's default 1.9 stroke. */
  strokeWidth?: number;
}

/** The pale inset line drawn through a solid glyph. Matches the web hex. */
const CUT = "#FFFFFF";

/** Map a paint token onto what react-native-svg wants. */
function paint(v: "current" | "cut" | "none" | undefined, color: string) {
  if (v === undefined) return undefined;
  return v === "current" ? color : v === "cut" ? CUT : "none";
}

function renderPrim(prim: Prim, color: string, key: number): ReactNode {
  if (prim.t === "g") {
    return (
      <G key={key} transform={prim.transform}>
        {prim.kids.map((kid, i) => renderPrim(kid, color, i))}
      </G>
    );
  }

  const common = {
    fill: paint(prim.fill, color),
    stroke: paint(prim.stroke, color),
    strokeWidth: prim.sw,
    strokeOpacity: prim.so,
    fillOpacity: prim.fo,
    strokeLinecap: prim.cap,
  };

  switch (prim.t) {
    case "p":
      return <Path key={key} d={prim.d} {...common} />;
    case "c":
      return <Circle key={key} cx={prim.cx} cy={prim.cy} r={prim.r} {...common} />;
    case "e":
      return <Ellipse key={key} cx={prim.cx} cy={prim.cy} rx={prim.rx} ry={prim.ry} {...common} />;
    case "r":
      return <Rect key={key} x={prim.x} y={prim.y} width={prim.w} height={prim.h} rx={prim.rx} {...common} />;
  }
}

function Glyph({ name, size = 20, color = semantic.textPrimary, strokeWidth }: GlyphProps & { name: GlyphName }) {
  const glyph = glyphs[name];
  const solid = glyph.reg === "solid";

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${GLYPH_BOX} ${GLYPH_BOX}`}
      fill={solid ? color : "none"}
      stroke={solid ? "none" : color}
      strokeWidth={solid ? undefined : strokeWidth ?? glyph.sw ?? 1.9}
      /* Round caps and joins belong to the outline register. A solid glyph
         paints solid shapes; its only strokes are the pale inset lines, which
         ask for a round cap individually. */
      strokeLinecap={solid ? undefined : "round"}
      strokeLinejoin={solid ? undefined : "round"}
    >
      {glyph.prims.map((prim, i) => renderPrim(prim, color, i))}
    </Svg>
  );
}

/** Memoised so a list of rows doesn't re-render 20 paths per frame. */
const MemoGlyph = memo(Glyph);

/** One component per glyph, so call sites keep reading like `HeartIcon`. */
const bind = (name: GlyphName) =>
  function BoundGlyph({ size, color, strokeWidth }: GlyphProps) {
    return <MemoGlyph name={name} size={size} color={color} strokeWidth={strokeWidth} />;
  };

/**
 * A glyph by name, for call sites that get the name from data rather than
 * from the source — the metric registry holds a `GlyphName` per metric, and a
 * screen rendering the registry cannot know at build time which ones it will
 * be handed.
 *
 * Prefer the bound exports (`HeartIcon`) wherever the glyph is known.
 */
export function GlyphIcon({ name, size, color, strokeWidth }: GlyphProps & { name: GlyphName }) {
  return <MemoGlyph name={name} size={size} color={color} strokeWidth={strokeWidth} />;
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

export { GLYPH_BOX, glyphs };
export type { GlyphName };
