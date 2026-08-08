import { useState, useEffect } from "react";
import { useLocation, useNavigate, Outlet } from "react-router";
import { AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Users, Calendar, MessageSquare,
  Settings, Bell, ChevronDown, Search, Menu, X,
  LogOut, Heart, Stethoscope, Home, FlaskConical,
  Package, DollarSign, BarChart3, GitBranch, UserCheck, Pill, Activity,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { SkeletonPulse } from "../components/shared/Skeleton";
import { confirmAction, success } from "../components/shared/SweetAlert";

const ADMIN_NAV = [
  { path: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "patients", icon: Users, label: "Patients" },
  { path: "appointments", icon: Calendar, label: "Appointments" },
  { path: "consultations", icon: Stethoscope, label: "Consultations" },
  { path: "vitals", icon: Activity, label: "Vitals Dashboard" },
  { path: "labs", icon: FlaskConical, label: "Lab Tests" },
  { path: "prescriptions", icon: Pill, label: "Prescriptions" },
  { path: "inventory", icon: Package, label: "Inventory" },
  { path: "payments", icon: DollarSign, label: "Payments" },
  { path: "referrals", icon: GitBranch, label: "Referrals" },
  { path: "reports", icon: BarChart3, label: "Reports" },
  { path: "staff", icon: UserCheck, label: "Staff" },
  { path: "messages", icon: MessageSquare, label: "Messages" },
];

const ADMIN_BOTTOM_NAV = [
  { path: "settings", icon: Settings, label: "Settings" },
];

const SIDEBAR_BG = "#131E33";
const SIDEBAR_WIDTH = 256;
const COLLAPSED_WIDTH = 72;

export default function AdminLayout() {
  const [unit, setUnit] = useState("General Ward A");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [units, setUnits] = useState<string[]>(["General Ward A", "ICU Unit B", "Pediatric Ward"]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, isAuthenticated, role, logout } = useAuth();

  useEffect(() => {
    if (!loading && (!isAuthenticated || (role !== "admin" && role !== "staff"))) {
      navigate("/login", { replace: true });
    }
  }, [loading, isAuthenticated, role, navigate]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
        setMobileOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh h-dvh w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
            <Heart size={20} color="#fff" />
          </div>
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (role !== "admin" && role !== "staff")) return null;

  const displayName = user ? `${user.firstName} ${user.lastName}` : "";
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "";

  const renderNav = (items: typeof ADMIN_NAV, groupLabel: string) => (
    <div className="px-3 py-2">
      {!collapsed && (
        <p className="text-[10px] font-bold px-3 pb-2 pt-2 tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>{groupLabel}</p>
      )}
      {items.map(({ path, icon: Icon, label }) => {
        const active = location.pathname.includes(`/admin/${path}`);
        return (
          <button
            key={path}
            onClick={() => {
              navigate(`/admin/${path}`);
              setMobileOpen(false);
            }}
            className={`w-full flex items-center rounded-xl text-sm transition-all mb-1 ${collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"}`}
            style={{
              background: active ? "rgba(15,125,122,0.18)" : "transparent",
              color: active ? "#36A09D" : "rgba(226,232,240,0.72)",
              borderLeft: active ? "3px solid #0F7D7A" : "3px solid transparent",
              boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
            }}
            title={collapsed ? label : undefined}
          >
            <Icon size={collapsed ? 18 : 15} className="flex-shrink-0" />
            {!collapsed && <span className="flex-1 text-left font-medium">{label}</span>}
          </button>
        );
      })}
    </div>
  );

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2.5 px-5 h-16 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div
          className="rounded-xl flex items-center justify-center"
          style={{
            width: collapsed ? 40 : 36,
            height: collapsed ? 40 : 36,
            background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)",
            boxShadow: "0 4px 12px rgba(15,125,122,0.4), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          <Heart size={collapsed ? 20 : 16} color="#fff" />
        </div>
        {!collapsed && <span className="text-white font-bold text-base tracking-tight">MicroHealth</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {renderNav(ADMIN_NAV, "Clinical")}
        {renderNav(ADMIN_BOTTOM_NAV, "System")}
        <div className="px-3 pb-2">
          <button
            onClick={async () => {
              const confirmed = await confirmAction("Sign Out?", "You will be returned to the login page.");
              if (!confirmed) return;
              logout();
              success("Signed out", "See you soon");
              navigate("/login");
            }}
            className={`w-full flex items-center text-sm transition-all rounded-xl ${collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"}`}
            style={{ color: "rgba(226,232,240,0.55)" }}
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut size={collapsed ? 18 : 15} />
            {!collapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </nav>

      <div className="px-3 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}>
          <div
            className="rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              width: collapsed ? 36 : 36,
              height: collapsed ? 36 : 36,
              background: "linear-gradient(135deg, #0F7D7A, #36A09D)",
              color: "#fff",
              boxShadow: "0 3px 8px rgba(15,125,122,0.4), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{displayName}</div>
              <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{user?.role === "admin" ? "Administrator" : "Clinical Staff"}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-dvh h-dvh w-full overflow-hidden bg-background" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <AnimatePresence>
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
          />
        )}
      </AnimatePresence>

      <aside
        className="hidden lg:flex flex-col h-full flex-shrink-0 overflow-hidden z-30 transition-all"
        style={{ width: collapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH, background: SIDEBAR_BG, boxShadow: "4px 0 24px rgba(0,0,0,0.1)" }}
      >
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <aside
            className="fixed inset-y-0 left-0 z-50 flex flex-col h-full overflow-hidden lg:hidden transition-transform"
            style={{ width: SIDEBAR_WIDTH, background: SIDEBAR_BG, boxShadow: "8px 0 32px rgba(0,0,0,0.2)", transform: mobileOpen ? "translateX(0)" : "translateX(-100%)" }}
          >
            <div className="flex items-center justify-between px-5 h-16 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="text-white font-bold text-base tracking-tight">MicroHealth</span>
              <button onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white"><X size={20} /></button>
            </div>
            {sidebarContent}
          </aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className="flex items-center gap-4 px-4 lg:px-6 bg-card flex-shrink-0"
          style={{ height: 64, borderBottom: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <Menu size={18} className="text-gray-600" />
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-9 h-9 rounded-lg items-center justify-center transition-all"
            style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <Menu size={16} className="text-gray-600" />
          </button>

          <button
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)",
              color: "#374151",
              boxShadow: "var(--skeuo-shadow-sm)",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
            onClick={() => {
              const idx = units.indexOf(unit);
              setUnit(units[(idx + 1) % units.length]);
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#0F7D7A] pulse-soft" />
            <span className="hidden sm:inline">{unit}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          <div className="flex-1" />

          <div className="relative hidden md:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="pl-9 pr-3 py-2 text-sm rounded-xl outline-none w-52 transition-all focus:ring-2"
              style={{
                background: "var(--skeuo-input-gradient)",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "var(--skeuo-shadow-inset)",
                color: "#374151",
              }}
              placeholder="Search patients, records…"
            />
          </div>

          <span className="text-sm text-muted-foreground hidden lg:block">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>

          <button
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "var(--skeuo-shadow-sm)",
            }}
          >
            <Bell size={15} className="text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 pulse-soft" />
          </button>

          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #0F7D7A, #36A09D)",
              color: "#fff",
              boxShadow: "0 3px 10px rgba(15,125,122,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            {initials}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
