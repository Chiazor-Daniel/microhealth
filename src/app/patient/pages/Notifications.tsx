import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useInsights } from "../hooks/useInsights";
import { patientTheme } from "../theme";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { SegmentedTabs } from "../components/SegmentedTabs";
import {
  HeartIcon,
  CapsuleIcon,
  CalendarIcon,
  SparkIcon,
  WatchIcon,
  DropletIcon,
  PersonFilledIcon,
  FlaskIcon,
  BellIcon,
  CheckAllIcon,
  ChevronLeftIcon,
  type GlyphProps,
} from "../icons";

type Filter = "all" | "health" | "appointments" | "system";

const TABS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "health", label: "Health" },
  { value: "appointments", label: "Appointments" },
  { value: "system", label: "System" },
];

/** Which filter each insight type belongs to. */
const GROUP: Record<string, Exclude<Filter, "all">> = {
  vital_trend: "health",
  vital_recovery: "health",
  lab_result: "health",
  appointment_reminder: "appointments",
  medication_due: "system",
  wearable_offline: "system",
  system: "system",
};

const ICONS: Record<string, (p: GlyphProps) => React.ReactElement> = {
  vital_trend: HeartIcon,
  vital_recovery: HeartIcon,
  lab_result: FlaskIcon,
  appointment_reminder: PersonFilledIcon,
  medication_due: CapsuleIcon,
  wearable_offline: WatchIcon,
  system: SparkIcon,
};

/** Hydration is called out in blue by the design system; everything else
    sits on the category tint. */
const HYDRATION = /hydrat|water|fluid/i;

function iconFor(type: string, title: string) {
  if (HYDRATION.test(title)) return { Icon: DropletIcon, key: "hydration" as const };
  return { Icon: ICONS[type] ?? BellIcon, key: (GROUP[type] ?? "system") as keyof typeof TINTS };
}

/** Each category carries its own tint, so the feed is scannable by colour. */
const TINTS = {
  health: { fg: patientTheme.colors.rose, tile: "linear-gradient(160deg, #FFF5F7 0%, #FFE1E8 100%)" },
  appointments: { fg: patientTheme.colors.primaryDark, tile: "linear-gradient(160deg, #F4FCF6 0%, #DCF2E5 100%)" },
  system: { fg: patientTheme.colors.primaryDark, tile: "linear-gradient(160deg, #F4FCF6 0%, #DCF2E5 100%)" },
  hydration: { fg: patientTheme.colors.blue, tile: "linear-gradient(160deg, #F4F8FF 0%, #D8E8FD 100%)" },
} as const;

function timeLabel(iso?: string) {
  if (!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 2) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Notifications() {
  const navigate = useNavigate();
  const { insights, loading, error, markRead } = useInsights();
  const [filter, setFilter] = useState<Filter>("all");

  /**
   * The agent can raise the same finding more than once — a trend that
   * persists is genuinely re-detected. The feed cares about the finding, not
   * how many times it fired, so collapse per title and keep the newest.
   */
  const collapse = (list: typeof insights) => {
    const byTitle = new Map<string, { item: (typeof list)[number]; count: number }>();
    for (const i of list) {
      const key = i.title.trim().toLowerCase();
      const existing = byTitle.get(key);
      if (!existing) {
        byTitle.set(key, { item: i, count: 1 });
      } else {
        const newer = new Date(i.createdAt) > new Date(existing.item.createdAt);
        byTitle.set(key, { item: newer ? i : existing.item, count: existing.count + 1 });
      }
    }
    return [...byTitle.values()].sort(
      (a, b) => new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime()
    );
  };

  const visible = useMemo(
    () => (filter === "all" ? insights : insights.filter((i) => GROUP[i.type as string] === filter)),
    [insights, filter]
  );

  const isToday = (iso: string) => Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000;
  const today = collapse(visible.filter((i) => isToday(i.createdAt)));
  const earlier = collapse(visible.filter((i) => !isToday(i.createdAt)));

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  const rows = (list: ReturnType<typeof collapse>) => (
    <div className="space-y-3">
      {list.map(({ item: n }) => {
        const { Icon, key } = iconFor(n.type as string, n.title);
        const tint = TINTS[key];
        const unread = !n.isRead;

        return (
          <motion.button
            key={n.id}
            whileTap={{ scale: 0.99 }}
            onClick={() => { if (unread) markRead(n.id); }}
            className="mh-card w-full text-left flex items-start gap-3 p-3.5"
            aria-label={`${n.title}. ${n.message}`}
          >
            <span
              className="mh-icon flex-shrink-0"
              style={{ width: 40, height: 40, color: tint.fg, background: tint.tile }}
            >
              <Icon size={19} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="flex items-start gap-1.5">
                <span className="text-[13.5px] font-semibold leading-snug" style={{ color: patientTheme.colors.textPrimary }}>
                  {n.title}
                </span>
                {unread && (
                  <span
                    className="flex-shrink-0 mt-1.5"
                    style={{ width: 6, height: 6, borderRadius: 999, background: patientTheme.colors.primaryGreen }}
                    aria-label="Unread"
                  />
                )}
              </span>
              <span className="block text-[12.5px] leading-snug mt-0.5 line-clamp-2" style={{ color: patientTheme.colors.textSecondary }}>
                {n.message}
              </span>
            </span>
            <span className="text-[11px] whitespace-nowrap mt-0.5 flex-shrink-0" style={{ color: patientTheme.colors.textMuted }}>
              {timeLabel(n.createdAt)}
            </span>
          </motion.button>
        );
      })}
      {list.length === 0 && (
        <p className="text-[13px] py-6 text-center" style={{ color: patientTheme.colors.textMuted }}>
          Nothing here yet.
        </p>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Header — the title is the axis, the one action sits quietly beside it */}
      <div className="relative flex items-center justify-center h-9">
        <button
          onClick={() => navigate("/patient/home")}
          aria-label="Back"
          className="absolute left-0 flex items-center justify-center w-9 h-9 -ml-2"
          style={{ color: patientTheme.colors.textPrimary }}
        >
          <ChevronLeftIcon size={22} />
        </button>
        <h1 className="text-[17px] font-semibold" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.02em" }}>
          Notifications
        </h1>
        <button
          onClick={() => insights.forEach((n) => !n.isRead && markRead(n.id))}
          className="absolute right-0 flex items-center gap-1 text-[12.5px] font-semibold whitespace-nowrap"
          style={{ color: patientTheme.colors.primaryDark }}
        >
          <CheckAllIcon size={15} /> Mark all read
        </button>
      </div>

      <SegmentedTabs options={TABS} value={filter} onChange={setFilter} />

      <section>
        <p className="text-[14px] font-semibold mb-3" style={{ color: patientTheme.colors.textPrimary }}>Today</p>
        {rows(today)}
      </section>

      {earlier.length > 0 && (
        <section>
          <p className="text-[14px] font-semibold mb-3" style={{ color: patientTheme.colors.textPrimary }}>Earlier</p>
          {rows(earlier)}
        </section>
      )}
    </motion.div>
  );
}
