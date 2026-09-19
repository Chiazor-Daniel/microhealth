import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useInsights } from "../hooks/useInsights";
import { patientTheme } from "../theme";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { SegmentedTabs } from "../components/SegmentedTabs";
import {
  SparkIcon,
  TrendIcon,
  HeartIcon,
  CapsuleIcon,
  CalendarIcon,
  DropletIcon,
  FlaskIcon,
  WatchIcon,
  InsightMarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  type GlyphProps,
} from "../icons";

const RANGES = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

const WINDOW_DAYS: Record<string, number> = { today: 1, week: 7, month: 30 };

type Visual = { Icon: (p: GlyphProps) => React.ReactElement; fg: string; tile: string };

const TILES = {
  green: { fg: patientTheme.colors.primaryDark, tile: "linear-gradient(160deg, #F4FCF6 0%, #DCF2E5 100%)" },
  rose: { fg: patientTheme.colors.rose, tile: "linear-gradient(160deg, #FFF5F7 0%, #FFE1E8 100%)" },
  amber: { fg: patientTheme.colors.amber, tile: "linear-gradient(160deg, #FFFBF0 0%, #FDE9B0 100%)" },
  blue: { fg: patientTheme.colors.blue, tile: "linear-gradient(160deg, #F4F8FF 0%, #D8E8FD 100%)" },
  teal: { fg: patientTheme.colors.teal, tile: "linear-gradient(160deg, #F0FCFA 0%, #CCF3EA 100%)" },
} as const;

/**
 * Icon + tint per insight. The design system fixes these pairs, so a
 * hydration reminder is amber and a sleep note is blue wherever they appear —
 * the tint is how the list is read at a glance.
 */
function visualFor(type: string, title: string): Visual {
  const t = `${type} ${title}`.toLowerCase();
  if (t.includes("hydrat") || t.includes("water") || t.includes("fluid")) return { Icon: DropletIcon, ...TILES.amber };
  if (t.includes("sleep") || t.includes("rest")) return { Icon: SparkIcon, ...TILES.blue };
  if (t.includes("medic") || t.includes("dose") || t.includes("prescription")) return { Icon: CapsuleIcon, ...TILES.green };
  if (t.includes("appointment")) return { Icon: CalendarIcon, ...TILES.green };
  if (t.includes("lab") || t.includes("result")) return { Icon: FlaskIcon, ...TILES.green };
  if (t.includes("heart") || t.includes("recovery")) return { Icon: HeartIcon, ...TILES.rose };
  switch (type) {
    case "trend":
      return { Icon: TrendIcon, ...TILES.green };
    case "lab":
      return { Icon: FlaskIcon, ...TILES.green };
    case "recovery":
      return { Icon: HeartIcon, ...TILES.rose };
    case "medication":
    case "appointment":
      return { Icon: CapsuleIcon, ...TILES.green };
    case "wearable":
      return { Icon: WatchIcon, ...TILES.amber };
    default:
      return { Icon: SparkIcon, ...TILES.green };
  }
}

function relativeTime(iso?: string) {
  if (!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 2) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AIInsights() {
  const navigate = useNavigate();
  const { insights, loading, error, refresh } = useInsights();
  const [range, setRange] = useState<"today" | "week" | "month">("today");

  const filtered = useMemo(() => {
    const cutoff = Date.now() - WINDOW_DAYS[range] * 24 * 60 * 60 * 1000;
    const inWindow = insights.filter((i) => new Date(i.createdAt).getTime() >= cutoff);

    /* The agent can emit the same finding more than once; collapse to the
       newest per title so the list reads as distinct findings. */
    const byTitle = new Map<string, (typeof inWindow)[number]>();
    for (const i of inWindow) {
      const key = i.title.trim().toLowerCase();
      const existing = byTitle.get(key);
      if (!existing || new Date(i.createdAt) > new Date(existing.createdAt)) {
        byTitle.set(key, i);
      }
    }
    return [...byTitle.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [insights, range]);

  const featured = filtered.find((i) => i.priority === "watch" || i.priority === "attention" || i.priority === "urgent") ?? filtered[0];
  const others = filtered.filter((i) => i.id !== featured?.id);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const featuredVisual = featured ? visualFor(featured.type as string, featured.title) : null;

  return (
    <motion.div
      className="space-y-5"
    >
      {/* Header — bare chevron, the title on the axis */}
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
          AI Insights
        </h1>
      </div>

      <SegmentedTabs options={RANGES} value={range} onChange={setRange} />

      {filtered.length === 0 ? (
        <div className="mh-card flex flex-col items-center justify-center py-14 px-6">
          <span
            className="mh-icon flex items-center justify-center"
            style={{ width: 52, height: 52, color: patientTheme.colors.primaryDark, background: patientTheme.gradients.tile }}
          >
            <SparkIcon size={24} />
          </span>
          <p className="text-[14px] font-semibold mt-3.5" style={{ color: patientTheme.colors.textPrimary }}>
            Nothing to report
          </p>
          <p className="text-[13px] mt-1 text-center" style={{ color: patientTheme.colors.textMuted }}>
            Your readings look steady in this period.
          </p>
        </div>
      ) : (
        <>
          {/* The strongest current signal, given the room to explain itself */}
          {featured && featuredVisual && (
            <section>
              <h2 className="text-[15px] font-semibold mb-3" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.01em" }}>
                Health Trend
              </h2>
              <div className="mh-card" style={{ padding: 18 }}>
                <div className="flex items-start gap-3">
                  {/* The featured mark is the AI one, not a metric tile — it
                      sits above the metric glyphs in the hierarchy. */}
                  <span
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: 42, height: 42, color: patientTheme.colors.ink }}
                    aria-hidden
                  >
                    <InsightMarkIcon size={40} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15.5px] font-semibold leading-snug" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.01em" }}>
                      {featured.title}
                    </p>
                    <p className="text-[13px] leading-relaxed mt-1.5" style={{ color: patientTheme.colors.textSecondary }}>
                      {featured.message}
                    </p>
                    <p className="text-[11.5px] mt-2" style={{ color: patientTheme.colors.textMuted }}>
                      {relativeTime(featured.createdAt)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/patient/ai")}
                  className="mh-btn-primary w-full mt-4 py-2.5 text-[13px] font-semibold"
                >
                  View details
                </button>
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section>
              <h2 className="text-[15px] font-semibold mb-3" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.01em" }}>
                Other Insights
              </h2>
              <div className="space-y-3">
                {others.map((ins) => {
                  const v = visualFor(ins.type as string, ins.title);
                  return (
                    <button
                      key={ins.id}
                      onClick={() => navigate("/patient/ai")}
                      className="mh-card w-full flex items-center gap-3 p-3.5 text-left"
                    >
                      <span
                        className="mh-icon flex items-center justify-center flex-shrink-0"
                        style={{ width: 40, height: 40, color: v.fg, background: v.tile }}
                      >
                        <v.Icon size={19} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13.5px] font-semibold truncate" style={{ color: patientTheme.colors.textPrimary }}>
                          {ins.title}
                        </span>
                        <span className="block text-[12.5px] truncate mt-0.5" style={{ color: patientTheme.colors.textSecondary }}>
                          {ins.message}
                        </span>
                      </span>
                      <span className="flex-shrink-0" style={{ color: patientTheme.colors.textMuted }}>
                        <ChevronRightIcon size={16} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </motion.div>
  );
}
