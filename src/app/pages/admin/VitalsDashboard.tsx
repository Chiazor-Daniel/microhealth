import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Heart, Activity, Zap, Stethoscope } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import KpiCard from "../../components/shared/KpiCard";
import ChartTooltip from "../../components/shared/ChartTooltip";
import PageHeader from "../../components/shared/PageHeader";
import { SkeletonCard, SkeletonTable, SkeletonPulse } from "../../components/shared/Skeleton";
import { ErrorState } from "../../components/shared/ErrorState";
import StatusPill from "../../components/shared/StatusPill";
import { vitalService } from "../../services/vital.service";

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isAbnormal(v: any) {
  if (v.bloodPressureSystolic && (v.bloodPressureSystolic > 140 || v.bloodPressureSystolic < 90)) return true;
  if (v.bloodPressureDiastolic && (v.bloodPressureDiastolic > 90 || v.bloodPressureDiastolic < 60)) return true;
  if (v.heartRate && (v.heartRate > 100 || v.heartRate < 60)) return true;
  if (v.temperature && (Number(v.temperature) > 37.8 || Number(v.temperature) < 36.1)) return true;
  if (v.spo2 != null && v.spo2 < 94) return true;
  return false;
}

function alertText(v: any) {
  if (v.bloodPressureSystolic && v.bloodPressureSystolic > 140) return `BP ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic || "—"} mmHg — High`;
  if (v.spo2 != null && v.spo2 < 94) return `SpO₂ ${v.spo2}% — Low`;
  if (v.heartRate && v.heartRate > 100) return `HR ${v.heartRate} bpm — Tachycardia`;
  if (v.temperature && Number(v.temperature) > 37.8) return `Temp ${v.temperature}°C — Fever`;
  return "Abnormal reading";
}

function VitalsDashboard() {
  const [vitals, setVitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    vitalService.getAbnormal()
      .then(data => {
        setVitals(data);
        if (data[0]) setSelectedPatient(data[0]);
      })
      .catch(err => setError(err.message || "Failed to load vitals"))
      .finally(() => setLoading(false));
  }, []);

  const abnormal = vitals.filter(isAbnormal);
  const criticalCount = abnormal.length;
  const latest = vitals[0];

  const getName = (v: any) => v.patient?.user ? `${v.patient.user.firstName} ${v.patient.user.lastName}` : v.patient?.name || "Unknown";

  const chartData = selectedPatient
    ? vitals.filter(v => v.patientId === selectedPatient.patientId).slice(0, 8).reverse().map(v => ({
        time: formatTime(v.recordedAt),
        systolic: v.bloodPressureSystolic,
        diastolic: v.bloodPressureDiastolic,
        heartRate: v.heartRate,
      }))
    : [];

  if (error) return <ErrorState message={error} />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-4">
      <PageHeader title="Vitals Dashboard" subtitle="Live vitals and abnormal alerts" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></> : (
          <>
            <KpiCard icon={Activity} label="Total Recorded" value={String(vitals.length)} delta="—" deltaUp sub="today" color="#0F7D7A" />
            <KpiCard icon={AlertTriangle} label="Abnormal" value={String(criticalCount)} delta="—" deltaUp={false} sub="require review" color="#EF4444" />
            <KpiCard icon={Heart} label="Latest BP" value={latest ? `${latest.bloodPressureSystolic || "—"}/${latest.bloodPressureDiastolic || "—"}` : "—"} delta="—" deltaUp sub="mmHg" color="#36A09D" />
            <KpiCard icon={Zap} label="Latest SpO₂" value={latest?.spo2 != null ? `${latest.spo2}%` : "—"} delta="—" deltaUp sub="oxygen sat" color="#4CAF50" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">BP & Heart Rate Trend</h3>
              <p className="text-xs text-muted-foreground">{selectedPatient ? getName(selectedPatient) : "Select a patient"}</p>
            </div>
          </div>
          {loading ? (
            <div className="h-[220px] rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 0, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="systolic" stroke="#0F7D7A" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="diastolic" stroke="#36A09D" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="heartRate" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl p-5" style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-foreground">Abnormal Alerts</h3>
            {!loading && <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center pulse-soft">{criticalCount}</span>}
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {loading ? (
              <>
                <div className="h-16 rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
                <div className="h-16 rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
                <div className="h-16 rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
              </>
            ) : (
              <>
                {abnormal.slice(0, 8).map((v, i) => (
                  <motion.button
                    key={v.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPatient(v)}
                    className="w-full flex gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: selectedPatient?.id === v.id ? "#FEF2F2" : "#FFFBEB",
                      border: `1px solid ${selectedPatient?.id === v.id ? "rgba(244,67,54,0.15)" : "rgba(255,183,77,0.2)"}`,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div className="w-1.5 rounded-full flex-shrink-0 mt-0.5 bg-red-500" style={{ minHeight: 32 }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-foreground truncate">{getName(v)}</span>
                        <span className="text-[11px] text-muted-foreground flex-shrink-0">{formatTime(v.recordedAt)}</span>
                      </div>
                      <div className="text-xs font-bold mt-1" style={{ color: "#B91C1C" }}>{alertText(v)}</div>
                    </div>
                  </motion.button>
                ))}
                {abnormal.length === 0 && <div className="text-sm text-muted-foreground text-center py-6">No abnormal vitals.</div>}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
          <h3 className="text-base font-bold text-foreground">Latest Vitals</h3>
        </div>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <tr className="text-left">
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground">Patient</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground">BP (mmHg)</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground">HR (bpm)</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground">Temp (°C)</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground">SpO₂ (%)</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={5} cols={7} />
            ) : (
              <>
                {vitals.slice(0, 10).map(v => (
                  <tr key={v.id} className="border-b" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
                    <td className="px-4 py-3 font-semibold text-foreground">{getName(v)}</td>
                    <td className="px-4 py-3"><span className={`font-bold ${v.bloodPressureSystolic > 140 ? "text-red-600" : "text-foreground"}`}>{v.bloodPressureSystolic || "—"}/{v.bloodPressureDiastolic || "—"}</span></td>
                    <td className="px-4 py-3 text-foreground">{v.heartRate || "—"}</td>
                    <td className="px-4 py-3"><span className={`font-bold ${Number(v.temperature) > 37.8 ? "text-red-600" : "text-foreground"}`}>{v.temperature || "—"}</span></td>
                    <td className="px-4 py-3"><span className={`font-bold ${v.spo2 != null && v.spo2 < 94 ? "text-red-600" : "text-foreground"}`}>{v.spo2 != null ? `${v.spo2}%` : "—"}</span></td>
                    <td className="px-4 py-3"><StatusPill status={isAbnormal(v) ? "critical" : "normal"} /></td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatTime(v.recordedAt)}</td>
                  </tr>
                ))}
                {vitals.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                  <Stethoscope size={28} className="mx-auto mb-2 opacity-40" />No vitals recorded.
                </td></tr>}
              </>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default VitalsDashboard;
