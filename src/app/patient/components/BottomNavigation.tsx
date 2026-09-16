import { Home, Activity, Sparkles, ClipboardList, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { patientTheme } from "../theme";

const NAV = [
  { path: "/patient/home", icon: Home, label: "Home" },
  { path: "/patient/vitals", icon: Activity, label: "Vitals" },
  { path: "/patient/ai", icon: Sparkles, label: "AI" },
  { path: "/patient/care", icon: ClipboardList, label: "Care" },
  { path: "/patient/profile", icon: User, label: "Profile" },
];

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
      style={{
        background: "#FFFFFF",
        borderTop: `1px solid ${patientTheme.colors.border}`,
        boxShadow: "0 -1px 2px rgba(0, 0, 0, 0.03)",
        paddingBottom: "max(6px, env(safe-area-inset-bottom))",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ width: "min(430px, 100%)", padding: "6px 8px 2px" }}
      >
        {NAV.map(({ path, icon: Icon, label }) => {
          const isActive = active === path || active.startsWith(path + "/");
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-col items-center justify-center gap-0.5 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded-lg"
              style={{
                flex: 1,
                paddingTop: 6,
                paddingBottom: 4,
                color: isActive ? patientTheme.colors.primaryGreen : patientTheme.colors.textMuted,
                transition: "color 0.15s ease",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 26,
                  borderRadius: 999,
                  background: isActive ? patientTheme.colors.primarySoft : "transparent",
                  transition: "background 0.15s ease",
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
              </span>
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500 }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
