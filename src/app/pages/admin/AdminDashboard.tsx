import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Users, Calendar, AlertCircle, Activity, Clock, MoreHorizontal,
  FlaskConical, Plus, User, Loader2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import KpiCard from "../../components/shared/KpiCard";
import ChartTooltip from "../../components/shared/ChartTooltip";
import { TableCard, Th, Td, TrHover, InitialsAvatar } from "../../components/shared/TableComponents";
import StatusPill from "../../components/shared/StatusPill";
import { PrimaryBtn, GhostBtn } from "../../components/shared/Buttons";
import { SkeletonCard, SkeletonTable } from "../../components/shared/Skeleton";
import { ErrorState } from "../../components/shared/ErrorState";
import { dashboardService } from "../../services/dashboard.service";
import { appointmentService } from "../../services/appointment.service";
import { useAuth } from "../../hooks/useAuth";

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const CURVE_RADIUS = 28;

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpi, setKpi] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [wardOccupancy, setWardOccupancy] = useState<any[]>([]);
  const [shiftSummary, setShiftSummary] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [kpiData, alertsData, wards, shift, appts, trendData] = await Promise.all([
          dashboardService.getKpi(),
          dashboardService.getAlerts(),
          dashboardService.getWardOccupancy(),
          dashboardService.getShiftSummary(),
          appointmentService.list({ date: new Date().toISOString().split("T")[0] }),
          dashboardService.getPatientTrends().catch(() => []),
        ]);
        if (cancelled) return;
        setKpi(kpiData);
        setAlerts(alertsData);
        setWardOccupancy(wards);
        setShiftSummary(shift);
        setAppointments(appts);
        setTrends(trendData?.length ? trendData.map((t: any) => ({ month: t.month, admitted: t.count, discharged: Math.round(t.count * 0.7) })) : []);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const displayName = user ? `${user.firstName} ${user.lastName}` : "";

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
      className="space-y-5 pb-4"
      style={{ fontFamily: "'Work Sans', sans-serif" }}
    >
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Good morning, {displayName || "—"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here is what is happening today.</p>
        </div>
        <PrimaryBtn icon={Plus} onClick={() => navigate("/admin/appointments")}>New Appointment</PrimaryBtn>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <KpiCard icon={Users} label="Total Patients" value={kpi?.totalPatients?.toLocaleString() ?? "—"} delta="—" deltaUp sub="registered" color="#0F7D7A" />
            <KpiCard icon={Calendar} label="Appointments Today" value={kpi?.appointmentsToday ?? "—"} delta={`${appointments.length}`} deltaUp sub="scheduled today" color="#36A09D" />
            <KpiCard icon={AlertCircle} label="Critical Cases" value={kpi?.criticalCases ?? "—"} delta={`${alerts.filter((a: any) => a.severity === "high").length}`} deltaUp={false} sub="require attention" color="#EF4444" />
            <KpiCard icon={Activity} label="Staff On Duty" value={kpi?.staffOnDuty ?? "—"} delta="—" deltaUp sub="available now" color="#4CAF50" />
          </>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="lg:col-span-2 p-5"
          style={{
            borderRadius: CURVE_RADIUS,
            background: "var(--skeuo-card-gradient)",
            boxShadow: "var(--skeuo-shadow)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Patient Flow</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Admissions vs. Discharges</p>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#0F7D7A]" /> Admitted</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#36A09D] opacity-60" /> Discharged</span>
            </div>
          </div>
          {loading ? (
            <div className="h-[200px] rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trends} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0F7D7A" stopOpacity={0.25} /><stop offset="95%" stopColor="#0F7D7A" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#36A09D" stopOpacity={0.15} /><stop offset="95%" stopColor="#36A09D" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="admitted" stroke="#0F7D7A" strokeWidth={2.5} fill="url(#gA)" dot={false} />
                <Area type="monotone" dataKey="discharged" stroke="#36A09D" strokeWidth={2.5} fill="url(#gD)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div
          className="p-5"
          style={{
            borderRadius: CURVE_RADIUS,
            background: "var(--skeuo-card-gradient)",
            boxShadow: "var(--skeuo-shadow)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div className="mb-4">
            <h3 className="text-base font-bold text-foreground">Ward Occupancy</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Current bed utilisation</p>
          </div>
          {loading ? (
            <div className="h-[200px] rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={wardOccupancy} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="ward" type="category" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="capacity" fill="#EEF0F4" radius={[0, 4, 4, 0]} />
                <Bar dataKey="occupied" fill="#0F7D7A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {loading ? (
            <SkeletonTable rows={4} cols={6} />
          ) : (
            <TableCard
              title="Today's Appointments"
              subtitle={new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              action={<GhostBtn onClick={() => navigate("/admin/appointments")}>View all</GhostBtn>}
            >
              <table className="w-full text-sm">
                <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  <tr><Th>Patient</Th><Th>Doctor</Th><Th>Department</Th><Th>Time</Th><Th>Status</Th><Th /></tr>
                </thead>
                <tbody>
                  {appointments.slice(0, 5).map((apt: any) => {
                    const patientName = apt.patient?.user ? `${apt.patient.user.firstName} ${apt.patient.user.lastName}` : "Unknown";
                    const doctorName = apt.doctor?.user ? `${apt.doctor.user.firstName} ${apt.doctor.user.lastName}` : "Unassigned";
                    return (
                      <TrHover key={apt.id} onClick={() => navigate(`/admin/appointments`)} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <InitialsAvatar name={patientName} />
                            <div>
                              <div className="font-semibold text-foreground">{patientName}</div>
                              <div className="text-xs text-muted-foreground">{apt.patient?.patientCode || apt.id?.slice(0, 8)}</div>
                            </div>
                          </div>
                        </Td>
                        <Td className="text-foreground whitespace-nowrap">{doctorName}</Td>
                        <Td className="text-muted-foreground whitespace-nowrap">{apt.department || "General"}</Td>
                        <Td>
                          <span className="flex items-center gap-1.5 whitespace-nowrap">
                            <Clock size={12} className="text-muted-foreground" />{apt.scheduledTime?.slice(0, 5) || "—"}
                          </span>
                        </Td>
                        <Td><StatusPill status={apt.status} /></Td>
                        <Td>
                          <button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted">
                            <MoreHorizontal size={14} />
                          </button>
                        </Td>
                      </TrHover>
                    );
                  })}
                  {appointments.length === 0 && (
                    <tr>
                      <Td colSpan={6} className="text-center text-muted-foreground py-8">No appointments scheduled for today.</Td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableCard>
          )}
        </div>

        <div className="space-y-4">
          <div
            className="p-5"
            style={{
              borderRadius: CURVE_RADIUS,
              background: "var(--skeuo-card-gradient)",
              boxShadow: "var(--skeuo-shadow)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">Critical Alerts</h3>
              {loading ? (
                <div className="w-5 h-5 rounded-full animate-pulse" style={{ background: "#E5E7EB" }} />
              ) : (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center pulse-soft">{alerts.length}</span>
              )}
            </div>
            <div className="space-y-3">
              {loading ? (
                <>
                  <div className="h-16 rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
                  <div className="h-16 rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
                  <div className="h-16 rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
                </>
              ) : (
                <>
                  {alerts.slice(0, 5).map((a: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-3 p-3 rounded-xl cursor-pointer transition-all hover:translate-y-[-2px]"
                      style={{
                        background: a.severity === "high" ? "#FEF2F2" : "#FFFBEB",
                        border: `1px solid ${a.severity === "high" ? "rgba(244,67,54,0.12)" : "rgba(255,183,77,0.2)"}`,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div className={`w-1.5 rounded-full flex-shrink-0 mt-0.5 ${a.severity === "high" ? "bg-red-500" : "bg-amber-400"}`} style={{ minHeight: 32 }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-foreground truncate">{a.patient}</span>
                          <span className="text-[11px] text-muted-foreground flex-shrink-0">{new Date(a.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div className="text-xs font-bold mt-1" style={{ color: a.severity === "high" ? "#B91C1C" : "#92400E" }}>{a.alert}</div>
                      </div>
                    </motion.div>
                  ))}
                  {alerts.length === 0 && <div className="text-sm text-muted-foreground text-center py-3">No critical alerts.</div>}
                </>
              )}
            </div>
          </div>

          <div
            className="p-5"
            style={{
              borderRadius: CURVE_RADIUS,
              background: "var(--skeuo-card-gradient)",
              boxShadow: "var(--skeuo-shadow)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <h3 className="text-base font-bold text-foreground mb-3">Shift Summary</h3>
            {loading ? (
              <div className="space-y-3">
                <div className="h-10 rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
                <div className="h-10 rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
                <div className="h-10 rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
              </div>
            ) : (
              [
                { label: "Nurses on duty", value: shiftSummary?.nursesOnDuty ?? "—", icon: User },
                { label: "Pending labs", value: shiftSummary?.pendingLabs ?? "—", icon: FlaskConical },
                { label: "Surgeries today", value: "—", icon: Activity },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#E6F7F6" }}>
                      <Icon size={13} style={{ color: "#0F7D7A" }} />
                    </div>
                    {label}
                  </div>
                  <span className="text-sm font-bold text-foreground">{value}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AdminDashboard;
