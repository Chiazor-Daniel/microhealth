import { api } from "./api";

export interface Vital {
  id: string;
  patientId: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  spo2?: number;
  bloodSugar?: number;
  weight?: number;
  /* Wide-packet additions — see the `vitals` table in the backend schema. */
  respiratoryRate?: number;
  hrv?: number;
  stress?: number;
  fatigue?: number;
  gsr?: number;
  notes?: string;
  recordedAt: string;
}

/**
 * A reading recorded on its own schedule rather than on the band's tick.
 *
 * One generic shape for sleep, ECG, composition, glucose and the lipid panel —
 * see `metric_readings` in the backend schema for why they share it. `meta`
 * carries whatever is metric-specific and has no column.
 */
export interface MetricRecord {
  id: string;
  patientId: string;
  metricKey: string;
  value: number | null;
  value2?: number | null;
  unit?: string | null;
  source?: string | null;
  meta?: string | null;
  notes?: string | null;
  recordedAt: string;
}

export const vitalService = {
  getByPatient: (patientId: string) => api.get<Vital[]>(`/vitals/patient/${patientId}`),
  getTrends: (patientId: string) => api.get<Vital[]>(`/vitals/trends/${patientId}`),
  record: (data: Partial<Vital>) => api.post<Vital>("/vitals", data),
  getAbnormal: () => api.get<Vital[]>("/vitals/abnormal"),

  /**
   * Episodic readings. `keys` narrows to specific metrics so a screen drawing
   * one chart does not pull the patient's whole record.
   */
  getMetricReadings: (patientId: string, keys?: string[]) =>
    api.get<MetricRecord[]>(
      `/vitals/metric-readings/${patientId}${keys?.length ? `?keys=${keys.join(",")}` : ""}`
    ),

  /** The newest reading of each requested metric, one per key. */
  getLatestMetricReadings: (patientId: string, keys: string[]) =>
    api.get<Record<string, MetricRecord>>(
      `/vitals/metric-readings/${patientId}/latest?keys=${keys.join(",")}`
    ),

  recordMetric: (data: {
    patientId: string;
    metricKey: string;
    value?: number | null;
    value2?: number | null;
    unit?: string;
    source?: string;
    meta?: string;
    notes?: string;
  }) => api.post<MetricRecord>("/vitals/metric-readings", data),
};
