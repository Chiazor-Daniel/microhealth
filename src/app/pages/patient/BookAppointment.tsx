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
import { patientTheme } from "../../patient/theme";

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
        <Loader2 className="animate-spin" size={28} style={{ color: patientTheme.colors.primaryGreen }} />
      </div>
    );
  }

  /** A selectable option card — raised surface, mint + green when chosen. */
  const OptionButton = ({ label, isSelected, onSelect }: { label: string; isSelected: boolean; onSelect: () => void }) => (
    <motion.button
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      className="mh-card w-full flex items-center justify-between p-4 text-left"
      style={
        isSelected
          ? {
              background: patientTheme.gradients.mint,
              borderColor: "rgba(134, 202, 158, 0.8)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(16,24,40,0.04), 0 10px 24px -8px rgba(22,101,52,0.20)",
            }
          : undefined
      }
    >
      <span className="text-sm font-semibold" style={{ color: patientTheme.colors.textPrimary }}>{label}</span>
      {isSelected && <CheckCircle size={18} style={{ color: patientTheme.colors.primaryGreen }} />}
    </motion.button>
  );

  /** A compact pick chip for dates and time slots. */
  const ChipButton = ({ label, isSelected, onSelect }: { label: string; isSelected: boolean; onSelect: () => void }) => (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={isSelected ? "mh-btn-primary py-2.5 text-[13px] font-semibold" : "mh-btn-secondary py-2.5 text-[13px] font-semibold"}
    >
      {label}
    </motion.button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-[22px] font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
        Book Appointment
      </h1>

      {/* Stepper */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => {
          const done = i + 1 < step;
          const current = i + 1 === step;
          return (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={done || current ? "mh-icon mh-icon-green w-8 h-8" : "mh-icon mh-icon-slate w-8 h-8"}
                  style={{ fontSize: 11.5, fontWeight: 700 }}
                >
                  {done ? <CheckCircle size={14} strokeWidth={2.6} /> : i + 1}
                </div>
                <span
                  className="text-center leading-none whitespace-nowrap"
                  style={{
                    fontSize: 10.5,
                    fontWeight: current ? 700 : 500,
                    color: current
                      ? patientTheme.colors.primaryDark
                      : done
                        ? patientTheme.colors.textSecondary
                        : patientTheme.colors.textMuted,
                  }}
                >
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex-1 h-[2px] mx-1 mb-5 rounded-full"
                  style={{ background: done ? patientTheme.colors.green300 : patientTheme.colors.hairline }}
                />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mh-pill mh-pill-amber px-3.5 py-2.5 flex items-center gap-2 w-full">
          <AlertTriangle size={14} />
          <p className="text-[12.5px]">{error}</p>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <h3 className="text-[15px] font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
            Select Service
          </h3>
          {services.map(s => (
            <OptionButton
              key={s}
              label={s}
              isSelected={selected.service === s}
              onSelect={() => setSelected(p => ({ ...p, service: s }))}
            />
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h3 className="text-[15px] font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
            Select Unit
          </h3>
          {units.map(u => (
            <OptionButton
              key={u}
              label={u}
              isSelected={selected.unit === u}
              onSelect={() => setSelected(p => ({ ...p, unit: u }))}
            />
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-[15px] font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
            Select Date & Time
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {next7Days.map(d => (
              <ChipButton
                key={d.value}
                label={d.label}
                isSelected={selected.date === d.value}
                onSelect={() => setSelected(p => ({ ...p, date: d.value }))}
              />
            ))}
          </div>

          <h4 className="text-[13px] font-semibold pt-1" style={{ color: patientTheme.colors.textSecondary }}>
            Available slots
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {times.map(t => (
              <ChipButton
                key={t}
                label={t}
                isSelected={selected.time === t}
                onSelect={() => setSelected(p => ({ ...p, time: t }))}
              />
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-[15px] font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
            Confirm Booking
          </h3>

          <div className="mh-card overflow-hidden">
            <div className="mh-green-card p-4" style={{ borderRadius: 0, boxShadow: "none", border: "none" }}>
              <p className="text-white font-semibold" style={{ letterSpacing: "-0.01em" }}>
                {selected.service || "General Practice"}
              </p>
              <p className="text-[13px] mt-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>
                {selected.unit || "No unit selected"}
              </p>
            </div>
            <div className="p-4 space-y-3">
              {[
                ["Date", selected.date ? new Date(selected.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"],
                ["Time", selected.time || "—"],
                ["Patient", patientName],
                ["Reference", "APT-" + Math.floor(1000 + Math.random() * 9000)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span style={{ color: patientTheme.colors.textSecondary }}>{k}</span>
                  <span className="font-semibold" style={{ color: patientTheme.colors.textPrimary }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            className="mh-btn-primary w-full py-3.5 text-sm font-semibold"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Confirm Booking"}
          </button>
        </div>
      )}

      <div className="flex gap-3">
        {step > 1 && (
          <button
            className="mh-btn-secondary flex-1 py-3 text-sm font-semibold"
            onClick={() => setStep(s => s - 1)}
          >
            ← Back
          </button>
        )}
        {step < 4 && (
          <button
            className="mh-btn-primary flex-1 py-3 text-sm font-semibold"
            onClick={() => setStep(s => s + 1)}
            disabled={(step === 1 && !selected.service) || (step === 2 && !selected.unit) || (step === 3 && (!selected.date || !selected.time))}
          >
            Continue →
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default BookAppointment;
