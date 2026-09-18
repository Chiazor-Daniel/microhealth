/**
 * Date and time formatting for the patient app.
 *
 * Hermes ships Intl on both platforms, but not every locale's data — and a
 * missing one silently degrades rather than throwing. Keeping the app's two
 * date formats here means there is one place to change them, and they stay
 * matching what the web build produces.
 */

const clock = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
const shortDate = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });

export function formatClock(iso?: string) {
  if (!iso) return "";
  return clock.format(new Date(iso));
}

export function formatShortDate(value: string | Date) {
  return shortDate.format(typeof value === "string" ? new Date(value) : value);
}

export function relativeTime(iso?: string) {
  if (!iso) return "just now";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function greeting(at = new Date()) {
  const hour = at.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
