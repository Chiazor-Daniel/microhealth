import { useEffect } from "react";
import { useLocation, useNavigate, Outlet } from "react-router";
import { Home, Calendar, Activity, MessageSquare, User, Bell, Heart, LogOut, Pill } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { confirmAction, success } from "../components/shared/SweetAlert";

const NAV_ITEMS = [
  { path: "home", icon: Home, label: "Home" },
  { path: "appointments", icon: Calendar, label: "Appts" },
  { path: "vitals", icon: Activity, label: "Health" },
  { path: "prescriptions", icon: Pill, label: "Meds" },
  { path: "messages", icon: MessageSquare, label: "Inbox" },
  { path: "profile", icon: User, label: "Profile" },
];

export default function PatientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, isAuthenticated, role, logout } = useAuth();

  useEffect(() => {
    if (!loading && (!isAuthenticated || role !== "patient")) {
      navigate("/patient/login", { replace: true });
    }
  }, [loading, isAuthenticated, role, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center" style={{ background: "#F0F2F3" }}>
        <div className="h-8 w-8 rounded-full border-2 border-[#0F7D7A] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || role !== "patient") return null;

  const displayName = user ? `${user.firstName} ${user.lastName}` : "Patient";
  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  function isActive(path: string) {
    return location.pathname.includes(`/patient/${path}`);
  }

  return (
    <div className="flex min-h-dvh w-full overflow-hidden" style={{ fontFamily: "'Work Sans', sans-serif", background: "#EEF0F2" }}>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 h-dvh overflow-y-auto" style={{ background: "#131E33" }}>
        <div className="flex items-center gap-2.5 px-5 h-16 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(145deg, #0F7D7A, #0A5E5C)", boxShadow: "0 2px 8px rgba(15,125,122,0.4), inset 0 1px 0 rgba(255,255,255,0.2)" }}>
            <Heart size={14} color="#fff" />
          </div>
          <span className="text-white font-bold text-base tracking-tight">MicroHealth</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-xs font-bold px-3 pb-2 pt-1 tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>Menu</p>
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <button key={path} onClick={() => navigate(`/patient/${path}`)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: active ? "rgba(15,125,122,0.18)" : "transparent",
                  color: active ? "#36A09D" : "rgba(226,232,240,0.72)",
                  borderLeft: active ? "2px solid #0F7D7A" : "2px solid transparent",
                }}>
                <Icon size={15} className="flex-shrink-0" />
                <span className="flex-1 text-left font-semibold">{label}</span>
              </button>
            );
          })}
        </nav>
        <div className="px-3 pb-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: "linear-gradient(145deg, #0F7D7A, #0A9A95)", color: "#fff", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)" }}>{initials}</div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{displayName}</div>
              <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>Patient</div>
            </div>
          </div>
          <button onClick={async () => {
            const ok = await confirmAction("Sign Out?", "You will be returned to the patient login page.");
            if (!ok) return;
            logout();
            success("Signed out", "See you soon");
            navigate("/patient/login");
          }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mt-2"
            style={{ color: "rgba(226,232,240,0.45)" }}>
            <LogOut size={15} />
            <span className="font-semibold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0 h-dvh overflow-hidden">
        {/* Mobile header — skeuomorphic: soft shadow, inset highlight */}
        <header
          className="flex md:hidden items-center gap-3 px-4 flex-shrink-0 z-20"
          style={{
            height: 56,
            paddingTop: "env(safe-area-inset-top)",
            background: "linear-gradient(180deg, #FFFFFF 0%, #FAFBFB 100%)",
            borderBottom: "1px solid rgba(13,27,42,0.07)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 6px 20px rgba(13,27,42,0.06), 0 1px 4px rgba(13,27,42,0.05)",
          }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(145deg, #0F7D7A, #0A5E5C)", boxShadow: "0 3px 8px rgba(15,125,122,0.35), inset 0 1px 0 rgba(255,255,255,0.22)" }}>
            <Heart size={14} color="#fff" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#8A97A8", letterSpacing: "0.08em" }}>MicroHealth</p>
            <p className="text-sm font-bold text-[#0D1B2A] -mt-0.5 truncate">{displayName}</p>
          </div>
          <button
            onClick={() => navigate("/patient/messages")}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #F2F4F5 100%)",
              border: "1px solid rgba(13,27,42,0.08)",
              boxShadow: "0 2px 8px rgba(13,27,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          >
            <Bell size={16} className="text-[#5F6B7A]" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#EF4444] border-2 border-white" style={{ boxShadow: "0 1px 4px rgba(239,68,68,0.5)" }} />
          </button>
          <button
            onClick={() => navigate("/patient/profile")}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: "linear-gradient(145deg, #E6F7F6, #D0EEEA)",
              color: "#0F7D7A",
              border: "1px solid rgba(15,125,122,0.14)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
            }}
          >
            {initials}
          </button>
        </header>

        {/* Desktop header */}
        <header
          className="hidden md:flex items-center gap-4 px-6 flex-shrink-0"
          style={{
            height: 64,
            background: "linear-gradient(180deg, #FFFFFF 0%, #FAFBFB 100%)",
            borderBottom: "1px solid rgba(13,27,42,0.07)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 16px rgba(13,27,42,0.05)",
          }}
        >
          <div className="flex-1" />
          <span className="text-sm font-medium text-[#5F6B7A]">Welcome, {user?.firstName}</span>
          <button
            onClick={() => navigate("/patient/messages")}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #F2F4F5 100%)",
              border: "1px solid rgba(13,27,42,0.08)",
              boxShadow: "0 2px 8px rgba(13,27,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          >
            <Bell size={16} className="text-[#5F6B7A]" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#EF4444] border-2 border-white" />
          </button>
        </header>

        {/* Scrollable content — warm paper surface, proper gutters */}
        <main className="flex-1 overflow-y-auto overscroll-contain" style={{ background: "#EEF0F2", WebkitOverflowScrolling: "touch" as any }}>
          <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-4 md:py-6 pb-28 md:pb-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav — floating dock / pill ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 flex justify-center pointer-events-none"
        style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
      >
        <div
          className="pointer-events-auto flex items-center gap-1 px-2 py-2 mx-3"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(16px) saturate(1.2)",
            WebkitBackdropFilter: "blur(16px) saturate(1.2)",
            borderRadius: 22,
            border: "1px solid rgba(13,27,42,0.08)",
            boxShadow: "0 12px 32px rgba(13,27,42,0.16), 0 4px 12px rgba(13,27,42,0.10), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(13,27,42,0.04)",
          }}
        >
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => navigate(`/patient/${path}`)}
                className="flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95"
                style={{
                  minWidth: 52,
                  padding: "6px 10px",
                  borderRadius: 14,
                  background: active
                    ? "linear-gradient(180deg, #0F7D7A 0%, #0B6B68 100%)"
                    : "transparent",
                  boxShadow: active
                    ? "0 4px 12px rgba(15,125,122,0.35), inset 0 1px 0 rgba(255,255,255,0.22)"
                    : "none",
                  border: active ? "1px solid rgba(15,125,122,0.2)" : "1px solid transparent",
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2.4 : 1.9}
                  style={{ color: active ? "#fff" : "#8A97A8" }}
                />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: active ? 800 : 600,
                    letterSpacing: "0.04em",
                    color: active ? "#fff" : "#8A97A8",
                    lineHeight: 1,
                    marginTop: 1,
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
