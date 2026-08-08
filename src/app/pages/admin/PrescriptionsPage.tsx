import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, Pill } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { PrimaryBtn } from "../../components/shared/Buttons";
import { TableCard, Th, Td, TrHover, InitialsAvatar } from "../../components/shared/TableComponents";
import { SkeletonCard, SkeletonTable } from "../../components/shared/Skeleton";
import { ErrorState } from "../../components/shared/ErrorState";
import StatusPill from "../../components/shared/StatusPill";
import { Modal } from "../../components/shared/Modal";
import { FormInput, FormSelect } from "../../components/shared/FormInput";
import { prescriptionService } from "../../services/prescription.service";
import { patientService } from "../../services/patient.service";
import { staffService } from "../../services/staff.service";
import { error as showError, success, confirmAction } from "../../components/shared/SweetAlert";

const tabs = ["all", "pending", "dispensed", "expired"];
const STATUSES = [{ value: "pending", label: "Pending" }, { value: "dispensed", label: "Dispensed" }, { value: "expired", label: "Expired" }];

function PrescriptionsPage() {
  const [tab, setTab] = useState("all");
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ patientId: "", doctorId: "", medicine: "", dosage: "", duration: "", status: "pending" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([prescriptionService.list(), patientService.list(), staffService.list()])
      .then(([rxData, pData, sData]) => {
        setPrescriptions(rxData);
        setPatients(pData);
        setStaff(sData);
      })
      .catch(err => setError(err.message || "Failed to load prescriptions"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = tab === "all" ? prescriptions : prescriptions.filter(r => r.status === tab);

  const getPatientName = (r: any) => r.patient?.user ? `${r.patient.user.firstName} ${r.patient.user.lastName}` : r.patient?.name || "Unknown";
  const getDoctorName = (r: any) => r.doctor?.user ? `${r.doctor.user.firstName} ${r.doctor.user.lastName}` : r.doctor?.name || "—";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.doctorId || !form.medicine || !form.dosage) {
      showError("Validation", "Patient, doctor, medicine and dosage are required");
      return;
    }
    const confirmed = await confirmAction("Create prescription?", `Prescribe ${form.medicine} for the selected patient?`, "Create");
    if (!confirmed) return;
    setSaving(true);
    try {
      await prescriptionService.create({
        patientId: form.patientId,
        doctorId: form.doctorId,
        medicine: form.medicine,
        dosage: form.dosage,
        duration: form.duration,
        status: form.status,
      });
      success("Prescription created");
      setModalOpen(false);
      setForm({ patientId: "", doctorId: "", medicine: "", dosage: "", duration: "", status: "pending" });
      load();
    } catch (err: any) {
      showError("Create failed", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message={error} />;

  const patientOptions = patients.map(p => ({ value: p.id, label: p.user ? `${p.user.firstName} ${p.user.lastName}` : p.patientCode }));
  const doctorOptions = staff.map(s => ({ value: s.id, label: s.user ? `${s.user.firstName} ${s.user.lastName}` : s.role }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-4">
      <PageHeader title="Prescriptions" subtitle="Manage and track all issued prescriptions"
        action={<PrimaryBtn icon={Plus} onClick={() => setModalOpen(true)}>New Prescription</PrimaryBtn>}
      />
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "#F3F4F6", boxShadow: "var(--skeuo-shadow-inset)" }}>
        {tabs.map(t => (
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
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <TableCard title={loading ? "" : `${filtered.length} Prescriptions`}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Rx ID</Th><Th>Patient</Th><Th>Medicine</Th><Th>Dosage</Th><Th>Doctor</Th><Th>Issued</Th><Th>Status</Th></tr></thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={5} cols={7} />
            ) : (
              <>
                {filtered.map(rx => (
                  <TrHover key={rx.id}>
                    <Td><span className="font-mono text-xs text-muted-foreground">{rx.id?.slice(0, 8)}</span></Td>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <InitialsAvatar name={getPatientName(rx)} size="sm" />
                        <span className="font-semibold text-foreground">{getPatientName(rx)}</span>
                      </div>
                    </Td>
                    <Td className="text-foreground font-semibold">{rx.medicine}</Td>
                    <Td className="text-muted-foreground">{rx.dosage}</Td>
                    <Td className="text-muted-foreground whitespace-nowrap">{getDoctorName(rx)}</Td>
                    <Td className="text-muted-foreground whitespace-nowrap">{rx.createdAt ? new Date(rx.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</Td>
                    <Td><StatusPill status={rx.status} /></Td>
                  </TrHover>
                ))}
                {filtered.length === 0 && <tr><Td colSpan={7} className="text-center py-12 text-muted-foreground">
                  <Pill size={28} className="mx-auto mb-2 opacity-40" />No prescriptions.
                </Td></tr>}
              </>
            )}
          </tbody>
        </table>
      </TableCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Prescription" size="md">
        <form onSubmit={handleCreate}>
          <FormSelect label="Patient" value={form.patientId} onChange={v => setForm({ ...form, patientId: v })} options={patientOptions} required />
          <FormSelect label="Doctor" value={form.doctorId} onChange={v => setForm({ ...form, doctorId: v })} options={doctorOptions} required />
          <FormInput label="Medicine" value={form.medicine} onChange={v => setForm({ ...form, medicine: v })} required />
          <FormInput label="Dosage" value={form.dosage} onChange={v => setForm({ ...form, dosage: v })} placeholder="e.g. 1 tablet twice daily" required />
          <FormInput label="Duration" value={form.duration} onChange={v => setForm({ ...form, duration: v })} placeholder="e.g. 7 days" />
          <FormSelect label="Status" value={form.status} onChange={v => setForm({ ...form, status: v })} options={STATUSES} />
          <div className="flex gap-3 mt-2">
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border" style={{ color: "#6B7280", borderColor: "rgba(0,0,0,0.1)", background: "var(--skeuo-card-gradient)" }}>Cancel</motion.button>
            <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 6px 12px -2px rgba(15,125,122,0.35), inset 0 1px 0 rgba(255,255,255,0.2)" }}>{saving ? "Saving…" : "Save Prescription"}</motion.button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

export default PrescriptionsPage;
