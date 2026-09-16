import { Home, Activity, Sparkles, Heart, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { patientTheme } from "../theme";

const NAV = [
  { path: "/patient/home", icon: Home, label: "Home", fillable: true },
  { path: "/patient/vitals", icon: Activity, label: "Vitals", fillable: false },
  { path: "/patient/ai", icon: Sparkles, label: "AI", fillable: false },
  { path: "/patient/care", icon: Heart, label: "Care", fillable: true },
  { path: "/patient/profile", icon: User, label: "Profile", fillable: false },
];

/**
 * Floating navigation control.
 * The bar is an elevated surface the content scrolls beneath; the centre
 * AI destination rises out of it as a physical green control — the visual
 * centrepiece — while the other four stay quiet.
 */
export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname;

  const isActive = (path: string) => active === path || active.startsWith(path + "/");

  return (
    <nav
      className="mh-nav fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: "max(4px, env(safe-area-inset-bottom))" }}
    >
      <div className="relative mx-auto" style={{ width: "min(430px, 100%)" }}>
        {/* ---- Raised AI control: rises out of the bar ---- */}
        <div
          className="absolute left-1/2 z-10"
          style={{ transform: "translateX(-50%)", top: -28 }}
        >
          <span className="mh-nav-ai-halo" aria-hidden />
          <button
            onClick={() => navigate("/patient/ai")}
            aria-label="AI"
            aria-current={isActive("/patient/ai") ? "page" : undefined}
            className="mh-icon-green mh-breathe relative flex items-center justify-center"
            style={{ width: 54, height: 54 }}
          >
            <Sparkles size={23} strokeWidth={2.1} />
          </button>
        </div>

        {/* ---- The four quiet destinations + the AI slot ---- */}
        <div className="flex items-end justify-between px-2 pt-2.5 pb-1.5">
          {NAV.map(({ path, icon: Icon, label, fillable }) => {
            const on = isActive(path);
            const isAI = label === "AI";

            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                aria-label={label}
                aria-current={on ? "page" : undefined}
                className="flex-1 flex flex-col items-center justify-end gap-0.5 outline-none focus-visible:ring-2 focus-visible:ring-green-500/40 rounded-2xl"
                style={{
                  paddingTop: 6,
                  paddingBottom: 4,
                  color: on ? patientTheme.colors.primaryDark : patientTheme.colors.inkMuted,
                }}
              >
                {isAI ? (
                  /* Spacer keeps the grid honest — the control itself floats above */
                  <span style={{ height: 30, display: "block" }} aria-hidden />
                ) : (
                  <span
                    className={`flex items-center justify-center ${on ? "mh-nav-active" : ""}`}
                    style={{
                      width: 42,
                      height: 30,
                      borderRadius: 999,
                      background: on ? undefined : "transparent",
                      border: "1px solid transparent",
                    }}
                  >
                    <Icon
                      size={20}
                      strokeWidth={on ? 2.3 : 1.9}
                      fill={on && fillable ? patientTheme.colors.primaryDark : "none"}
                    />
                  </span>
                )}
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: on ? 700 : 500,
                    letterSpacing: "-0.01em",
                    color: on ? patientTheme.colors.primaryDark : patientTheme.colors.inkMuted,
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
