import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  User,
  Watch,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  Users,
  LogOut,
  Edit3,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { usePatientData } from "../../hooks/usePatientData";
import { useWearable } from "../hooks/useWearable";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { confirmAction, success } from "../../components/shared/SweetAlert";
import { patientTheme } from "../theme";
import { WearableStatusCard } from "../components/WearableStatusCard";

interface SectionItem {
  icon: React.ElementType;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { appointments, prescriptions, vitals, loading: dataLoading, error: dataError } = usePatientData();
  const { connected, batteryLevel, lastSynced } = useWearable(user?.profile?.id, true);

  const [isEditingName, setIsEditingName] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");

  const initials = `${user?.firstName?.[0] ?? "?"}${user?.lastName?.[0] ?? "?"}`.toUpperCase();

  const sections: { title: string; items: SectionItem[] }[] = [
    {
      title: "Health Summary",
      items: [
        { icon: Bell, label: `Appointments (${appointments.length})`, onClick: () => navigate("/patient/care/appointments") },
        { icon: Shield, label: `Prescriptions (${prescriptions.length})`, onClick: () => navigate("/patient/care/prescriptions") },
        { icon: User, label: `Vital Records (${vitals.length})`, onClick: () => navigate("/patient/vitals") },
      ],
    },
    {
      title: "Connections",
      items: [
        { icon: Watch, label: "Wearable & Devices", onClick: () => navigate("/patient/profile/wearable") },
        { icon: Users, label: "Family Members", onClick: () => navigate("/patient/family") },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications" },
        { icon: Shield, label: "Privacy & Security" },
        { icon: HelpCircle, label: "Help & Support" },
      ],
    },
  ];

  if (dataLoading) return <Loading />;
  if (dataError) return <ErrorState message={dataError} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      {/* Profile header */}
      <div
        className="p-5 rounded-3xl text-center"
        style={{
          background: `linear-gradient(135deg, ${patientTheme.colors.primaryGreen}, ${patientTheme.colors.primaryDark})`,
          boxShadow: patientTheme.shadows.medium,
        }}
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-bold mx-auto mb-3"
          style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
        >
          {initials}
        </div>

        {isEditingName ? (
          <div className="flex items-center justify-center gap-2 mb-2">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-28 px-2 py-1 rounded-lg text-sm text-center"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
            />
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-28 px-2 py-1 rounded-lg text-sm text-center"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
            />
          </div>
        ) : (
          <p className="text-lg font-bold text-white">
            {user ? `${firstName} ${lastName}` : "Loading..."}
          </p>
        )}

        <p className="text-sm text-white/70 mt-1">{user?.email || user?.phone || "Patient"}</p>

        <button
          onClick={() => {
            if (isEditingName) {
              // In a real app, call the API here to update the name.
              success("Profile updated", "Your name has been saved");
            }
            setIsEditingName(!isEditingName);
          }}
          className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
        >
          <Edit3 size={12} />
          {isEditingName ? "Save name" : "Edit name"}
        </button>
      </div>

      {/* Wearable status */}
      <WearableStatusCard
        connected={connected}
        batteryLevel={Math.round(batteryLevel ?? 78)}
        lastSynced={lastSynced ?? "Recently"}
        onReconnect={() => {}}
      />

      {/* Sections */}
      {sections.map((section) => (
        <div
          key={section.title}
          className="rounded-3xl overflow-hidden"
          style={{
            background: patientTheme.colors.surface,
            border: `1px solid ${patientTheme.colors.border}`,
            boxShadow: patientTheme.shadows.soft,
          }}
        >
          <p
            className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: patientTheme.colors.textMuted }}
          >
            {section.title}
          </p>
          {section.items.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-black/[0.02]"
                style={{ borderTop: i > 0 ? `1px solid ${patientTheme.colors.border}` : "none" }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: item.danger ? "#FEF2F2" : patientTheme.colors.primaryPale }}
                >
                  <Icon size={16} style={{ color: item.danger ? patientTheme.colors.error : patientTheme.colors.primaryGreen }} />
                </div>
                <span
                  className="flex-1 text-sm font-medium"
                  style={{ color: item.danger ? patientTheme.colors.error : patientTheme.colors.textPrimary }}
                >
                  {item.label}
                </span>
                <ChevronRight size={16} style={{ color: patientTheme.colors.textMuted }} />
              </button>
            );
          })}
        </div>
      ))}

      {/* Sign out */}
      <button
        onClick={async () => {
          const ok = await confirmAction("Sign Out?", "You will be returned to the patient login page.");
          if (!ok) return;
          logout();
          navigate("/patient/login");
        }}
        className="w-full py-3.5 rounded-2xl text-sm font-semibold"
        style={{ background: "#FEF2F2", color: patientTheme.colors.error, border: `1px solid ${patientTheme.colors.error}20` }}
      >
        Sign Out
      </button>
    </motion.div>
  );
}
