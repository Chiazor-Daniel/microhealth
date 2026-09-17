/**
 * Turning a stream of readings into a plottable series.
 *
 * The wearable pushes readings seconds apart, so "the last 12 readings" is a
 * two-minute window with a repeating minute label — not the day the range tab
 * promises. These helpers select by *time* and then thin the result down to a
 * readable number of points.
 */

export interface Reading {
  recordedAt?: string;
  [key: string]: unknown;
}

export const RANGE_HOURS: Record<string, number> = {
  day: 24,
  week: 24 * 7,
  month: 24 * 30,
  quarter: 24 * 90,
};

/** How many points to draw. Enough shape, few enough to label. */
export const RANGE_POINTS: Record<string, number> = {
  day: 24,
  week: 28,
  month: 30,
  quarter: 30,
};

/**
 * Readings inside the range window, oldest first, thinned to `maxPoints`.
 *
 * Falls back to the most recent `maxPoints` readings when the window holds
 * fewer than two — a young account should still draw a line rather than an
 * empty state.
 */
export function buildSeries<T>(
  readings: Reading[],
  range: string,
  read: (r: Reading) => T | null | undefined,
  maxPoints = RANGE_POINTS[range] ?? 24
): { value: T; at: string }[] {
  const hours = RANGE_HOURS[range] ?? 24;
  const cutoff = Date.now() - hours * 3600_000;

  const timed = readings
    .map((r) => ({ value: read(r), at: r.recordedAt ?? "", ms: r.recordedAt ? new Date(r.recordedAt).getTime() : 0 }))
    .filter((p): p is { value: T; at: string; ms: number } => p.value != null && !Number.isNaN(p.ms) && p.ms > 0)
    .sort((a, b) => a.ms - b.ms);

  const inWindow = timed.filter((p) => p.ms >= cutoff);
  const chosen = inWindow.length >= 2 ? inWindow : timed.slice(-maxPoints);

  if (chosen.length <= maxPoints) return chosen.map(({ value, at }) => ({ value, at }));

  // Even sample, always keeping the first and last so the span reads true.
  const step = (chosen.length - 1) / (maxPoints - 1);
  const out: { value: T; at: string }[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const p = chosen[Math.round(i * step)];
    out.push({ value: p.value, at: p.at });
  }
  return out;
}

/** Short axis label for a point, at the resolution the range calls for. */
export function axisLabel(at: string, range: string): string {
  const d = new Date(at);
  if (range === "day") return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Tick values with no repeats.
 *
 * Two readings inside the same minute render the same label, so forcing a tick
 * at both prints the time twice. Collapsing to distinct labels first, then
 * sampling, is what keeps the axis honest.
 */
export function distinctTicks(labels: string[], wanted = 4): string[] {
  const unique = Array.from(new Set(labels));
  if (unique.length <= wanted) return unique;
  const step = (unique.length - 1) / (wanted - 1);
  const out: string[] = [];
  for (let i = 0; i < wanted; i++) out.push(unique[Math.round(i * step)]);
  return Array.from(new Set(out));
}
