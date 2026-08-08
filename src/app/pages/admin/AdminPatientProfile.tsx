import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { ChevronRight, Pencil, Heart, Activity, Thermometer, Zap, Loader2, Stethoscope } from "lucide-react";
import StatusPill from "../../components/shared/StatusPill";
import { GhostBtn } from "../../components/shared/Buttons";
import { TableCard, Th, Td, TrHover } from "../../components/shared/TableComponents";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { patientService } from "../../services/patient.service";
import { vitalService } from "../../services/vital.service";
import { prescriptionService } from "../../services/prescription.service";
import { labService } from "../../services/lab.service";

function AdminPatientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState("vitals");
  const [patient, setPatient] = useState<any>(null);
  const [vitals, setVitals] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      patientService.getById(id),
      vitalService.getByPatient(id).catch(() => []),
      prescriptionService.getByPatient(id).catch(() => []),
      labService.getByPatient(id).catch(() => []),
    ])
      .then(([patientData, vitalsData, rxData, labData]) => {
        setPatient(patientData);
        setVitals(Array.isArray(vitalsData) ? vitalsData : []);
        setPrescriptions(Array.isArray(rxData) ? rxData : []);
        setLabs(Array.isArray(labData) ? labData : []);
      })
      .catch(err => setError(err.message || "Failed to load patient profile"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!patient) return null;

  const p = patient;
  const getName = (obj: any) => obj?.user ? `${obj.user.firstName} ${obj.user.lastName}` : obj?.name || "Unknown";
  const patientName = getName(p);
  const latestVital = vitals.length > 0 ? vitals[0] : null;

  const vitalCards = [
    { label: "Blood Pressure", value: latestVital ? `${latestVital.bloodPressureSystolic || "—"}/${latestVital.bloodPressureDiastolic || "—"}` : "—", unit: "mmHg", status: latestVital && (latestVital.bloodPressureSystolic > 140 || latestVital.bloodPressureDiastolic > 90) ? "warning" : "normal", icon: Heart },
    { label: "Heart Rate", value: latestVital?.heartRate ?? "—", unit: "bpm", status: latestVital?.heartRate && (latestVital.heartRate > 100 || latestVital.heartRate < 60) ? "warning" : "normal", icon: Activity },
    { label: "Temperature", value: latestVital?.temperature ?? "—", unit: "°C", status: latestVital?.temperature && (Number(latestVital.temperature) > 37.8 || Number(latestVital.temperature) < 36.1) ? "warning" : "normal", icon: Thermometer },
    { label: "SpO₂", value: latestVital?.spo2 != null ? `${latestVital.spo2}%` : "—", unit: "oxygen sat", status: latestVital?.spo2 != null && latestVital.spo2 < 94 ? "warning" : "normal", icon: Zap },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <button onClick={() => navigate("/admin/patients")} className="hover:text-foreground transition-colors">Patients</button>
        <ChevronRight size={14} />
        <span className="text-foreground font-bold">{patientName}</span>
      </div>

      <div
        className="rounded-2xl p-6 flex flex-col lg:flex-row items-start gap-6"
        style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #E6F7F6, #B2E8E6)",
            color: "#0F7D7A",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 4px 12px rgba(15,125,122,0.25)",
          }}
        >
          {patientName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Full Name", value: patientName },
            { label: "Patient ID", value: p.patientCode || p.id?.slice(0, 8) },
            { label: "Age / Gender", value: `${p.age || "—"}y, ${p.gender === "F" ? "Female" : p.gender === "M" ? "Male" : p.gender || "—"}` },
            { label: "Blood Group", value: p.bloodGroup || "—" },
            { label: "Phone", value: p.user?.phone || "—" },
            { label: "Email", value: p.user?.email || "—" },
            { label: "Current Ward", value: p.ward || "—" },
            { label: "Attending Doctor", value: p.doctor?.user ? `${p.doctor.user.firstName} ${p.doctor.user.lastName}` : p.doctor?.name || "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-bold text-muted-foreground">{label}</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <StatusPill status={p.status} />
          <GhostBtn icon={Pencil}>Edit</GhostBtn>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "#F3F4F6", boxShadow: "var(--skeuo-shadow-inset)" }}>
        {["vitals", "prescriptions", "labs", "history"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-bold rounded-lg capitalize transition-all"
            style={{
              background: tab === t ? "linear-gradient(180deg, #FFFFFF 0%, #F0FAFA 100%)" : "transparent",
              color: tab === t ? "#0F7D7A" : "#6B7280",
              boxShadow: tab === t ? "var(--skeuo-shadow-sm)" : "none",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "vitals" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {vitalCards.map(({ label, value, unit, status, icon: Icon }) => (
            <motion.div
              key={label}
              whileHover={{ y: -3 }}
              className="rounded-2xl p-4"
              style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: status === "warning" ? "#FFFBEB" : "#E6F7F6" }}>
                  <Icon size={15} style={{ color: status === "warning" ? "#F59E0B" : "#0F7D7A" }} />
                </div>
                <StatusPill status={status === "warning" ? "pending" : "active"} />
              </div>
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-xs font-bold text-foreground mt-0.5">{label}</div>
              <div className="text-xs text-muted-foreground">{unit}</div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "prescriptions" && (
        <TableCard title="Active Prescriptions">
          <table className="w-full text-sm">
            <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Medicine</Th><Th>Dosage</Th><Th>Duration</Th><Th>Status</Th></tr></thead>
            <tbody>
              {prescriptions.map(rx => (
                <TrHover key={rx.id}>
                  <Td className="font-semibold text-foreground">{rx.medicine}</Td>
                  <Td className="text-muted-foreground">{rx.dosage}</Td>
                  <Td className="text-muted-foreground">{rx.duration || "—"}</Td>
                  <Td><StatusPill status={rx.status} /></Td>
                </TrHover>
              ))}
              {prescriptions.length === 0 && <tr><Td colSpan={4} className="text-center py-10 text-muted-foreground">No prescriptions.</Td></tr>}
            </tbody>
          </table>
        </TableCard>
      )}

      {tab === "labs" && (
        <TableCard title="Lab Results">
          <table className="w-full text-sm">
            <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Test</Th><Th>Ordered</Th><Th>Status</Th><Th>Result</Th></tr></thead>
            <tbody>
              {labs.map(l => (
                <TrHover key={l.id}>
                  <Td className="font-semibold text-foreground">{l.testName || "—"}</Td>
                  <Td className="text-muted-foreground whitespace-nowrap">{l.createdAt ? new Date(l.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</Td>
                  <Td><StatusPill status={l.status} /></Td>
                  <Td className="text-muted-foreground">{l.result || l.resultNotes || "—"}</Td>
                </TrHover>
              ))}
              {labs.length === 0 && <tr><Td colSpan={4} className="text-center py-10 text-muted-foreground">No lab records.</Td></tr>}
            </tbody>
          </table>
        </TableCard>
      )}

      {tab === "history" && (
        <div className="rounded-2xl p-5" style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 className="text-base font-bold text-foreground mb-4">Visit History</h3>
          {vitals.length > 0 ? (
            <div className="space-y-2">
              {vitals.slice(0, 6).map((v, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl" style={{ background: "#F8F9FA" }}>
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#0F7D7A" }} />
                  </div>
                  <p className="text-sm text-foreground">
                    {new Date(v.recordedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} — Vital signs recorded. BP {v.bloodPressureSystolic || "—"}/{v.bloodPressureDiastolic || "—"}, HR {v.heartRate || "—"}.
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Stethoscope size={28} className="mb-2 opacity-40" />
              <p className="text-sm">No visit history available.</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default AdminPatientProfile;
