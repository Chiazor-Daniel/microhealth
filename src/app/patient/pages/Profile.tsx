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
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: danger ? patientTheme.colors.errorSoft : patientTheme.colors.surfaceSecondary,
          color: danger ? patientTheme.colors.error : patientTheme.colors.textSecondary,
        }}
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
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: patientTheme.colors.surface,
            border: `1px solid ${patientTheme.colors.border}`,
            color: patientTheme.colors.textPrimary,
          }}
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Identity */}
      <div className="text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold mx-auto"
          style={{ background: patientTheme.colors.primarySoft, color: patientTheme.colors.primaryDark }}
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
          className="mt-4 px-5 py-2 rounded-full text-[13px] font-semibold"
          style={{
            background: patientTheme.colors.surface,
            border: `1px solid ${patientTheme.colors.primaryGreen}`,
            color: patientTheme.colors.primaryGreen,
          }}
        >
          Edit Profile
        </button>
      </div>

      {/* Personal information */}
      <section>
        <p className="text-sm font-semibold mb-3" style={{ color: patientTheme.colors.textPrimary }}>Personal Information</p>
        <div
          style={{
            background: patientTheme.colors.surface,
            borderRadius: patientTheme.radius.card,
            border: `1px solid ${patientTheme.colors.border}`,
            boxShadow: patientTheme.shadows.soft,
          }}
        >
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
        <div
          className="flex items-center gap-3 p-4"
          style={{
            background: patientTheme.colors.surface,
            borderRadius: patientTheme.radius.card,
            border: `1px solid ${patientTheme.colors.border}`,
            boxShadow: patientTheme.shadows.soft,
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: patientTheme.colors.surfaceSecondary, color: patientTheme.colors.textSecondary }}
          >
            <Watch size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: patientTheme.colors.textPrimary }}>MicroHealth Band</p>
            <p className="text-[11px] mt-0.5" style={{ color: patientTheme.colors.textMuted }}>
              {batteryLevel != null ? `Battery ${Math.round(batteryLevel)}%` : "Battery —"}
              {lastSynced ? ` · Synced ${lastSynced}` : ""}
            </p>
          </div>
          <StatusBadge status={connected ? "connected" : "pending"} />
          <button className="text-[13px] font-medium" style={{ color: patientTheme.colors.primaryGreen }}>
            Manage
          </button>
        </div>
      </section>

      {/* Settings */}
      <section>
        <p className="text-sm font-semibold mb-3" style={{ color: patientTheme.colors.textPrimary }}>Settings</p>
        <div
          style={{
            background: patientTheme.colors.surface,
            borderRadius: patientTheme.radius.card,
            border: `1px solid ${patientTheme.colors.border}`,
            boxShadow: patientTheme.shadows.soft,
          }}
        >
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
