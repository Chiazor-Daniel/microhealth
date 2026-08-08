import React, { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Bell, MessageSquare, Lock, Shield, ChevronRight, Users, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { usePatientData } from "../../hooks/usePatientData";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { confirmAction, success } from "../../components/shared/SweetAlert";

function PatientProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { prescriptions, appointments, vitals, loading: dataLoading, error: dataError } = usePatientData();
  const [profile] = useState<any>(user?.profile || null);
  const [loading] = useState(!user?.profile);
  const [error] = useState<string | null>(null);

  const initials = user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() : "??";
  const fullName = user ? `${user.firstName} ${user.lastName}` : "Loading...";

  const sections = [
    {
      title: "Family",
      items: [{ icon: Users, label: "My Family", onClick: () => navigate("/patient/family") }],
    },
    {
      title: "Health Summary",
      items: [
        { icon: Bell, label: `Appointments (${appointments.length})`, onClick: () => navigate("/patient/appointments") },
        { icon: MessageSquare, label: `Prescriptions (${prescriptions.length})`, onClick: () => navigate("/patient/prescriptions") },
        { icon: Shield, label: `Vital Records (${vitals.length})`, onClick: () => navigate("/patient/vitals") },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        { icon: Lock, label: "Change Password" },
        { icon: Shield, label: "Privacy Settings" },
      ],
    },
  ];

  if (loading || dataLoading) return <Loading />;
  if (error || dataError) return <ErrorState message={error || dataError || "Failed to load profile"} />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-4 space-y-4 max-w-3xl mx-auto">
      <div
        className="rounded-2xl p-5 text-center"
        style={{
          background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)",
          boxShadow: "0 8px 24px rgba(15,125,122,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-3"
          style={{ background: "rgba(255,255,255,0.15)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)" }}
        >
          {initials}
        </div>
        <p className="text-lg font-bold text-white">{fullName}</p>
        {user?.email && <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>{user.email}</p>}
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>
          {profile?.bloodGroup && `Blood: ${profile.bloodGroup}`} · {profile?.age && `${profile.age}y`} · {profile?.gender}
        </p>
      </div>

      {sections.map(({ title, items }) => (
        <div
          key={title}
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 pt-3 pb-1">{title}</p>
          {items.map((item, j) => (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all"
              style={{ borderTop: j > 0 ? "1px solid rgba(0,0,0,0.05)" : "none" }}
              onClick={item.onClick}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#E6F7F6" }}>
                <item.icon size={14} style={{ color: "#0F7D7A" }} />
              </div>
              <span className="flex-1 text-sm font-bold text-foreground">{item.label}</span>
              <ChevronRight size={14} className="text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      ))}

      <motion.button
        whileTap={{ scale: 0.97 }}
        className="w-full py-3.5 rounded-2xl text-sm font-bold border transition-all"
        style={{ color: "#EF4444", borderColor: "rgba(239,68,68,0.2)", background: "#FEF2F2", boxShadow: "var(--skeuo-shadow-sm)" }}
        onClick={async () => {
          const confirmed = await confirmAction("Sign Out?", "You will be returned to the patient login page.");
          if (!confirmed) return;
          logout();
          success("Signed out", "See you soon");
          navigate("/patient/login");
        }}
      >
        Sign Out
      </motion.button>
    </motion.div>
  );
}

export default PatientProfilePage;
