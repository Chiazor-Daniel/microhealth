import { useState, useEffect, useCallback, useRef } from "react";

export interface WearableReading {
  patientId: string;
  timestamp: string;
  heartRate: number;
  spo2: number;
  temperature: number;
  systolic: number;
  diastolic: number;
}

export interface WearableState {
  connected: boolean;
  batteryLevel: number;
  lastSynced?: string;
  latest?: WearableReading;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function generateReading(patientId: string, baseHr = 72): WearableReading {
  const hr = baseHr + Math.round((Math.random() - 0.5) * 6);
  return {
    patientId,
    timestamp: new Date().toISOString(),
    heartRate: Math.max(55, Math.min(110, hr)),
    spo2: Math.max(94, Math.min(100, 98 + Math.round((Math.random() - 0.5) * 2))),
    temperature: Number((36.4 + (Math.random() - 0.5) * 0.6).toFixed(1)),
    systolic: Math.max(100, Math.min(150, 118 + Math.round((Math.random() - 0.5) * 8))),
    diastolic: Math.max(60, Math.min(95, 76 + Math.round((Math.random() - 0.5) * 6))),
  };
}

export function useWearable(patientId?: string, enabled = true) {
  const [state, setState] = useState<WearableState>({
    connected: false,
    batteryLevel: 78,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connect = useCallback(() => {
    setState((s) => ({ ...s, connected: true, lastSynced: "Just now" }));
  }, []);

  useEffect(() => {
    if (!enabled || !patientId) return;
    connect();
    intervalRef.current = setInterval(() => {
      setState((s) => {
        const reading = generateReading(patientId);
        return {
          ...s,
          connected: true,
          latest: reading,
          lastSynced: formatTime(new Date(reading.timestamp)),
          batteryLevel: Math.max(10, s.batteryLevel - 0.02),
        };
      });
    }, 8000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, patientId, connect]);

  return { ...state, connect };
}
