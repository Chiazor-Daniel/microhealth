/**
 * MicroHealth glyph geometry.
 *
 * Pure data: no DOM, no framework, no JSX. This is the single source the web
 * renderer (`src/app/patient/icons`) and the React Native renderer
 * (`mobile/src/icons`) both paint, so a glyph can never look different on the
 * two platforms.
 *
 * How to read a glyph:
 *   register "solid"   — the thing being measured. Root fill is `current`,
 *                        root stroke is `none`.
 *   register "outline" — navigation and rows. Root fill is `none`, root
 *                        stroke is `current` at `sw` (1.9 unless overridden).
 *
 * A primitive may override either, which is how the two-tone marks work: a
 * solid shape with a pale `cut` line drawn through it. `round` caps and joins
 * are applied at the root for both registers.
 */

/** `current` = inherit the tint, `cut` = the pale inset, `none` = don't paint. */
export type Paint = "current" | "cut" | "none";

interface Paintable {
  fill?: Paint;
  stroke?: Paint;
  /** Stroke width, in the 24×24 coordinate system. */
  sw?: number;
  /** Stroke opacity, 0–1. */
  so?: number;
  /** Fill opacity, 0–1. */
  fo?: number;
  /** Round cap on this primitive. Only the pale inset strokes set it. */
  cap?: "round";
}

export interface PathPrim extends Paintable {
  t: "p";
  d: string;
}

export interface CirclePrim extends Paintable {
  t: "c";
  cx: number;
  cy: number;
  r: number;
}

export interface RectPrim extends Paintable {
  t: "r";
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
}

export interface EllipsePrim extends Paintable {
  t: "e";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface GroupPrim {
  t: "g";
  /** SVG transform string, e.g. `rotate(-45 12 12)`. */
  transform: string;
  kids: Prim[];
}

export type Prim = PathPrim | CirclePrim | RectPrim | EllipsePrim | GroupPrim;

export interface Glyph {
  reg: "solid" | "outline";
  /** Root stroke width for the outline register. */
  sw?: number;
  prims: Prim[];
}

/* Transcribing helpers — they only exist to keep the table below readable. */
const p = (d: string, extra: Paintable = {}): PathPrim => ({ t: "p", d, ...extra });
const c = (cx: number, cy: number, r: number, extra: Paintable = {}): CirclePrim => ({ t: "c", cx, cy, r, ...extra });
const r = (x: number, y: number, w: number, h: number, extra: Paintable & { rx?: number } = {}): RectPrim => ({ t: "r", x, y, w, h, ...extra });
const e = (cx: number, cy: number, rx: number, ry: number, extra: Paintable = {}): EllipsePrim => ({ t: "e", cx, cy, rx, ry, ...extra });
const g = (transform: string, kids: Prim[]): GroupPrim => ({ t: "g", transform, kids });

/** Everything is drawn inside a 24×24 box with a 2px optical margin. */
export const GLYPH_BOX = 24;

export const glyphs = {
  /* ---- Solid: metrics and categories ---- */

  heart: {
    reg: "solid",
    prims: [p("M12 20.7C10.7 19.8 3.3 14.9 3.3 9.6a4.85 4.85 0 0 1 8.7-3 4.85 4.85 0 0 1 8.7 3c0 5.3-7.4 10.2-8.7 11.1Z")],
  },

  droplet: {
    reg: "solid",
    prims: [
      p("M12 3.1c2.1 2.4 6.4 7.7 6.4 11.4a6.4 6.4 0 0 1-12.8 0C5.6 10.8 9.9 5.5 12 3.1Z"),
      /* Light catching the shoulder of the drop */
      p("M9.6 13.4a2.6 2.6 0 0 0 2.6 2.8", { fill: "none", stroke: "cut", so: 0.55, sw: 1.5, cap: "round" }),
    ],
  },

  /* Blood oxygen — the magnifier the design system uses, with a solid centre. */
  oxygen: {
    reg: "outline",
    prims: [
      c(10.4, 10.4, 6.1, { sw: 2.3 }),
      c(10.4, 10.4, 2.6, { fill: "current", stroke: "none" }),
      p("m15 15 5.2 5.2", { sw: 2.6 }),
    ],
  },

  thermometer: {
    reg: "solid",
    prims: [
      p("M14.5 13.9V6.5a2.5 2.5 0 0 0-5 0v7.4a4.35 4.35 0 1 0 5 0Z"),
      p("M12 10.5v6.6", { fill: "none", stroke: "cut", so: 0.7, sw: 1.7, cap: "round" }),
    ],
  },

  /* Prescription — a capsule on the diagonal, one half solid and one hollow. */
  capsule: {
    reg: "outline",
    prims: [
      g("rotate(-45 12 12)", [
        p("M15.6 8.4a3.6 3.6 0 0 1 0 7.2H12V8.4Z", { fill: "current", stroke: "none" }),
        r(2.6, 8.4, 18.8, 7.2, { rx: 3.6, sw: 1.8 }),
      ]),
    ],
  },

  /* Lab / appointment — a solid calendar with its grid cut out. */
  calendar: {
    reg: "solid",
    prims: [
      p("M6.4 3.2a1 1 0 0 1 1 1v1.6h9.2V4.2a1 1 0 1 1 2 0v1.6h.9a2.9 2.9 0 0 1 2.9 2.9v9.4a2.9 2.9 0 0 1-2.9 2.9H5.5a2.9 2.9 0 0 1-2.9-2.9V8.7a2.9 2.9 0 0 1 2.9-2.9h.9V4.2a1 1 0 0 1 1-1Z"),
      p("M2.9 10.6h18.2", { fill: "none", stroke: "cut", so: 0.75, sw: 1.7 }),
    ],
  },

  flask: {
    reg: "solid",
    prims: [
      p("M9.6 3.4a1 1 0 0 1 1-1h2.8a1 1 0 1 1 0 2h-.3v4.1l4.6 8a2.9 2.9 0 0 1-2.5 4.4H8.8a2.9 2.9 0 0 1-2.5-4.4l4.6-8V4.4h-.3a1 1 0 0 1-1-1Z"),
    ],
  },

  personFilled: {
    reg: "solid",
    prims: [c(12, 7.7, 4.1), p("M4.2 20.6a7.8 7.8 0 0 1 15.6 0Z")],
  },

  /* ---- Solid: navigation ---- */

  homeFilled: {
    reg: "solid",
    prims: [p("M11.1 3.5a1.45 1.45 0 0 1 1.8 0l7.5 6.2c.32.27.5.66.5 1.07v8.03a2 2 0 0 1-2 2H5.1a2 2 0 0 1-2-2v-8.03c0-.41.18-.8.5-1.07Z")],
  },

  more: {
    reg: "solid",
    prims: [c(12, 5.2, 1.7), c(12, 12, 1.7), c(12, 18.8, 1.7)],
  },

  send: {
    reg: "solid",
    prims: [p("M20.4 3.9a1 1 0 0 1 1.3 1.3l-6.2 15.3a1 1 0 0 1-1.85.06l-2.6-5.7-5.7-2.6a1 1 0 0 1 .06-1.85Z")],
  },

  /* ---- Outline: navigation and rows ---- */

  homeOutline: {
    reg: "outline",
    prims: [p("M11.1 3.5a1.45 1.45 0 0 1 1.8 0l7.5 6.2c.32.27.5.66.5 1.07v8.03a2 2 0 0 1-2 2H5.1a2 2 0 0 1-2-2v-8.03c0-.41.18-.8.5-1.07Z")],
  },

  pulse: {
    reg: "outline",
    prims: [p("M2.8 12h3.4l1.7-4.8 2.9 9.6 2.3-6.4 1.5 3.4h6.6")],
  },

  heartOutline: {
    reg: "outline",
    prims: [p("M12 20.3C10.8 19.5 3.7 14.8 3.7 9.7a4.6 4.6 0 0 1 8.3-2.8 4.6 4.6 0 0 1 8.3 2.8c0 5.1-7.1 9.8-8.3 10.6Z")],
  },

  person: {
    reg: "outline",
    prims: [c(12, 8.2, 4.1), p("M4.6 20.4a7.4 7.4 0 0 1 14.8 0")],
  },

  watch: {
    reg: "outline",
    prims: [r(6.4, 6.6, 11.2, 10.8, { rx: 3.4 }), p("M9.4 3.4h5.2v3.2H9.4zM9.4 17.4h5.2v3.2H9.4z")],
  },

  bell: {
    reg: "outline",
    prims: [
      p("M18.4 15.6V11a6.4 6.4 0 1 0-12.8 0v4.6L4 18.2h16z"),
      p("M10 20.8a2.2 2.2 0 0 0 4 0"),
    ],
  },

  chat: {
    reg: "outline",
    prims: [p("M20.4 11.8c0 4.2-3.8 7.6-8.4 7.6a9.6 9.6 0 0 1-2.7-.4L4.4 20.6l1.2-3.6a7.2 7.2 0 0 1-2-4.9C3.6 7.6 7.4 4.2 12 4.2s8.4 3.4 8.4 7.6Z")],
  },

  shield: {
    reg: "outline",
    prims: [p("M12 3.4 5.2 6v5.5c0 4.3 2.9 7.7 6.8 9.1 3.9-1.4 6.8-4.8 6.8-9.1V6L12 3.4Z")],
  },

  /* Security & Privacy — a shield holding a keyhole. */
  security: {
    reg: "outline",
    prims: [
      p("M12 3.4 5.2 6v5.5c0 4.3 2.9 7.7 6.8 9.1 3.9-1.4 6.8-4.8 6.8-9.1V6L12 3.4Z"),
      c(12, 10.6, 1.9),
      p("M12 12.4v2.5"),
    ],
  },

  /* Emergency — a cross in a ring. */
  emergency: {
    reg: "outline",
    prims: [c(12, 12, 8.6), p("M12 8.2v7.6M8.2 12h7.6")],
  },

  /* Help & Support — a question mark in a ring. */
  help: {
    reg: "outline",
    prims: [
      c(12, 12, 8.6),
      p("M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.5v.4"),
      p("M12 17.1v.1"),
    ],
  },

  info: {
    reg: "outline",
    prims: [c(12, 12, 8.6), p("M12 11.2v5M12 7.9v.1")],
  },

  logOut: {
    reg: "outline",
    prims: [
      p("M14.4 3.6H7.2a2.6 2.6 0 0 0-2.6 2.6v11.6a2.6 2.6 0 0 0 2.6 2.6h7.2"),
      p("M16.4 8.4 20.4 12l-4 3.6M20.4 12H9.6"),
    ],
  },

  /* Insights — a four-point star with a smaller companion. */
  spark: {
    reg: "outline",
    prims: [
      p("M11.4 3.4c.8 4.1 2.2 5.5 6.3 6.3-4.1.8-5.5 2.2-6.3 6.3-.8-4.1-2.2-5.5-6.3-6.3 4.1-.8 5.5-2.2 6.3-6.3Z"),
      p("M17.8 14.6c.4 1.9 1 2.5 2.9 2.9-1.9.4-2.5 1-2.9 2.9-.4-1.9-1-2.5-2.9-2.9 1.9-.4 2.5-1 2.9-2.9Z"),
    ],
  },

  trend: {
    reg: "outline",
    prims: [p("M3.6 16.4 9 11l3.6 3.6L20.4 6.8"), p("M15.4 6.8h5v5")],
  },

  chevronRight: { reg: "outline", prims: [p("m9.6 5.6 6.4 6.4-6.4 6.4")] },
  chevronLeft: { reg: "outline", prims: [p("M14.4 5.6 8 12l6.4 6.4")] },
  chevronDown: { reg: "outline", prims: [p("m5.6 9.6 6.4 6.4 6.4-6.4")] },

  arrowUp: { reg: "outline", sw: 2.6, prims: [p("M12 19.4V5.4M5.8 11.6 12 5.4l6.2 6.2")] },
  arrowDown: { reg: "outline", sw: 2.6, prims: [p("M12 4.6v14M18.2 12.4 12 18.6l-6.2-6.2")] },
  minus: { reg: "outline", sw: 2.6, prims: [p("M5.4 12h13.2")] },

  /* Speaker — the agent's "read this aloud" affordance. */
  speaker: {
    reg: "outline",
    prims: [
      p("M11.4 4.6 6.9 8.4H4.2a1.4 1.4 0 0 0-1.4 1.4v4.4a1.4 1.4 0 0 0 1.4 1.4h2.7l4.5 3.8a.9.9 0 0 0 1.5-.7V5.3a.9.9 0 0 0-1.5-.7Z"),
      p("M16.2 9.2a4 4 0 0 1 0 5.6"),
    ],
  },

  check: { reg: "outline", sw: 2.4, prims: [p("m5.4 12.4 4.2 4.2 9-9.2")] },

  /* Mark-all-read — a double tick. */
  checkAll: {
    reg: "outline",
    sw: 2.2,
    prims: [p("m2.6 12.6 3.6 3.6 6.8-7"), p("m11 15.4 1.4 1.4 8.6-8.8")],
  },

  alert: {
    reg: "outline",
    prims: [p("M10.3 3.9a2 2 0 0 1 3.4 0l7.1 12.3a2 2 0 0 1-1.7 3H4.9a2 2 0 0 1-1.7-3Z"), p("M12 9.4v4M12 16.4v.1")],
  },

  battery: {
    reg: "outline",
    prims: [r(2.4, 7.4, 16.2, 9.2, { rx: 2.6 }), p("M21.4 10.6v2.8")],
  },

  /* Filled disc with a tick — the bullet the agent's advice list uses. */
  checkCircle: {
    reg: "outline",
    prims: [
      c(12, 12, 9, { fill: "current", stroke: "none" }),
      p("m8.2 12.3 2.6 2.6 5-5.4", { stroke: "cut", sw: 2.1, cap: "round" }),
    ],
  },

  /* The AI Insights featured mark: a dark rounded square holding a plotted
     point. Deliberately not a tinted tile like the metric glyphs — it sits
     above them in the hierarchy. */
  insightMark: {
    reg: "outline",
    prims: [
      r(1.6, 1.6, 20.8, 20.8, { rx: 7, fill: "current", stroke: "none" }),
      p("M4.6 15.4c2-3.2 3.7-4.8 5.4-4.8 2.4 0 2.6 3.4 4.8 3.4 1.4 0 2.6-1 4.6-3", { stroke: "cut", sw: 1.8, cap: "round" }),
      c(10, 10.6, 2, { fill: "cut", stroke: "none" }),
    ],
  },

  /* ================================================================
     Metric glyphs.

     One per measure the band, the scale or a lab draw can produce.
     These are drawn for the *metric tile* — a 36–44px tinted disc — so they
     favour a legible silhouette over interior detail, and they all read at
     20px without a label.
     ================================================================ */

  /* Respiration — a pair of lobes either side of the trachea. The lobes are
     drawn wide and shallow; a narrow tall pair reads as a cactus. */
  lungs: {
    reg: "outline",
    prims: [
      p("M12 2.8v5.4"),
      p("M12 8.2c-1.5 0-2.7.7-3.6 2-1 1.3-1.6 3-1.8 4.8l-.2 2.4a3 3 0 0 0 3 3.3h.4a2.2 2.2 0 0 0 2.2-2.2V8.2Z"),
      p("M12 8.2c1.5 0 2.7.7 3.6 2 1 1.3 1.6 3 1.8 4.8l.2 2.4a3 3 0 0 1-3 3.3h-.4a2.2 2.2 0 0 1-2.2-2.2V8.2Z"),
    ],
  },

  /* ECG — one PQRST complex. The spike is the whole point of the glyph, so it
     is drawn tall enough to survive the tile's tint at small sizes. */
  ecg: {
    reg: "outline",
    sw: 1.7,
    prims: [p("M3 13h3l1-1.4 1 1.4h1.5l.7 1.4 1.2-8.8 1.2 11.6.8-4.2h1.6l1.4-2.2 1.4 2.2h3.2")],
  },

  /* Sleep — a crescent. */
  moon: {
    reg: "solid",
    prims: [p("M20.4 13.8A8.4 8.4 0 0 1 10.2 3.6a8.4 8.4 0 1 0 10.2 10.2Z")],
  },

  /* Fatigue — a battery down to its last bar. */
  batteryLow: {
    reg: "outline",
    prims: [
      r(2.4, 7.4, 16.2, 9.2, { rx: 2.6 }),
      p("M21.4 10.6v2.8"),
      r(4.6, 9.6, 3.4, 4.8, { rx: 1, fill: "current", stroke: "none" }),
    ],
  },

  /* GSR — a droplet crossed by the conductance line it measures. */
  sweat: {
    reg: "solid",
    prims: [
      p("M12 3.6c2 2.3 6.2 7.4 6.2 11a6.2 6.2 0 0 1-12.4 0C5.8 11 10 5.9 12 3.6Z"),
      p("M5.6 15.2c1.4-1.3 2.8-1.3 4.2 0s2.8 1.3 4.2 0 2.8-1.3 4.2 0", { fill: "none", stroke: "cut", so: 0.75, sw: 1.6, cap: "round" }),
    ],
  },

  /* MET / activity intensity — a running figure. */
  run: {
    reg: "outline",
    sw: 1.8,
    prims: [
      c(15.8, 4.8, 1.9),
      p("M15.4 7.3 11.9 12.3"),
      p("M14.6 8.2 11.5 8.6"),
      p("M14.6 8.2 17.2 10.4"),
      p("M11.9 12.3 14.4 14.8 13.4 19"),
      p("M11.9 12.3 9.3 14.2 6.5 13.4"),
    ],
  },

  /* Calories — a flame. */
  flame: {
    reg: "solid",
    prims: [
      p("M12 2.6c2.9 3.3 6.4 6.1 6.4 10.4a6.4 6.4 0 0 1-12.8 0c0-2.2 1.1-3.9 2.4-5.4.5 1 1.2 1.7 2 2-.9-2.4-.5-5.1 2-7Z"),
    ],
  },

  /* Steps — two prints, offset the way a gait is. Each is one elongated
     shape: a sole and a separate toe circle read as two unrelated blobs. */
  footsteps: {
    reg: "solid",
    prims: [
      p("M8.2 3.4c1.6 0 2.8 1.3 2.8 3.1 0 2.2-.6 4.6-1.3 6.3-.3.8-2.7.8-3 0-.7-1.7-1.3-4.1-1.3-6.3 0-1.8 1.2-3.1 2.8-3.1Z"),
      p("M15.8 10.8c1.6 0 2.8 1.3 2.8 3.1 0 2.2-.6 4.6-1.3 6.3-.3.8-2.7.8-3 0-.7-1.7-1.3-4.1-1.3-6.3 0-1.8 1.2-3.1 2.8-3.1Z"),
    ],
  },

  /* Distance — a route between two points. */
  route: {
    reg: "outline",
    prims: [
      c(4.6, 18.4, 1.8, { fill: "current", stroke: "none" }),
      p("M6.4 18.4c0-3.6 4.4-3.4 7.4-4.6 2.4-1 4-2.6 4-5.4"),
      c(17.8, 7.6, 1.8, { fill: "current", stroke: "none" }),
    ],
  },

  /* Stress — a pressure gauge. A brain reads as mush at 20px; a needle does
     not. */
  gauge: {
    reg: "outline",
    sw: 1.9,
    prims: [
      p("M4.2 17.4a8.6 8.6 0 1 1 15.6 0"),
      p("M12 17.4 16.4 10"),
      c(12, 17.4, 1.6, { fill: "current", stroke: "none" }),
    ],
  },

  /* Emotion — a face. */
  smile: {
    reg: "outline",
    prims: [
      c(12, 12, 9),
      c(9, 10, 0.9, { fill: "current", stroke: "none" }),
      c(15, 10, 0.9, { fill: "current", stroke: "none" }),
      p("M8.4 14.2a4.6 4.6 0 0 0 7.2 0"),
    ],
  },

  /* HRV — a beat followed by the interval it is measured across. The beat
     needs real amplitude and the bracket a clear gap, or the two collapse
     into one squiggle at 20px. */
  hrv: {
    reg: "outline",
    sw: 1.7,
    prims: [
      p("M2.6 12.6h2.6l1.4-2.6 1.6 7.4 1.6-11.6 1.6 6.8h1.4"),
      p("M14.6 12.6h6.6"),
      p("M14.6 10.4v4.4M21.2 10.4v4.4"),
    ],
  },

  /* Body composition — a torso silhouette. */
  bodyComposition: {
    reg: "outline",
    sw: 1.8,
    prims: [
      c(12, 4.9, 2.5),
      p("M12 8.4c-2.5 0-4.4 1.2-5.4 3.1l-1.6 3.6 2.1.9.9-2v6.8h8v-6.8l.9 2 2.1-.9-1.6-3.6c-1-1.9-2.9-3.1-5.4-3.1Z"),
    ],
  },

  /* Blood glucose — the blood droplet with a reading window cut into it, so
     it is not mistaken for plain `droplet` (blood pressure). */
  glucose: {
    reg: "solid",
    prims: [
      p("M12 3.2c2.1 2.4 6.3 7.6 6.3 11.2a6.3 6.3 0 0 1-12.6 0C5.7 10.8 9.9 5.6 12 3.2Z"),
      c(12, 14.2, 2.7, { fill: "cut", stroke: "none" }),
      c(12, 14.2, 1.25, { fill: "current", stroke: "none" }),
    ],
  },
} satisfies Record<string, Glyph>;

export type GlyphName = keyof typeof glyphs;
