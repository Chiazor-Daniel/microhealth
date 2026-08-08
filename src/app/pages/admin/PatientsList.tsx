import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Search, Plus, Eye, Pencil, Trash2, Users } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { PrimaryBtn } from "../../components/shared/Buttons";
import { TableCard, Th, Td, TrHover, InitialsAvatar } from "../../components/shared/TableComponents";
import { SkeletonCard, SkeletonTable, SkeletonAvatar } from "../../components/shared/Skeleton";
import { ErrorState } from "../../components/shared/ErrorState";
import StatusPill from "../../components/shared/StatusPill";
import { Modal } from "../../components/shared/Modal";
import { FormInput, FormSelect } from "../../components/shared/FormInput";
import { patientService } from "../../services/patient.service";
import { success, error as showError, confirmDelete, confirmAction } from "../../components/shared/SweetAlert";

const statusFilters = ["all", "active", "critical", "discharged", "observation"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

const emptyForm = {
  firstName: "", lastName: "", email: "", phone: "",
  age: "", gender: "M", bloodGroup: "O+", diagnosis: "", status: "active",
};

function PatientsList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    setError("");
    patientService.list()
      .then(data => setPatients(data))
      .catch(err => setError(err.message || "Failed to load patients"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const getPatientName = (p: any) => p.user ? `${p.user.firstName} ${p.user.lastName}` : p.name || "Unknown";

  const handleDelete = async (id: string) => {
    const ok = await confirmDelete("Delete patient?", "This action cannot be undone.");
    if (!ok) return;
    try {
      await patientService.remove(id);
      setPatients(prev => prev.filter(p => p.id !== id));
      success("Patient deleted");
    } catch (err: any) {
      showError("Delete failed", err.message);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      firstName: p.user?.firstName || "",
      lastName: p.user?.lastName || "",
      email: p.user?.email || "",
      phone: p.user?.phone || "",
      age: p.age ? String(p.age) : "",
      gender: p.gender || "M",
      bloodGroup: p.bloodGroup || "O+",
      diagnosis: p.diagnosis || "",
      status: p.status || "active",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone) {
      showError("Validation", "First name, last name and phone are required");
      return;
    }
    const confirmed = await confirmAction(
      editingId ? "Update patient?" : "Add patient?",
      editingId ? "Save changes to this patient record?" : "Create a new patient record?",
      editingId ? "Save Changes" : "Add Patient"
    );
    if (!confirmed) return;
    setSaving(true);
    try {
      if (editingId) {
        await patientService.update(editingId, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          age: Number(form.age) || 0,
          gender: form.gender,
          bloodGroup: form.bloodGroup,
          diagnosis: form.diagnosis,
          status: form.status,
        });
        success("Patient updated");
      } else {
        await patientService.create({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          age: Number(form.age) || 0,
          gender: form.gender,
          bloodGroup: form.bloodGroup,
          diagnosis: form.diagnosis,
          status: form.status,
        });
        success("Patient added");
      }
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      showError(editingId ? "Update failed" : "Create failed", err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = patients.filter(p =>
    (filter === "all" || p.status === filter) &&
    getPatientName(p).toLowerCase().includes(search.toLowerCase())
  );

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-4">
      <PageHeader title="Patients" subtitle={loading ? "Loading patients…" : `${patients.length} registered patients`} action={
        <PrimaryBtn icon={Plus} onClick={openCreate}>Add Patient</PrimaryBtn>
      } />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none transition-all focus:ring-2"
            style={{
              background: "var(--skeuo-input-gradient)",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "var(--skeuo-shadow-inset)",
              color: "#374151",
            }}
            placeholder="Search by name, diagnosis…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {statusFilters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl capitalize transition-all"
            style={{
              background: filter === f ? "linear-gradient(135deg, #0F7D7A, #0A5E5C)" : "#FFFFFF",
              color: filter === f ? "#fff" : "#6B7280",
              boxShadow: filter === f ? "0 4px 10px rgba(15,125,122,0.3)" : "var(--skeuo-shadow-sm)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <TableCard title="Patient Registry" subtitle={loading ? "" : `${filtered.length} results`}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <tr><Th>Patient</Th><Th>Blood</Th><Th>Diagnosis</Th><Th>Doctor</Th><Th>Status</Th><Th>Actions</Th></tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><SkeletonAvatar size={32} /><div className="flex-1 h-3 rounded" style={{ background: "#E5E7EB" }} /></div></td>
                    {Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3 rounded" style={{ background: "#E5E7EB" }} /></td>)}
                  </tr>
                ))}
              </>
            ) : filtered.length === 0 ? (
              <tr>
                <Td colSpan={6} className="text-center py-16">
                  <Users size={32} className="mx-auto text-muted-foreground opacity-40 mb-3" />
                  <p className="text-sm text-muted-foreground">No patients found</p>
                </Td>
              </tr>
            ) : (
              filtered.map(p => (
                <TrHover key={p.id} onClick={() => navigate(`/admin/patients/${p.id}`)}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <InitialsAvatar name={getPatientName(p)} />
                      <div>
                        <div className="font-semibold text-foreground">{getPatientName(p)}</div>
                        <div className="text-xs text-muted-foreground">{p.patientCode || p.id?.slice(0, 8)} · {p.age}y {p.gender}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs px-2 py-1 rounded-lg font-bold text-foreground" style={{ background: "#F3F4F6", boxShadow: "var(--skeuo-shadow-sm)", border: "1px solid rgba(0,0,0,0.06)" }}>{p.bloodGroup || "—"}</span>
                  </Td>
                  <Td className="text-foreground max-w-40 truncate">{p.diagnosis || "—"}</Td>
                  <Td className="text-muted-foreground whitespace-nowrap">{p.doctor?.user ? `${p.doctor.user.firstName} ${p.doctor.user.lastName}` : p.doctor?.name || "—"}</Td>
                  <Td><StatusPill status={p.status} /></Td>
                  <Td onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <motion.button whileTap={{ scale: 0.9 }} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-[#0F7D7A] hover:bg-[#E6F7F6] transition-all" onClick={() => navigate(`/admin/patients/${p.id}`)}><Eye size={14} /></motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all" onClick={() => openEdit(p)}><Pencil size={14} /></motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></motion.button>
                    </div>
                  </Td>
                </TrHover>
              ))
            )}
          </tbody>
        </table>
      </TableCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Patient" : "Add New Patient"} size="md">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="First name" value={form.firstName} onChange={v => setForm({ ...form, firstName: v })} required />
            <FormInput label="Last name" value={form.lastName} onChange={v => setForm({ ...form, lastName: v })} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} required />
            <FormInput label="Email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormInput label="Age" type="number" value={form.age} onChange={v => setForm({ ...form, age: v })} />
            <FormSelect label="Gender" value={form.gender} onChange={v => setForm({ ...form, gender: v })} options={GENDERS} />
            <FormSelect label="Blood Group" value={form.bloodGroup} onChange={v => setForm({ ...form, bloodGroup: v })} options={BLOOD_GROUPS.map(b => ({ value: b, label: b }))} />
          </div>
          <FormInput label="Diagnosis" value={form.diagnosis} onChange={v => setForm({ ...form, diagnosis: v })} />
          <FormSelect label="Status" value={form.status} onChange={v => setForm({ ...form, status: v })} options={statusFilters.filter(s => s !== "all").map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
          <div className="flex gap-3 mt-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setModalOpen(false)}
              className="flex-1 py-3 rounded-xl text-sm font-bold border transition-all"
              style={{ color: "#6B7280", borderColor: "rgba(0,0,0,0.1)", background: "var(--skeuo-card-gradient)" }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all"
              style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: "0 6px 12px -2px rgba(15,125,122,0.35), inset 0 1px 0 rgba(255,255,255,0.2)" }}
            >
              {saving ? "Saving…" : editingId ? "Update Patient" : "Save Patient"}
            </motion.button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

export default PatientsList;
