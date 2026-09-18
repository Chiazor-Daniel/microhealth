import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../../hooks/useAuth";
import { useWearable } from "../hooks/useWearable";
import { confirmAction } from "../../components/shared/SweetAlert";
import { Avatar } from "../components/Avatar";
import { patientTheme } from "../theme";
import {
  PersonIcon,
  WatchIcon,
  BellIcon,
  SecurityIcon,
  EmergencyIcon,
  HelpIcon,
  LogOutIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  type GlyphProps,
} from "../icons";

/** A settings row: outlined glyph, label, and the row's own affordance. */
function MenuRow({
  icon: Icon,
  label,
  sublabel,
  onClick,
  danger,
  last,
}: {
  icon: (p: GlyphProps) => React.ReactElement;
  label: string;
  sublabel?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const color = danger ? patientTheme.colors.error : patientTheme.colors.textPrimary;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left"
      style={{ borderTop: last ? "none" : `1px solid ${patientTheme.colors.hairlineSoft}` }}
    >
      <span className="flex-shrink-0" style={{ color: danger ? patientTheme.colors.error : patientTheme.colors.textSecondary }}>
        <Icon size={21} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-medium truncate" style={{ color }}>
          {label}
        </span>
        {sublabel && <span className="block text-[12.5px] mt-0.5">{sublabel}</span>}
      </span>
      <span className="flex-shrink-0" style={{ color: patientTheme.colors.textMuted }}>
        <ChevronRightIcon size={17} />
      </span>
    </button>
  );
}

/** Patient IDs are quoted as MH-XXXXXX; a raw uuid fragment tells nobody anything. */
function patientId(user: any) {
  const raw: string | undefined = user?.profile?.id ?? user?.id;
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  const source = digits.length >= 5 ? digits : raw.replace(/-/g, "");
  let hash = 0;
  for (let i = 0; i < source.length; i++) hash = (hash * 31 + source.charCodeAt(i)) % 1000000;
  return `MH-${String(hash).padStart(6, "0")}`;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { connected, batteryLevel, lastSynced } = useWearable(user?.profile?.id, true);

  const fullName = user ? `${user.firstName} ${user.lastName}` : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Back sits alone on the left; the identity is the header */}
      <div className="flex items-center h-9">
        <button
          onClick={() => navigate("/patient/home")}
          aria-label="Back to home"
          className="flex items-center justify-center w-9 h-9 -ml-2"
          style={{ color: patientTheme.colors.textPrimary }}
        >
          <ChevronLeftIcon size={22} />
        </button>
      </div>

      {/* Identity */}
      <div className="text-center">
        <Avatar seed={user?.profile?.id ?? user?.email} name={fullName} size={84} className="mx-auto" />
        <p className="text-[19px] font-semibold mt-3.5" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.02em" }}>
          {fullName || "Loading…"}
        </p>
        <p className="text-[13px] mt-1" style={{ color: patientTheme.colors.textSecondary }}>
          Patient ID: {patientId(user)}
        </p>
      </div>

      {/* Everything you can reach from here, in one card */}
      <div className="mh-card overflow-hidden">
        <MenuRow icon={PersonIcon} label="Personal Information" onClick={() => navigate("/patient/family")} />
        <MenuRow
          icon={WatchIcon}
          label="Wearable & Devices"
          sublabel={
            <span className="flex items-center gap-1.5" style={{ color: patientTheme.colors.textSecondary }}>
              {connected ? "Connected" : "Not connected"}
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: connected ? patientTheme.colors.primaryGreen : patientTheme.colors.textMuted,
                  display: "inline-block",
                }}
              />
            </span>
          }
          onClick={() => navigate("/patient/vitals")}
        />
        <MenuRow icon={BellIcon} label="Notifications" onClick={() => navigate("/patient/notifications")} />
        <MenuRow icon={EmergencyIcon} label="Emergency Information" onClick={() => navigate("/patient/family")} />
        <MenuRow icon={SecurityIcon} label="Security & Privacy" onClick={() => navigate("/patient/family")} />
        <MenuRow
          icon={HelpIcon}
          label="Help & Support"
          onClick={() => navigate("/patient/care/messages")}
          last
        />
      </div>

      {/* The device itself, as its own quiet card */}
      <div className="mh-card flex items-center gap-3.5 p-4">
        <span
          className="mh-icon flex items-center justify-center flex-shrink-0"
          style={{ width: 52, height: 52, color: patientTheme.colors.primaryDark, background: patientTheme.gradients.tile }}
        >
          <WatchIcon size={25} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px]" style={{ color: patientTheme.colors.textSecondary }}>
            Connected Device
          </p>
          <p className="text-[14px] font-semibold mt-0.5" style={{ color: patientTheme.colors.textPrimary }}>
            MicroHealth Band
          </p>
          <p className="text-[12.5px] mt-0.5" style={{ color: patientTheme.colors.textSecondary }}>
            {batteryLevel != null ? `Battery ${Math.round(batteryLevel)}%` : "Battery —"}
            {lastSynced ? ` • Synced ${lastSynced}` : ""}
          </p>
        </div>
        <span className="flex-shrink-0" style={{ color: patientTheme.colors.textMuted }}>
          <ChevronRightIcon size={17} />
        </span>
      </div>

      {/* The one destructive action, deliberately on its own */}
      <div className="mh-card overflow-hidden">
        <MenuRow
          icon={LogOutIcon}
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
    </motion.div>
  );
}
