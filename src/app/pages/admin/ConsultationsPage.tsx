import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, Stethoscope } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { PrimaryBtn } from "../../components/shared/Buttons";
import { TableCard, Th, Td, TrHover, InitialsAvatar } from "../../components/shared/TableComponents";
import { SkeletonCard, SkeletonTable } from "../../components/shared/Skeleton";
import { ErrorState } from "../../components/shared/ErrorState";
import StatusPill from "../../components/shared/StatusPill";
import { Modal } from "../../components/shared/Modal";
import { FormInput, FormSelect, FormTextarea } from "../../components/shared/FormInput";
import { appointmentService } from "../../services/appointment.service";
import { patientService } from "../../services/patient.service";
import { staffService } from "../../services/staff.service";
import { error as showError, success, confirmAction } from "../../components/shared/SweetAlert";

const TYPES = ["Follow-up", "New Consult", "Emergency", "Review"];

function ConsultationsPage() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ patientId: "", doctorId: "", type: "Follow-up", notes: "", scheduledDate: "", scheduledTime: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      appointmentService.list({ status: "completed" }),
      patientService.list(),
      staffService.list(),
    ])
      .then(([appts, pats, s]) => {
        setConsultations(appts);
        setPatients(pats);
        setStaff(s);
      })
      .catch(err => setError(err.message || "Failed to load consultations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const getPatientName = (c: any) => c.patient?.user ? `${c.patient.user.firstName} ${c.patient.user.lastName}` : c.patient?.name || "Unknown";
  const getDoctorName = (c: any) => c.doctor?.user ? `${c.doctor.user.firstName} ${c.doctor.user.lastName}` : c.doctor?.name || "—";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.doctorId || !form.scheduledDate) {
      showError("Validation", "Patient, doctor and date are required");
      return;
    }
    const confirmed = await confirmAction("Log consultation?", "Record this consultation for the selected patient?", "Log");
    if (!confirmed) return;
    setSaving(true);
    try {
      await appointmentService.create({
        patientId: form.patientId,
        doctorId: form.doctorId,
        department: form.type,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime || "09:00",
        notes: form.notes,
        status: "completed",
      });
      success("Consultation logged");
      setModalOpen(false);
      setForm({ patientId: "", doctorId: "", type: "Follow-up", notes: "", scheduledDate: "", scheduledTime: "" });
      load();
    } catch (err: any) {
      showError("Log failed", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message={error} />;

  const patientOptions = patients.map(p => ({ value: p.id, label: p.user ? `${p.user.firstName} ${p.user.lastName}` : p.patientCode }));
  const doctorOptions = staff.map(s => ({ value: s.id, label: s.user ? `${s.user.firstName} ${s.user.lastName}` : s.role }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-4">
      <PageHeader title="Consultations" subtitle="All clinical visits and diagnoses"
        action={<PrimaryBtn icon={Plus} onClick={() => setModalOpen(true)}>Log Consultation</PrimaryBtn>}
      />
      <TableCard title="Consultation Records">
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <tr><Th>Patient</Th><Th>Provider</Th><Th>Type</Th><Th>Notes</Th><Th>Date</Th><Th>Status</Th></tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={5} cols={6} />
            ) : (
              <>
                {consultations.map((c, i) => (
                  <TrHover key={c.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <InitialsAvatar name={getPatientName(c)} size="sm" />
                        <span className="font-semibold text-foreground">{getPatientName(c)}</span>
                      </div>
                    </Td>
                    <Td className="text-muted-foreground whitespace-nowrap">{getDoctorName(c)}</Td>
                    <Td className="text-muted-foreground"><span className="px-2 py-1 rounded-lg text-xs font-bold" style={{ background: "#E6F7F6", color: "#0A5E5C" }}>{TYPES[i % TYPES.length]}</span></Td>
                    <Td className="text-foreground max-w-40 truncate">{c.notes || c.diagnosis || "—"}</Td>
                    <Td className="text-muted-foreground whitespace-nowrap">{c.scheduledDate ? new Date(c.scheduledDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</Td>
                    <Td><StatusPill status={c.status} /></Td>
                  </TrHover>
                ))}
                {consultations.length === 0 && (
                  <tr><Td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Stethoscope size={28} className="mx-auto mb-2 opacity-40" />
                    No completed consultations yet.
                  </Td></tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </TableCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Consultation" size="md">
        <form onSubmit={handleCreate}>
          <FormSelect label="Patient" value={form.patientId} onChange={v => setForm({ ...form, patientId: v })} options={patientOptions} required />
          <FormSelect label="Provider" value={form.doctorId} onChange={v => setForm({ ...form, doctorId: v })} options={doctorOptions} required />
          <FormSelect label="Type" value={form.type} onChange={v => setForm({ ...form, type: v })} options={TYPES.map(t => ({ value: t, label: t }))} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="Date" type="date" value={form.scheduledDate} onChange={v => setForm({ ...form, scheduledDate: v })} required />
            <FormInput label="Time" type="time" value={form.scheduledTime} onChange={v => setForm({ ...form, scheduledTime: v })} />
          </div>
          <FormTextarea label="Notes / Diagnosis" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
          <div className="flex gap-3 mt-2">
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border" style={{ color: "#6B7280", borderColor: "rgba(0,0,0,0.1)", background: "var(--skeuo-card-gradient)" }}>Cancel</motion.button>
            <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 6px 12px -2px rgba(15,125,122,0.35), inset 0 1px 0 rgba(255,255,255,0.2)" }}>{saving ? "Saving…" : "Log Consultation"}</motion.button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

export default ConsultationsPage;
