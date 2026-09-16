import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ChevronLeft,
  Watch,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useWearable } from "../hooks/useWearable";
import { confirmAction } from "../../components/shared/SweetAlert";
import { patientTheme } from "../theme";
import { StatusBadge } from "../components/StatusBadge";

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3.5"
      style={{ borderTop: `1px solid ${patientTheme.colors.borderLight}` }}
    >
      <span className="text-[13px]" style={{ color: patientTheme.colors.textSecondary }}>{label}</span>
      <span className="text-[13px] font-medium text-right" style={{ color: patientTheme.colors.textPrimary }}>
        {value || "—"}
      </span>
    </div>
  );
}

function MenuRow({
  icon: Icon,
  label,
  onClick,
  danger,
  last,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      style={{ borderTop: last ? "none" : `1px solid ${patientTheme.colors.borderLight}` }}
    >
      <div
        className="mh-icon w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ color: danger ? patientTheme.colors.error : patientTheme.colors.textSecondary, ...(danger ? { background: "radial-gradient(circle at 32% 28%, #FEF2F2 0%, #FEE2E2 70%, #FCD5D5 100%)", borderColor: "#FECACA" } : {}) }}
      >
        <Icon size={15} />
      </div>
      <span
        className="flex-1 text-sm font-medium"
        style={{ color: danger ? patientTheme.colors.error : patientTheme.colors.textPrimary }}
      >
        {label}
      </span>
      <ChevronRight size={16} style={{ color: patientTheme.colors.textMuted }} />
    </button>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { connected, batteryLevel, lastSynced } = useWearable(user?.profile?.id, true);

  const initials = `${user?.firstName?.[0] ?? "?"}${user?.lastName?.[0] ?? "?"}`.toUpperCase();
  const fullName = user ? `${user.firstName} ${user.lastName}` : "";
  const dob = user?.profile?.dateOfBirth;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center">
        <button
          onClick={() => navigate("/patient/home")}
          aria-label="Back to home"
          className="mh-btn-icon w-9 h-9 rounded-full flex items-center justify-center"
          style={{ color: patientTheme.colors.textPrimary }}
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Identity */}
      <div className="text-center">
        <div
          className="mh-avatar mh-avatar-raised w-20 h-20 flex items-center justify-center text-2xl font-semibold mx-auto"
          style={{ color: patientTheme.colors.primaryDark }}
        >
          {initials}
        </div>
        <p className="text-lg font-semibold mt-3" style={{ color: patientTheme.colors.textPrimary }}>
          {fullName || "Loading..."}
        </p>
        <p className="text-[13px] mt-0.5" style={{ color: patientTheme.colors.textSecondary }}>
          Patient ID: {user?.profile?.id?.slice(0, 8) || user?.id?.slice(0, 8) || "—"}
        </p>
        <button
          className="mh-btn-secondary mt-4 px-5 py-2 text-[13px] font-semibold"
        >
          Edit Profile
        </button>
      </div>

      {/* Personal information */}
      <section>
        <p className="text-sm font-semibold mb-3" style={{ color: patientTheme.colors.textPrimary }}>Personal Information</p>
        <div className="mh-card overflow-hidden">
          <div className="px-4 py-3.5">
            <span className="text-[13px]" style={{ color: patientTheme.colors.textSecondary }}>Full Name</span>
            <p className="text-[13px] font-medium" style={{ color: patientTheme.colors.textPrimary }}>{fullName || "—"}</p>
          </div>
          <InfoRow label="Date of Birth" value={dob ? new Date(dob).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : undefined} />
          <InfoRow label="Phone Number" value={user?.profile?.phone || user?.phone} />
          <InfoRow label="Email" value={user?.email} />
        </div>
      </section>

      {/* Connected devices */}
      <section>
        <p className="text-sm font-semibold mb-3" style={{ color: patientTheme.colors.textPrimary }}>Connected Devices</p>
        <div className="mh-card flex items-center gap-3 p-4">
          <div
            className="mh-icon mh-icon-slate w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ color: patientTheme.colors.textSecondary }}
          >
            <Watch size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold whitespace-nowrap" style={{ color: patientTheme.colors.textPrimary }}>
                MicroHealth Band
              </p>
              <StatusBadge status={connected ? "connected" : "pending"} />
            </div>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: patientTheme.colors.textMuted }}>
              {batteryLevel != null ? `Battery ${Math.round(batteryLevel)}%` : "Battery —"}
              {lastSynced ? ` · Synced ${lastSynced}` : ""}
            </p>
          </div>
          <ChevronRight size={16} className="flex-shrink-0" style={{ color: patientTheme.colors.textMuted }} />
        </div>
      </section>

      {/* Settings */}
      <section>
        <p className="text-sm font-semibold mb-3" style={{ color: patientTheme.colors.textPrimary }}>Settings</p>
        <div className="mh-card overflow-hidden">
          <MenuRow icon={Bell} label="Notifications" onClick={() => navigate("/patient/notifications")} />
          <MenuRow icon={Shield} label="Privacy & Security" />
          <MenuRow icon={HelpCircle} label="Help & Support" />
          <MenuRow
            icon={LogOut}
            label="Log Out"
            danger
            last
            onClick={async () => {
              const ok = await confirmAction("Sign Out?", "You will be returned to the patient login page.");
              if (!ok) return;
              logout();
              navigate("/patient/login");
            }}
          />
        </div>
      </section>
    </motion.div>
  );
}
