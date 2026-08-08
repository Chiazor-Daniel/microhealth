import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, Users, UserCheck, Stethoscope, Heart, ChevronDown } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { PrimaryBtn } from "../../components/shared/Buttons";
import { TableCard, Th, Td, TrHover, InitialsAvatar } from "../../components/shared/TableComponents";
import KpiCard from "../../components/shared/KpiCard";
import { SkeletonCard, SkeletonTable } from "../../components/shared/Skeleton";
import { ErrorState } from "../../components/shared/ErrorState";
import StatusPill from "../../components/shared/StatusPill";
import { Modal } from "../../components/shared/Modal";
import { FormInput, FormSelect } from "../../components/shared/FormInput";
import { staffService } from "../../services/staff.service";
import { error as showError, success, confirmAction } from "../../components/shared/SweetAlert";

const ROLES = ["Physician", "Nurse", "Lab Technician", "Pharmacist", "Administrator", "Receptionist"];
const DEPTS = ["General Medicine", "Cardiology", "Neurology", "Orthopedics", "Obstetrics", "Pediatrics", "ICU", "Administration"];

function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [deptFilter, setDeptFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", role: "Physician", department: "General Medicine", status: "on-duty",
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    staffService.list()
      .then(data => setStaff(data))
      .catch(err => setError(err.message || "Failed to load staff"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const getName = (s: any) => s.user ? `${s.user.firstName} ${s.user.lastName}` : s.name || "Unknown";
  const total = staff.length;
  const onDuty = staff.filter(s => s.status === "on-duty").length;
  const physicians = staff.filter(s =>
    (s.role || "").toLowerCase().includes("physician") ||
    (s.role || "").toLowerCase().includes("doctor") ||
    (s.department || "").toLowerCase().includes("physician")
  ).length;
  const nurses = staff.filter(s =>
    (s.role || "").toLowerCase().includes("nurse") ||
    (s.department || "").toLowerCase().includes("nursing")
  ).length;

  const departments = ["all", ...Array.from(new Set(staff.map(s => s.department).filter(Boolean)))];
  const filtered = deptFilter === "all" ? staff : staff.filter(s => s.department === deptFilter);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone) {
      showError("Validation", "First name, last name and phone are required");
      return;
    }
    const confirmed = await confirmAction("Add staff member?", `Create a new staff record for ${form.firstName} ${form.lastName}?`, "Add Staff");
    if (!confirmed) return;
    setSaving(true);
    try {
      await staffService.create({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        role: form.role,
        department: form.department,
        status: form.status,
      });
      success("Staff added");
      setModalOpen(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", role: "Physician", department: "General Medicine", status: "on-duty" });
      load();
    } catch (err: any) {
      showError("Create failed", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message={error} />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-4">
      <PageHeader title="Staff Management" subtitle="Clinical and administrative team directory"
        action={<PrimaryBtn icon={Plus} onClick={() => setModalOpen(true)}>Add Staff</PrimaryBtn>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></> : (
          <>
            <KpiCard icon={Users} label="Total Staff" value={String(total)} delta="—" deltaUp sub="Active members" color="#0F7D7A" />
            <KpiCard icon={UserCheck} label="On Duty Now" value={String(onDuty)} delta="—" deltaUp sub="Across all wards" color="#4CAF50" />
            <KpiCard icon={Stethoscope} label="Physicians" value={String(physicians)} delta="—" deltaUp sub="All departments" color="#36A09D" />
            <KpiCard icon={Heart} label="Nursing Staff" value={String(nurses)} delta="—" deltaUp sub="Including head nurses" color="#8B5CF6" />
          </>
        )}
      </div>

      <div className="flex justify-end">
        <div className="relative">
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="pl-3 pr-8 py-2 text-xs font-bold rounded-xl outline-none appearance-none transition-all"
            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "var(--skeuo-shadow-sm)", color: "#374151" }}
          >
            {departments.map(d => <option key={d} value={d}>{d === "all" ? "All Departments" : d}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <TableCard title={loading ? "" : `${filtered.length} Staff Members`}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Staff Member</Th><Th>Role</Th><Th>Department</Th><Th>Patients</Th><Th>Contact</Th><Th>Status</Th></tr></thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={6} cols={6} />
            ) : (
              <>
                {filtered.map(s => (
                  <TrHover key={s.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <InitialsAvatar name={getName(s)} />
                        <div>
                          <div className="font-semibold text-foreground">{getName(s)}</div>
                          <div className="text-xs text-muted-foreground">{s.id?.slice(0, 8)}</div>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-muted-foreground">{s.role}</Td>
                    <Td className="text-muted-foreground">{s.department}</Td>
                    <Td><span className="font-bold text-foreground">{s.patientCount}</span></Td>
                    <Td className="text-muted-foreground">{s.user?.phone || "—"}</Td>
                    <Td><StatusPill status={s.status} /></Td>
                  </TrHover>
                ))}
                {filtered.length === 0 && <tr><Td colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Users size={28} className="mx-auto mb-2 opacity-40" />No staff members.
                </Td></tr>}
              </>
            )}
          </tbody>
        </table>
      </TableCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Staff Member" size="md">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="First name" value={form.firstName} onChange={v => setForm({ ...form, firstName: v })} required />
            <FormInput label="Last name" value={form.lastName} onChange={v => setForm({ ...form, lastName: v })} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} required />
            <FormInput label="Email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
          </div>
          <FormSelect label="Role" value={form.role} onChange={v => setForm({ ...form, role: v })} options={ROLES.map(r => ({ value: r, label: r }))} />
          <FormSelect label="Department" value={form.department} onChange={v => setForm({ ...form, department: v })} options={DEPTS.map(d => ({ value: d, label: d }))} />
          <FormSelect label="Status" value={form.status} onChange={v => setForm({ ...form, status: v })} options={[{ value: "on-duty", label: "On Duty" }, { value: "off-duty", label: "Off Duty" }]} />
          <div className="flex gap-3 mt-2">
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border" style={{ color: "#6B7280", borderColor: "rgba(0,0,0,0.1)", background: "var(--skeuo-card-gradient)" }}>Cancel</motion.button>
            <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 6px 12px -2px rgba(15,125,122,0.35), inset 0 1px 0 rgba(255,255,255,0.2)" }}>{saving ? "Saving…" : "Add Staff"}</motion.button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

export default StaffPage;
