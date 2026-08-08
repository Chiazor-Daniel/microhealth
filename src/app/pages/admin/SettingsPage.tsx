import React, { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle, Lock, KeyRound, SmartphoneNfc, Building2, Home, MapPin, Phone } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { PrimaryBtn, GhostBtn } from "../../components/shared/Buttons";
import { useAuth } from "../../hooks/useAuth";
import { success, confirmAction } from "../../components/shared/SweetAlert";

function SettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [unit, setUnit] = useState({
    facilityName: "MicroHealth General",
    unitName: "General Ward A",
    address: "",
    phone: "",
  });

  const initials = user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() : "";
  const displayName = user ? `${user.firstName} ${user.lastName}` : "";
  const email = user?.email || "";
  const roleLabel = user?.role === "admin" ? "Administrator" : "Clinical Staff";

  const handleSave = async () => {
    const confirmed = await confirmAction("Save changes?", "Update your profile and preferences?", "Save");
    if (!confirmed) return;
    setSaved(true);
    success("Changes saved");
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-4 max-w-3xl">
      <PageHeader title="Settings" subtitle="Manage your profile and system preferences" />
      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-xl text-sm font-bold"
          style={{ background: "#ECFDF5", color: "#065F46", border: "1px solid rgba(16,185,129,0.2)", boxShadow: "var(--skeuo-shadow-sm)" }}
        >
          <CheckCircle size={16} style={{ color: "#10B981" }} /> Changes saved successfully.
        </motion.div>
      )}

      <div className="rounded-2xl p-6 space-y-5" style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}>
        <h3 className="text-base font-bold text-foreground">Unit Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Facility Name", value: unit.facilityName, icon: Building2, key: "facilityName" },
            { label: "Unit Name", value: unit.unitName, icon: Home, key: "unitName" },
            { label: "Facility Address", value: unit.address, icon: MapPin, key: "address" },
            { label: "Contact Phone", value: unit.phone, icon: Phone, key: "phone" },
          ].map(({ label, value, icon: Icon, key }) => (
            <div key={label}>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">{label}</label>
              <div className="relative">
                <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none transition-all focus:ring-2"
                  style={{
                    background: "var(--skeuo-input-gradient)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    boxShadow: "var(--skeuo-shadow-inset)",
                    color: "#374151",
                  }}
                  value={value}
                  onChange={e => setUnit({ ...unit, [key]: e.target.value })}
                  placeholder={`Enter ${label.toLowerCase()}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-6 space-y-4" style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}>
        <h3 className="text-base font-bold text-foreground">User Profile</h3>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
            style={{
              background: "linear-gradient(135deg, #E6F7F6, #B2E8E6)",
              color: "#0F7D7A",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 4px 12px rgba(15,125,122,0.25)",
              border: "1px solid rgba(15,125,122,0.15)",
            }}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{roleLabel} · {user?.profile?.department || "General Medicine"}</p>
            <button className="text-xs font-bold mt-1.5" style={{ color: "#0F7D7A" }}>Change photo</button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Display Name", value: displayName },
            { label: "Email Address", value: email },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">{label}</label>
              <input
                className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all focus:ring-2"
                style={{
                  background: "var(--skeuo-input-gradient)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "var(--skeuo-shadow-inset)",
                }}
                defaultValue={value}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-6 space-y-4" style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}>
        <h3 className="text-base font-bold text-foreground">Security</h3>
        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#F8F9FA", boxShadow: "var(--skeuo-shadow-sm)" }}>
          <div className="flex items-center gap-3">
            <Lock size={15} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-bold text-foreground">Password</p>
              <p className="text-xs text-muted-foreground">Update from your profile page</p>
            </div>
          </div>
          <GhostBtn icon={KeyRound}>Change</GhostBtn>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#E6F7F6", boxShadow: "var(--skeuo-shadow-sm)" }}>
          <div className="flex items-center gap-3">
            <SmartphoneNfc size={15} style={{ color: "#0F7D7A" }} />
            <div>
              <p className="text-sm font-bold text-foreground">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Disabled in this environment</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#F3F4F6", color: "#6B7280" }}>Disabled</span>
        </div>
      </div>

      <PrimaryBtn onClick={handleSave}>Save Changes</PrimaryBtn>
    </motion.div>
  );
}

export default SettingsPage;
