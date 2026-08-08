import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { appointmentService } from "../../services/appointment.service";
import { patientService } from "../../services/patient.service";
import { staffService } from "../../services/staff.service";
import { useAuth } from "../../hooks/useAuth";
import { usePatientData } from "../../hooks/usePatientData";
import { success, error as showError, confirmAction } from "../../components/shared/SweetAlert";

const BTN_SHADOW = "0 6px 12px -2px rgba(15,125,122,0.35), inset 0 1px 0 rgba(255,255,255,0.2)";

const services = ["General Practice", "Antenatal Care", "Lab Tests", "Cardiology", "Dental"];
const units = ["MicroHealth Lekki", "MicroHealth Victoria Island", "MicroHealth Ikeja"];
const times = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

function BookAppointment() {
  const { user } = useAuth();
  const { refresh } = usePatientData();
  const patientId = user?.profile?.id;
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState({ service: "", unit: "", date: "", time: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      setError("Patient profile not loaded. Please log in again.");
      return;
    }
    setLoading(true);
    setError("");
    Promise.all([
      patientService.getById(patientId),
      staffService.list(),
    ])
      .then(([, s]) => {
        setStaff(s.filter((member: any) => member.status === "on-duty"));
      })
      .catch((err: any) => {
        setError(err?.message || "Could not load booking data");
        showError("Error", "Could not load booking data");
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  const steps = ["Service", "Unit", "Date & Time", "Confirm"];

  const handleConfirm = async () => {
    if (!patientId) return;
    const confirmed = await confirmAction(
      "Confirm Booking?",
      `Book ${selected.service} at ${selected.unit} on ${selected.date} at ${selected.time}?`,
      "Book Now"
    );
    if (!confirmed) return;
    setSubmitting(true);
    setError("");
    try {
      const doctor = staff.find(s => s.department?.toLowerCase().includes(selected.service.split(" ")[0].toLowerCase())) || staff[0];
      const dateObj = selected.date ? new Date(selected.date) : new Date();
      const dateStr = dateObj.toISOString().split("T")[0];
      await appointmentService.create({
        patientId,
        doctorId: doctor?.id,
        department: selected.service,
        scheduledDate: dateStr,
        scheduledTime: selected.time || "10:00",
        notes: selected.unit,
      });
      success("Appointment booked", "Your appointment has been scheduled");
      await refresh();
      navigate("/patient/appointments");
    } catch (err: any) {
      setError(err?.message || "Failed to book appointment");
      showError("Booking failed", err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const patientName = user ? `${user.firstName} ${user.lastName}` : "Loading...";

  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      label: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }),
      value: d.toISOString().split("T")[0],
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin" size={28} style={{ color: "#0F7D7A" }} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-4 max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                style={{
                  background: i + 1 < step ? "#0F7D7A" : i + 1 === step ? "linear-gradient(135deg, #0F7D7A, #0A5E5C)" : "#E5E7EB",
                  color: i + 1 <= step ? "#fff" : "#9CA3AF",
                  boxShadow: i + 1 === step ? "0 3px 8px rgba(15,125,122,0.35)" : "none",
                }}
              >
                {i + 1 < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">{s}</span>
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-px mx-1 mb-4" style={{ background: i + 1 < step ? "#0F7D7A" : "#E5E7EB" }} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl p-3 mb-4 flex items-center gap-2" style={{ background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.25)" }}>
          <AlertTriangle size={14} style={{ color: "#F59E0B" }} />
          <p className="text-xs" style={{ color: "#92400E" }}>{error}</p>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-foreground">Select Service</h3>
          {services.map(s => (
            <motion.button
              key={s}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(p => ({ ...p, service: s }))}
              className="w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all"
              style={{
                border: selected.service === s ? "2px solid #0F7D7A" : "1px solid rgba(0,0,0,0.08)",
                background: selected.service === s ? "#E6F7F6" : "var(--skeuo-card-gradient)",
                boxShadow: selected.service === s ? "var(--skeuo-shadow)" : "var(--skeuo-shadow-sm)",
              }}
            >
              <span className="text-sm font-bold text-foreground">{s}</span>
              {selected.service === s && <CheckCircle size={18} style={{ color: "#0F7D7A" }} />}
            </motion.button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-foreground">Select Unit</h3>
          {units.map(u => (
            <motion.button
              key={u}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(p => ({ ...p, unit: u }))}
              className="w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all"
              style={{
                border: selected.unit === u ? "2px solid #0F7D7A" : "1px solid rgba(0,0,0,0.08)",
                background: selected.unit === u ? "#E6F7F6" : "var(--skeuo-card-gradient)",
                boxShadow: selected.unit === u ? "var(--skeuo-shadow)" : "var(--skeuo-shadow-sm)",
              }}
            >
              <span className="text-sm font-bold text-foreground">{u}</span>
              {selected.unit === u && <CheckCircle size={18} style={{ color: "#0F7D7A" }} />}
            </motion.button>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground">Select Date & Time</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {next7Days.map(d => (
              <motion.button
                key={d.value}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(p => ({ ...p, date: d.value }))}
                className="py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: selected.date === d.value ? "linear-gradient(135deg, #0F7D7A, #0A5E5C)" : "var(--skeuo-card-gradient)",
                  color: selected.date === d.value ? "#fff" : "#374151",
                  boxShadow: selected.date === d.value ? "0 4px 10px rgba(15,125,122,0.3)" : "var(--skeuo-shadow-sm)",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                {d.label}
              </motion.button>
            ))}
          </div>
          <h4 className="text-sm font-bold text-foreground">Available Slots</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {times.map(t => (
              <motion.button
                key={t}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(p => ({ ...p, time: t }))}
                className="py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: selected.time === t ? "linear-gradient(135deg, #0F7D7A, #0A5E5C)" : "var(--skeuo-card-gradient)",
                  color: selected.time === t ? "#fff" : "#374151",
                  boxShadow: selected.time === t ? "0 4px 10px rgba(15,125,122,0.3)" : "var(--skeuo-shadow-sm)",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                {t}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground">Confirm Booking</h3>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(15,125,122,0.2)", boxShadow: "var(--skeuo-shadow)" }}>
            <div className="p-4" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
              <p className="text-white font-bold">{selected.service || "General Practice"}</p>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>{selected.unit || "No unit selected"}</p>
            </div>
            <div className="p-4 space-y-3 bg-white">
              {[
                ["Date", selected.date ? new Date(selected.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"],
                ["Time", selected.time || "—"],
                ["Patient", patientName],
                ["Reference", "APT-" + Math.floor(1000 + Math.random() * 9000)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-bold text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: BTN_SHADOW }}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Confirm Booking"}
          </motion.button>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-3 rounded-xl text-sm font-bold border transition-all"
            style={{ color: "#6B7280", borderColor: "rgba(0,0,0,0.1)", background: "var(--skeuo-card-gradient)" }}
            onClick={() => setStep(s => s - 1)}
          >
            ← Back
          </motion.button>
        )}
        {step < 4 && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: BTN_SHADOW }}
            onClick={() => setStep(s => s + 1)}
            disabled={(step === 1 && !selected.service) || (step === 2 && !selected.unit) || (step === 3 && (!selected.date || !selected.time))}
          >
            Continue →
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export default BookAppointment;
