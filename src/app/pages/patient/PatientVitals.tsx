import React, { useState } from "react";
import { CheckCircle, Activity, Heart, Thermometer, Loader2 } from "lucide-react";
import { TrendingUp as TU } from "lucide-react";
import StatusPill from "../../components/shared/StatusPill";
import { useAuth } from "../../hooks/useAuth";
import { usePatientData } from "../../hooks/usePatientData";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";

const NORMAL_RANGES: Record<string, { min: number; max: number; unit: string }> = {
  bloodSugar: { min: 3.9, max: 6.1, unit: "mmol/L" },
  bloodPressureSystolic: { min: 90, max: 120, unit: "mmHg" },
  heartRate: { min: 60, max: 100, unit: "bpm" },
  temperature: { min: 36.1, max: 37.2, unit: "°C" },
  spo2: { min: 95, max: 100, unit: "%" },
};

interface Vital {
  id: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  spo2?: number;
  bloodSugar?: number;
  recordedAt: string;
}

function getLatest(vitals: Vital[], key: keyof Vital): number | null {
  for (const v of vitals) {
    if (v[key] != null) return v[key] as number;
  }
  return null;
}

function isAbnormal(vitals: Vital[]): boolean {
  const latest = vitals[0];
  if (!latest) return false;
  if (latest.bloodPressureSystolic != null && (latest.bloodPressureSystolic < 90 || latest.bloodPressureSystolic > 140)) return true;
  if (latest.bloodPressureDiastolic != null && (latest.bloodPressureDiastolic < 60 || latest.bloodPressureDiastolic > 90)) return true;
  if (latest.heartRate != null && (latest.heartRate < 60 || latest.heartRate > 100)) return true;
  if (latest.temperature != null && (latest.temperature < 36.1 || latest.temperature > 37.8)) return true;
  if (latest.spo2 != null && latest.spo2 < 95) return true;
  if (latest.bloodSugar != null && (latest.bloodSugar < 3.9 || latest.bloodSugar > 7.8)) return true;
  return false;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PatientVitals() {
  const { user } = useAuth();
  const { vitals, loading, error, refresh } = usePatientData();

  const abnormal = vitals.length > 0 && isAbnormal(vitals);

  const bpS = getLatest(vitals, "bloodPressureSystolic");
  const bpD = getLatest(vitals, "bloodPressureDiastolic");
  const hr = getLatest(vitals, "heartRate");
  const temp = getLatest(vitals, "temperature");
  const spo2 = getLatest(vitals, "spo2");
  const bs = getLatest(vitals, "bloodSugar");

  const cards = [
    bpS != null ? { label: "Blood Pressure", value: `${bpS}/${bpD ?? "—"}`, ref: `Normal (< 120/80)`, icon: Heart, ok: bpS < 140 && (bpD ?? 0) < 90 } : null,
    hr != null ? { label: "Heart Rate", value: `${hr} bpm`, ref: `Normal (60–100)`, icon: Activity, ok: hr >= 60 && hr <= 100 } : null,
    temp != null ? { label: "Temperature", value: `${temp}°C`, ref: `Normal (36.1–37.2)`, icon: Thermometer, ok: temp >= 36.1 && temp <= 37.2 } : null,
    spo2 != null ? { label: "SpO2", value: `${spo2}%`, ref: `Normal (95–100)`, icon: Heart, ok: spo2 >= 95 } : null,
    bs != null ? { label: "Blood Sugar", value: `${bs} mmol/L`, ref: `Normal (3.9–6.1)`, icon: Activity, ok: bs >= 3.9 && bs <= 6.1 } : null,
  ].filter(Boolean) as { label: string; value: string; ref: string; icon: React.ElementType; ok: boolean }[];

  return (
    <div className="py-4 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">My Health</h2>
        <button className="text-xs font-medium" style={{ color: "#0F7D7A" }}>View trends</button>
      </div>

      {error && <ErrorState message={error} onRetry={refresh} />}

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="rounded-2xl p-4" style={{
            background: abnormal ? "linear-gradient(135deg, #FFF7ED, #FED7AA)" : "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
            border: abnormal ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(16,185,129,0.15)"
          }}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} style={{ color: abnormal ? "#F59E0B" : "#10B981" }} />
              <span className="text-sm font-semibold" style={{ color: abnormal ? "#92400E" : "#065F46" }}>
                {abnormal ? "Needs Attention" : "All Good"}
              </span>
            </div>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              {abnormal ? "Some vitals are outside normal range." : "Your recent vitals are within normal range."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {cards.map(({ label, value, ref, icon: Icon, ok }) => (
              <div key={label} className="p-4 rounded-xl" style={{ background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: "#E6F7F6" }}>
                  <Icon size={14} style={{ color: "#0F7D7A" }} />
                </div>
                <p className="text-sm font-bold text-foreground">{value}</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{ref}</p>
              </div>
            ))}
            {cards.length === 0 && vitals.length > 0 && (
              <div className="col-span-2 text-center py-4 text-sm text-muted-foreground">No recent vital readings available.</div>
            )}
          </div>

          <h3 className="text-sm font-semibold text-foreground">Recent Readings</h3>
          {vitals.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">No readings recorded yet.</div>
          ) : (
            vitals.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#E6F7F6" }}>
                  <span className="text-[10px] font-bold" style={{ color: "#0F7D7A" }}>{formatDate(r.recordedAt)}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">
                    {formatDate(r.recordedAt)} 
                    {r.bloodPressureSystolic ? ` — BP: ${r.bloodPressureSystolic}/${r.bloodPressureDiastolic ?? "—"}` : ""}
                    {r.bloodSugar ? ` · BS: ${r.bloodSugar} mmol/L` : ""}
                    {r.heartRate ? ` · HR: ${r.heartRate}` : ""}
                  </p>
                </div>
                <StatusPill status={abnormal && vitals[0]?.id === r.id ? "pending" : "active"} />
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

export default PatientVitals;
