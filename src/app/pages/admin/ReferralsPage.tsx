import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, GitBranch, Send } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { PrimaryBtn } from "../../components/shared/Buttons";
import { TableCard, Th, Td, TrHover, InitialsAvatar } from "../../components/shared/TableComponents";
import { SkeletonCard, SkeletonTable } from "../../components/shared/Skeleton";
import { ErrorState } from "../../components/shared/ErrorState";
import StatusPill from "../../components/shared/StatusPill";
import { Modal } from "../../components/shared/Modal";
import { FormInput, FormSelect } from "../../components/shared/FormInput";
import { referralService } from "../../services/referral.service";
import { patientService } from "../../services/patient.service";
import { staffService } from "../../services/staff.service";
import { error as showError, success, confirmAction } from "../../components/shared/SweetAlert";

const STATUSES = [{ value: "pending", label: "Pending" }, { value: "in-review", label: "In Review" }, { value: "completed", label: "Completed" }];

function ReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ patientId: "", fromDoctorId: "", toFacility: "", reason: "", referralDate: "", status: "pending" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([referralService.list(), patientService.list(), staffService.list()])
      .then(([refData, pData, sData]) => {
        setReferrals(refData);
        setPatients(pData);
        setStaff(sData);
      })
      .catch(err => setError(err.message || "Failed to load referrals"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const getPatientName = (r: any) => r.patient?.user ? `${r.patient.user.firstName} ${r.patient.user.lastName}` : r.patient?.name || "Unknown";
  const getDoctorName = (r: any) => r.fromDoctor?.user ? `${r.fromDoctor.user.firstName} ${r.fromDoctor.user.lastName}` : r.fromDoctor?.name || "—";

  const total = referrals.length;
  const inReview = referrals.filter(r => r.status === "in-review").length;
  const completed = referrals.filter(r => r.status === "completed").length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.fromDoctorId || !form.toFacility) {
      showError("Validation", "Patient, doctor and facility are required");
      return;
    }
    const confirmed = await confirmAction("Create referral?", `Refer this patient to ${form.toFacility}?`, "Create Referral");
    if (!confirmed) return;
    setSaving(true);
    try {
      await referralService.create({
        patientId: form.patientId,
        fromDoctorId: form.fromDoctorId,
        toFacility: form.toFacility,
        reason: form.reason,
        referralDate: form.referralDate || new Date().toISOString().split("T")[0],
        status: form.status,
      });
      success("Referral created");
      setModalOpen(false);
      setForm({ patientId: "", fromDoctorId: "", toFacility: "", reason: "", referralDate: "", status: "pending" });
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
      <PageHeader title="Referrals" subtitle="Outgoing referrals to external facilities"
        action={<PrimaryBtn icon={Plus} onClick={() => setModalOpen(true)}>New Referral</PrimaryBtn>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? <><SkeletonCard /><SkeletonCard /><SkeletonCard /></> : [
          { label: "Total Referrals", v: String(total), c: "#0F7D7A" },
          { label: "In Review", v: String(inReview), c: "#3B82F6" },
          { label: "Completed", v: String(completed), c: "#10B981" },
        ].map(s => (
          <motion.div
            key={s.label}
            whileHover={{ y: -3 }}
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: s.c + "18" }}>
              <GitBranch size={20} style={{ color: s.c }} />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{s.v}</div>
              <div className="text-xs font-bold text-muted-foreground">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <TableCard title="All Referrals">
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Ref ID</Th><Th>Patient</Th><Th>From</Th><Th>To Facility</Th><Th>Reason</Th><Th>Date</Th><Th>Status</Th></tr></thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={5} cols={7} />
            ) : (
              <>
                {referrals.map(r => (
                  <TrHover key={r.id}>
                    <Td><span className="font-mono text-xs text-muted-foreground">{r.id?.slice(0, 8)}</span></Td>
                    <Td className="font-semibold text-foreground">{getPatientName(r)}</Td>
                    <Td className="text-muted-foreground whitespace-nowrap">{getDoctorName(r)}</Td>
                    <Td className="text-muted-foreground">{r.toFacility}</Td>
                    <Td className="text-muted-foreground max-w-48 truncate">{r.reason || "—"}</Td>
                    <Td className="text-muted-foreground whitespace-nowrap">{r.referralDate ? new Date(r.referralDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</Td>
                    <Td><StatusPill status={r.status} /></Td>
                  </TrHover>
                ))}
                {referrals.length === 0 && <tr><Td colSpan={7} className="text-center py-12 text-muted-foreground">
                  <Send size={28} className="mx-auto mb-2 opacity-40" />No referrals.
                </Td></tr>}
              </>
            )}
          </tbody>
        </table>
      </TableCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Referral" size="md">
        <form onSubmit={handleCreate}>
          <FormSelect label="Patient" value={form.patientId} onChange={v => setForm({ ...form, patientId: v })} options={patientOptions} required />
          <FormSelect label="From Doctor" value={form.fromDoctorId} onChange={v => setForm({ ...form, fromDoctorId: v })} options={doctorOptions} required />
          <FormInput label="To Facility" value={form.toFacility} onChange={v => setForm({ ...form, toFacility: v })} required />
          <FormInput label="Reason" value={form.reason} onChange={v => setForm({ ...form, reason: v })} />
          <FormInput label="Referral Date" type="date" value={form.referralDate} onChange={v => setForm({ ...form, referralDate: v })} />
          <FormSelect label="Status" value={form.status} onChange={v => setForm({ ...form, status: v })} options={STATUSES} />
          <div className="flex gap-3 mt-2">
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border" style={{ color: "#6B7280", borderColor: "rgba(0,0,0,0.1)", background: "var(--skeuo-card-gradient)" }}>Cancel</motion.button>
            <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 6px 12px -2px rgba(15,125,122,0.35), inset 0 1px 0 rgba(255,255,255,0.2)" }}>{saving ? "Saving…" : "Create Referral"}</motion.button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

export default ReferralsPage;
