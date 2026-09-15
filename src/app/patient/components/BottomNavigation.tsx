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
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      <div
        className="pointer-events-auto flex items-center justify-between gap-1 px-2 py-2 mx-3"
        style={{
          width: "min(420px, 100%)",
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(20px) saturate(1.3)",
          WebkitBackdropFilter: "blur(20px) saturate(1.3)",
          borderRadius: 26,
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow: "0 12px 32px rgba(16,24,40,0.12), 0 4px 12px rgba(16,24,40,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        {NAV.map(({ path, icon: Icon, label }) => {
          const isActive = active === path || active.startsWith(path + "/");
          const isAI = path === "/patient/ai";
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center justify-center gap-0.5 relative"
              style={{
                minWidth: 54,
                padding: "6px 8px",
                borderRadius: isAI ? 20 : 16,
                background: isActive
                  ? isAI
                    ? `linear-gradient(135deg, ${patientTheme.colors.aiAccent}, ${patientTheme.colors.primaryGreen})`
                    : patientTheme.colors.primaryPale
                  : "transparent",
                color: isActive ? (isAI ? "#fff" : patientTheme.colors.primaryGreen) : patientTheme.colors.textMuted,
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={isAI ? 22 : 20} strokeWidth={isActive ? 2.4 : 2} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: "0.02em",
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
