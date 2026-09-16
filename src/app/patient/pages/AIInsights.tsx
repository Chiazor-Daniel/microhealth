import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock,
  Activity,
  Heart,
  AlertCircle,
  Droplets,
  Moon,
  Pill,
} from "lucide-react";
import { useInsights } from "../hooks/useInsights";
import { patientTheme } from "../theme";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { SegmentedTabs } from "../components/SegmentedTabs";

const RANGES = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

const WINDOW_DAYS: Record<string, number> = { today: 1, week: 7, month: 30 };

/** Icon + tint per insight type, and by keyword for the common reminders. */
function visualFor(type: string, title: string) {
  const t = `${type} ${title}`.toLowerCase();
  if (t.includes("hydrat") || t.includes("water")) return { icon: Droplets, cls: "mh-icon-blue" };
  if (t.includes("sleep")) return { icon: Moon, cls: "mh-icon-blue" };
  if (t.includes("medic") || t.includes("dose")) return { icon: Pill, cls: "" };
  switch (type) {
    case "trend":
      return { icon: TrendingUp, cls: "" };
    case "lab":
      return { icon: Activity, cls: "mh-icon-blue" };
    case "recovery":
      return { icon: Heart, cls: "mh-icon-rose" };
    case "medication":
    case "appointment":
      return { icon: Clock, cls: "" };
    case "wearable":
      return { icon: AlertCircle, cls: "mh-icon-amber" };
    default:
      return { icon: Sparkles, cls: "" };
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

    // The agent can emit the same insight repeatedly; collapse to the newest
    // per title so the list reads as distinct findings, not a repeated log.
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

  // The strongest current signal is featured; the rest fall into the list.
  const featured = filtered.find((i) => i.priority === "watch" || i.priority === "attention" || i.priority === "urgent") ?? filtered[0];
  const others = filtered.filter((i) => i.id !== featured?.id);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const featuredVisual = featured ? visualFor(featured.type as string, featured.title) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/patient/home")}
          aria-label="Back"
          className="mh-btn-icon w-9 h-9 flex items-center justify-center"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-[17px] font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
          AI Insights
        </h1>
        <span className="w-9" aria-hidden />
      </div>

      <SegmentedTabs options={RANGES} value={range} onChange={setRange} />

      {filtered.length === 0 ? (
        <div className="mh-card flex flex-col items-center justify-center py-14 px-6">
          <div className="mh-icon w-12 h-12">
            <Sparkles size={20} />
          </div>
          <p className="text-sm font-semibold mt-3" style={{ color: patientTheme.colors.textPrimary }}>
            Nothing to report
          </p>
          <p className="text-[13px] mt-1 text-center" style={{ color: patientTheme.colors.textMuted }}>
            Your readings look steady in this period.
          </p>
        </div>
      ) : (
        <>
          {/* Featured insight */}
          {featured && featuredVisual && (
            <section>
              <h2 className="text-[15px] font-semibold mb-3" style={{ color: patientTheme.colors.textPrimary }}>
                Health Trend
              </h2>
              <div className="mh-card-feature mh-card" style={{ padding: 18 }}>
                <div className="flex items-start gap-3">
                  <div className={`mh-icon ${featuredVisual.cls} w-11 h-11`}>
                    <featuredVisual.icon size={19} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[15.5px] font-semibold leading-snug" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.01em" }}>
                        {featured.title}
                      </p>
                      <span className="text-[11px] whitespace-nowrap mt-0.5" style={{ color: patientTheme.colors.textMuted }}>
                        {relativeTime(featured.createdAt)}
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed mt-1.5" style={{ color: patientTheme.colors.textSecondary }}>
                      {featured.message}
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

          {/* Other insights */}
          {others.length > 0 && (
            <section>
              <h2 className="text-[15px] font-semibold mb-3" style={{ color: patientTheme.colors.textPrimary }}>
                Other Insights
              </h2>
              <div className="mh-card overflow-hidden">
                {others.map((ins, i) => {
                  const v = visualFor(ins.type as string, ins.title);
                  const Icon = v.icon;
                  return (
                    <button
                      key={ins.id}
                      onClick={() => navigate("/patient/ai")}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                      style={{ borderTop: i === 0 ? "none" : `1px solid ${patientTheme.colors.hairlineSoft}` }}
                    >
                      <div className={`mh-icon ${v.cls} w-10 h-10`}>
                        <Icon size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold truncate" style={{ color: patientTheme.colors.textPrimary }}>
                          {ins.title}
                        </p>
                        <p className="text-[12.5px] truncate mt-0.5" style={{ color: patientTheme.colors.textSecondary }}>
                          {ins.message}
                        </p>
                      </div>
                      <ChevronRight size={16} className="flex-shrink-0" style={{ color: patientTheme.colors.textMuted }} />
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
