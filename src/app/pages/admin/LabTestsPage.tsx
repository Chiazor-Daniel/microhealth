import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, Download, FlaskConical, Stethoscope } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { PrimaryBtn, GhostBtn } from "../../components/shared/Buttons";
import { TableCard, Th, Td, TrHover, InitialsAvatar } from "../../components/shared/TableComponents";
import { SkeletonCard, SkeletonTable } from "../../components/shared/Skeleton";
import { ErrorState } from "../../components/shared/ErrorState";
import StatusPill from "../../components/shared/StatusPill";
import { Modal } from "../../components/shared/Modal";
import { FormInput, FormSelect } from "../../components/shared/FormInput";
import { labService } from "../../services/lab.service";
import { patientService } from "../../services/patient.service";
import { staffService } from "../../services/staff.service";
import { error as showError, success, confirmAction } from "../../components/shared/SweetAlert";
import { downloadCsv } from "../../utils/csvExport";

const TESTS = ["Full Blood Count", "Urinalysis", "Malaria Parasite", "Blood Sugar", "Lipid Profile", "Liver Function", "Kidney Function", "HIV Screening", "Hepatitis B", "Pregnancy Test"];
const STATUSES = [{ value: "pending", label: "Pending" }, { value: "in-progress", label: "In Progress" }, { value: "completed", label: "Completed" }];

function LabTestsPage() {
  const [labs, setLabs] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ patientId: "", doctorId: "", testName: "Full Blood Count", status: "pending" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([labService.list(), patientService.list(), staffService.list()])
      .then(([labData, pData, sData]) => {
        setLabs(labData);
        setPatients(pData);
        setStaff(sData);
      })
      .catch(err => setError(err.message || "Failed to load lab tests"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const total = labs.length;
  const inProgress = labs.filter(l => l.status === "in-progress").length;
  const awaitingReview = labs.filter(l => l.status === "pending").length;

  const getPatientName = (l: any) => l.patient?.user ? `${l.patient.user.firstName} ${l.patient.user.lastName}` : l.patient?.name || "Unknown";
  const getDoctorName = (l: any) => l.doctor?.user ? `${l.doctor.user.firstName} ${l.doctor.user.lastName}` : l.doctor?.name || "—";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.doctorId) {
      showError("Validation", "Patient and doctor are required");
      return;
    }
    const confirmed = await confirmAction("Order test?", `Order ${form.testName} for the selected patient?`, "Order Test");
    if (!confirmed) return;
    setSaving(true);
    try {
      await labService.order({
        patientId: form.patientId,
        doctorId: form.doctorId,
        testName: form.testName,
        status: form.status,
      });
      success("Lab test ordered");
      setModalOpen(false);
      setForm({ patientId: "", doctorId: "", testName: "Full Blood Count", status: "pending" });
      load();
    } catch (err: any) {
      showError("Order failed", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message={error} />;

  const patientOptions = patients.map(p => ({ value: p.id, label: p.user ? `${p.user.firstName} ${p.user.lastName}` : p.patientCode }));
  const doctorOptions = staff.map(s => ({ value: s.id, label: s.user ? `${s.user.firstName} ${s.user.lastName}` : s.role }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-4">
      <PageHeader title="Lab Tests" subtitle="Ordered and completed laboratory tests"
        action={<PrimaryBtn icon={Plus} onClick={() => setModalOpen(true)}>Order Test</PrimaryBtn>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? <><SkeletonCard /><SkeletonCard /><SkeletonCard /></> : [
          { label: "Total Ordered", value: String(total), color: "#0F7D7A" },
          { label: "In Progress", value: String(inProgress), color: "#3B82F6" },
          { label: "Awaiting Review", value: String(awaitingReview), color: "#F59E0B" },
        ].map(s => (
          <motion.div
            key={s.label}
            whileHover={{ y: -3 }}
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: s.color + "18", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)" }}>
              <FlaskConical size={20} style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs font-bold text-muted-foreground">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <TableCard title="Test Orders" action={<GhostBtn icon={Download} onClick={() => downloadCsv("lab-tests.csv", labs.map(l => ({
        id: l.id?.slice(0, 8),
        patient: getPatientName(l),
        test: l.testName || "—",
        ordered: l.createdAt ? new Date(l.createdAt).toLocaleDateString("en-GB") : "—",
        doctor: getDoctorName(l),
        status: l.status,
        result: l.result || "Pending",
      })))}>Export</GhostBtn>}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Test ID</Th><Th>Patient</Th><Th>Test</Th><Th>Ordered</Th><Th>Doctor</Th><Th>Status</Th><Th>Result</Th></tr></thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={5} cols={7} />
            ) : (
              <>
                {labs.map(l => (
                  <TrHover key={l.id}>
                    <Td><span className="font-mono text-xs text-muted-foreground">{l.id?.slice(0, 8)}</span></Td>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <InitialsAvatar name={getPatientName(l)} size="sm" />
                        <span className="font-semibold text-foreground">{getPatientName(l)}</span>
                      </div>
                    </Td>
                    <Td className="text-foreground font-semibold">{l.testName || "—"}</Td>
                    <Td className="text-muted-foreground whitespace-nowrap">{l.createdAt ? new Date(l.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</Td>
                    <Td className="text-muted-foreground whitespace-nowrap">{getDoctorName(l)}</Td>
                    <Td><StatusPill status={l.status} /></Td>
                    <Td className="text-muted-foreground text-xs">{l.result || "Pending"}</Td>
                  </TrHover>
                ))}
                {labs.length === 0 && <tr><Td colSpan={7} className="text-center py-12 text-muted-foreground">
                  <Stethoscope size={28} className="mx-auto mb-2 opacity-40" />No lab tests.
                </Td></tr>}
              </>
            )}
          </tbody>
        </table>
      </TableCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Order Lab Test" size="md">
        <form onSubmit={handleCreate}>
          <FormSelect label="Patient" value={form.patientId} onChange={v => setForm({ ...form, patientId: v })} options={patientOptions} required />
          <FormSelect label="Doctor" value={form.doctorId} onChange={v => setForm({ ...form, doctorId: v })} options={doctorOptions} required />
          <FormSelect label="Test" value={form.testName} onChange={v => setForm({ ...form, testName: v })} options={TESTS.map(t => ({ value: t, label: t }))} required />
          <FormSelect label="Status" value={form.status} onChange={v => setForm({ ...form, status: v })} options={STATUSES} />
          <div className="flex gap-3 mt-2">
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border" style={{ color: "#6B7280", borderColor: "rgba(0,0,0,0.1)", background: "var(--skeuo-card-gradient)" }}>Cancel</motion.button>
            <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 6px 12px -2px rgba(15,125,122,0.35), inset 0 1px 0 rgba(255,255,255,0.2)" }}>{saving ? "Ordering…" : "Order Test"}</motion.button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

export default LabTestsPage;
