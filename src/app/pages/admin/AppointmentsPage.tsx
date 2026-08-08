import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Plus, Clock, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { PrimaryBtn, GhostBtn } from "../../components/shared/Buttons";
import { TableCard, Th, Td, TrHover, InitialsAvatar } from "../../components/shared/TableComponents";
import { SkeletonCard, SkeletonTable } from "../../components/shared/Skeleton";
import { ErrorState } from "../../components/shared/ErrorState";
import StatusPill from "../../components/shared/StatusPill";
import { Modal } from "../../components/shared/Modal";
import { FormInput, FormSelect } from "../../components/shared/FormInput";
import { appointmentService } from "../../services/appointment.service";
import { patientService } from "../../services/patient.service";
import { staffService } from "../../services/staff.service";
import { success, error as showError, confirmDelete, confirmAction } from "../../components/shared/SweetAlert";

const statusFilters = ["all", "confirmed", "pending", "in-progress", "critical", "completed", "cancelled"];
const statusOptions = statusFilters.filter(s => s !== "all").map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }));
const DEPTS = ["General Practice", "Antenatal Care", "Cardiology", "Neurology", "Orthopedics", "Pulmonology", "Dental"];

function AppointmentsPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    patientId: "", doctorId: "", department: "General Practice", scheduledDate: "", scheduledTime: "", notes: "", status: "confirmed",
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      appointmentService.list(),
      patientService.list(),
      staffService.list(),
    ])
      .then(([appts, pats, s]) => {
        setAppointments(appts);
        setPatients(pats);
        setStaff(s);
      })
      .catch(err => setError(err.message || "Failed to load appointments"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const getPatientName = (a: any) => a.patient?.user ? `${a.patient.user.firstName} ${a.patient.user.lastName}` : a.patient?.name || "Unknown";
  const getDoctorName = (a: any) => a.doctor?.user ? `${a.doctor.user.firstName} ${a.doctor.user.lastName}` : a.doctor?.name || "Unassigned";

  const filtered = appointments.filter(a => statusFilter === "all" || a.status === statusFilter);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const d = i - offset;
    if (d < 0) {
      const prevDays = new Date(year, month, 0).getDate();
      return { day: prevDays + d + 1, inMonth: false };
    }
    if (d >= daysInMonth) return { day: d - daysInMonth + 1, inMonth: false };
    return { day: d + 1, inMonth: true };
  });
  const apptDayMap: Record<number, number> = {};
  appointments.filter(a => a.scheduledDate && new Date(a.scheduledDate).getMonth() === month && new Date(a.scheduledDate).getFullYear() === year)
    .forEach(a => { apptDayMap[new Date(a.scheduledDate).getDate()] = (apptDayMap[new Date(a.scheduledDate).getDate()] || 0) + 1; });
  const todayDate = new Date().getDate();
  const isCurrentMonth = new Date().getMonth() === month && new Date().getFullYear() === year;
  const todayAppts = appointments.filter(a => {
    if (!a.scheduledDate) return false;
    const d = new Date(a.scheduledDate);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === (isCurrentMonth ? todayDate : 1);
  });
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirmDelete("Cancel appointment?", "This will remove the appointment record.");
    if (!ok) return;
    try {
      await appointmentService.remove(id);
      setAppointments(prev => prev.filter(a => a.id !== id));
      success("Appointment cancelled");
    } catch (err: any) {
      showError("Action failed", err.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.doctorId || !form.scheduledDate || !form.scheduledTime) {
      showError("Validation", "Patient, doctor, date and time are required");
      return;
    }
    const confirmed = await confirmAction("Book appointment?", "Schedule this appointment with the selected patient and provider?", "Book");
    if (!confirmed) return;
    setSaving(true);
    try {
      await appointmentService.create({
        patientId: form.patientId,
        doctorId: form.doctorId,
        department: form.department,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        notes: form.notes,
        status: form.status,
      });
      success("Appointment booked");
      setModalOpen(false);
      setForm({ patientId: "", doctorId: "", department: "General Practice", scheduledDate: "", scheduledTime: "", notes: "", status: "confirmed" });
      load();
    } catch (err: any) {
      showError("Booking failed", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  const patientOptions = patients.map(p => ({ value: p.id, label: p.user ? `${p.user.firstName} ${p.user.lastName}` : p.patientCode }));
  const doctorOptions = staff.map(s => ({ value: s.id, label: s.user ? `${s.user.firstName} ${s.user.lastName}` : s.role }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-4">
      <PageHeader title="Appointments" subtitle={new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        action={<PrimaryBtn icon={Plus} onClick={() => setModalOpen(true)}>Book Appointment</PrimaryBtn>}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#F3F4F6", boxShadow: "var(--skeuo-shadow-inset)" }}>
          {(["list", "calendar"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-4 py-2 text-sm font-bold rounded-lg capitalize transition-all"
              style={{
                background: view === v ? "linear-gradient(180deg, #FFFFFF 0%, #F0FAFA 100%)" : "transparent",
                color: view === v ? "#0F7D7A" : "#6B7280",
                boxShadow: view === v ? "var(--skeuo-shadow-sm)" : "none",
              }}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all"
              style={{
                background: statusFilter === f ? "linear-gradient(135deg, #0F7D7A, #0A5E5C)" : "#FFFFFF",
                color: statusFilter === f ? "#fff" : "#6B7280",
                boxShadow: statusFilter === f ? "0 4px 10px rgba(15,125,122,0.3)" : "var(--skeuo-shadow-sm)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {view === "list" ? (
        <TableCard title={loading ? "" : `${filtered.length} Appointments`}>
          <table className="w-full text-sm">
            <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Patient</Th><Th>Doctor</Th><Th>Department</Th><Th>Date</Th><Th>Time</Th><Th>Status</Th><Th /></tr></thead>
            <tbody>
              {loading ? (
                <SkeletonTable rows={5} cols={7} />
              ) : (
                <>
                  {filtered.map(apt => (
                    <TrHover key={apt.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <InitialsAvatar name={getPatientName(apt)} />
                          <div>
                            <div className="font-semibold text-foreground">{getPatientName(apt)}</div>
                            <div className="text-xs text-muted-foreground">{apt.patient?.patientCode || apt.id?.slice(0, 8)}</div>
                          </div>
                        </div>
                      </Td>
                      <Td className="text-foreground whitespace-nowrap">{getDoctorName(apt)}</Td>
                      <Td className="text-muted-foreground">{apt.department || "—"}</Td>
                      <Td className="text-muted-foreground whitespace-nowrap">{apt.scheduledDate ? new Date(apt.scheduledDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</Td>
                      <Td><span className="flex items-center gap-1.5 whitespace-nowrap"><Clock size={12} className="text-muted-foreground" />{apt.scheduledTime?.slice(0, 5) || "—"}</span></Td>
                      <Td><StatusPill status={apt.status} /></Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <motion.button whileTap={{ scale: 0.9 }} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-[#0F7D7A] hover:bg-[#E6F7F6] transition-all" onClick={() => navigate(`/admin/patients/${apt.patientId}`)}><MoreHorizontal size={14} /></motion.button>
                          <motion.button whileTap={{ scale: 0.9 }} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all" onClick={e => handleDelete(apt.id, e)}><span className="text-xs font-bold">×</span></motion.button>
                        </div>
                      </Td>
                    </TrHover>
                  ))}
                  {filtered.length === 0 && <tr><Td colSpan={7} className="text-center py-12 text-muted-foreground">No appointments.</Td></tr>}
                </>
              )}
            </tbody>
          </table>
        </TableCard>
      ) : (
        <div className="rounded-2xl p-5" style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}>
          {loading ? (
            <div className="h-[420px] rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-foreground">{monthNames[month]} {year}</h3>
                <div className="flex items-center gap-1">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCurrentMonth(new Date(year, month - 1))} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F3F4F6" }}><ChevronLeft size={16} /></motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCurrentMonth(new Date(year, month + 1))} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F3F4F6" }}><ChevronRight size={16} /></motion.button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                  <div key={d} className="text-[10px] font-bold text-muted-foreground uppercase py-2">{d}</div>
                ))}
                {calendarDays.map((cd, i) => {
                  const count = cd.inMonth ? apptDayMap[cd.day] || 0 : 0;
                  const isToday = cd.inMonth && isCurrentMonth && cd.day === todayDate;
                  return (
                    <motion.div
                      key={i}
                      whileHover={{ y: -2 }}
                      className={`h-16 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${isToday ? "ring-2 ring-[#0F7D7A]" : ""}`}
                      style={{
                        background: isToday ? "#E6F7F6" : cd.inMonth ? "#F8F9FA" : "transparent",
                        boxShadow: cd.inMonth ? "var(--skeuo-shadow-sm)" : "none",
                        border: "1px solid rgba(0,0,0,0.04)",
                      }}
                    >
                      {cd.inMonth && <span className={`text-sm font-bold ${isToday ? "text-[#0F7D7A]" : "text-foreground"}`}>{cd.day}</span>}
                      {count > 0 && (
                        <span className="mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "#0F7D7A" }}>{count}</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 space-y-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <p className="text-sm font-bold text-foreground">{isCurrentMonth ? todayDate : 1} {monthNames[month]} — {todayAppts.length} appointment{todayAppts.length !== 1 ? "s" : ""}</p>
                {todayAppts.slice(0, 3).map(apt => (
                  <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F8F9FA", boxShadow: "var(--skeuo-shadow-sm)" }}>
                    <span className="text-xs font-bold text-muted-foreground w-16 flex-shrink-0">{apt.scheduledTime?.slice(0, 5) || "—"}</span>
                    <InitialsAvatar name={getPatientName(apt)} size="sm" />
                    <span className="text-sm font-bold text-foreground flex-1">{getPatientName(apt)}</span>
                    <StatusPill status={apt.status} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Book Appointment" size="md">
        <form onSubmit={handleCreate}>
          <FormSelect label="Patient" value={form.patientId} onChange={v => setForm({ ...form, patientId: v })} options={patientOptions} required />
          <FormSelect label="Doctor" value={form.doctorId} onChange={v => setForm({ ...form, doctorId: v })} options={doctorOptions} required />
          <FormSelect label="Department" value={form.department} onChange={v => setForm({ ...form, department: v })} options={DEPTS.map(d => ({ value: d, label: d }))} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="Date" type="date" value={form.scheduledDate} onChange={v => setForm({ ...form, scheduledDate: v })} required />
            <FormInput label="Time" type="time" value={form.scheduledTime} onChange={v => setForm({ ...form, scheduledTime: v })} required />
          </div>
          <FormSelect label="Status" value={form.status} onChange={v => setForm({ ...form, status: v })} options={statusOptions} />
          <FormInput label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} placeholder="Reason / notes" />
          <div className="flex gap-3 mt-2">
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border" style={{ color: "#6B7280", borderColor: "rgba(0,0,0,0.1)", background: "var(--skeuo-card-gradient)" }}>Cancel</motion.button>
            <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 6px 12px -2px rgba(15,125,122,0.35), inset 0 1px 0 rgba(255,255,255,0.2)" }}>{saving ? "Booking…" : "Book"}</motion.button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

export default AppointmentsPage;
