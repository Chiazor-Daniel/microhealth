import { useEffect } from "react";
import { useLocation, useNavigate, Outlet, Link } from "react-router";
import { Home, Calendar, Activity, MessageSquare, User, Bell, Heart, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { confirmAction, success } from "../components/shared/SweetAlert";

const NAV_ITEMS = [
  { path: "home", icon: Home, label: "Home" },
  { path: "appointments", icon: Calendar, label: "Appointments" },
  { path: "vitals", icon: Activity, label: "Health" },
  { path: "prescriptions", icon: Heart, label: "Meds" },
  { path: "messages", icon: MessageSquare, label: "Messages" },
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
      <div className="flex min-h-dvh h-dvh w-full items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated || role !== "patient") return null;

  const displayName = user ? `${user.firstName} ${user.lastName}` : "Patient";
  const initials = displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  function isActive(path: string) {
    return location.pathname.includes(`/patient/${path}`);
  }

  return (
    <div className="flex min-h-dvh h-dvh w-full overflow-hidden bg-background" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 h-full overflow-y-auto" style={{ background: "#131E33" }}>
        <div className="flex items-center gap-2.5 px-5 h-16 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 2px 8px rgba(15,125,122,0.4)" }}>
            <Heart size={14} color="#fff" />
          </div>
          <span className="text-white font-semibold text-base tracking-tight">MicroHealth</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-xs font-medium px-3 pb-2 pt-1 tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>Menu</p>
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <button key={path} onClick={() => navigate(`/patient/${path}`)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                style={{
                  background: active ? "rgba(15,125,122,0.18)" : "transparent",
                  color: active ? "#36A09D" : "rgba(226,232,240,0.72)",
                  borderLeft: active ? "2px solid #0F7D7A" : "2px solid transparent",
                }}>
                <Icon size={15} className="flex-shrink-0" />
                <span className="flex-1 text-left font-medium">{label}</span>
              </button>
            );
          })}
        </nav>
        <div className="px-3 pb-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: "linear-gradient(135deg, #0F7D7A, #36A09D)", color: "#fff" }}>{initials}</div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">{displayName}</div>
              <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>Patient</div>
            </div>
          </div>
          <button onClick={async () => {
            const confirmed = await confirmAction("Sign Out?", "You will be returned to the patient login page.");
            if (!confirmed) return;
            logout();
            success("Signed out", "See you soon");
            navigate("/patient/login");
          }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mt-2"
            style={{ color: "rgba(226,232,240,0.45)" }}>
            <LogOut size={15} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="flex items-center gap-4 px-4 md:px-6 bg-card flex-shrink-0" style={{ height: 64, borderBottom: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div className="md:hidden flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
              <Heart size={13} color="#fff" />
            </div>
            <span className="text-foreground font-semibold text-sm">MicroHealth</span>
          </div>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground hidden md:block">Welcome, {user?.firstName}</span>
          <button className="relative w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.07)" }}>
            <Bell size={15} className="text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-0 md:px-6 py-5 pb-24 md:pb-5 w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white z-50 px-2 pt-2 pb-6" style={{ borderTop: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
        <div className="flex max-w-lg mx-auto">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <button key={path} onClick={() => navigate(`/patient/${path}`)}
                className="flex-1 flex flex-col items-center gap-1 py-2 transition-all">
                <Icon size={20} style={{ color: active ? "#0F7D7A" : "#9CA3AF" }} />
                <span className="text-[10px] font-medium" style={{ color: active ? "#0F7D7A" : "#9CA3AF" }}>{label}</span>
                {active && <span className="w-1 h-1 rounded-full" style={{ background: "#0F7D7A" }} />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
