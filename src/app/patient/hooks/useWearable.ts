import { useState, useEffect, useCallback, useRef } from "react";
import { wearableService, type WearableReading } from "../../services/wearable.service";
import { vitalService } from "../../services/vital.service";

export interface WearableState {
  connected: boolean;
  batteryLevel: number;
  lastSynced?: string;
  latest?: WearableReading;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ------------------------------------------------------------------ */
/* The band simulator                                                  */
/* ------------------------------------------------------------------ */

/**
 * What a real band does that `Math.random()` does not.
 *
 * The first version of this drew each packet from scratch — every value an
 * independent uniform roll around its own mean. That is not what a body looks
 * like, and it showed: the sparklines rendered as noise rather than as a
 * trace, and no two measures agreed with each other. A heart rate of 95 and a
 * respiration rate of 12 are not a thing that happens.
 *
 * So the simulator carries state and produces a *coherent* packet:
 *
 *   - every measure is a bounded random walk with mean reversion, so it drifts
 *     and recovers the way a real signal does instead of teleporting;
 *   - the measures are derived from one another, because they are all being
 *     read off the same body. Heart rate leads; respiration tracks it; HRV
 *     moves inversely to it; stress falls out of HRV and skin conductance; and
 *     skin conductance rises with stress, closing the loop.
 *
 * None of this is clinically exact. It is *plausible*, which is what makes the
 * charts worth looking at during a demo — a trend you can see is a trend the
 * UI can be judged against.
 */
interface BandState {
  heartRate: number;
  temperature: number;
  gsr: number;
  fatigue: number;
  /** Persona baselines: the walk reverts to THEIR numbers, not fixed ones. */
  baseHr: number;
  baseSys: number;
  baseDia: number;
  baseSpo2: number;
}

const clamp = (n: number, lo: number, hi: number) => (n < lo ? lo : n > hi ? hi : n);
const jitter = (amp: number) => (Math.random() - 0.5) * 2 * amp;

/** Resting heart rate the walk is pulled back toward. */
const HR_RESTING = 72;

/**
 * Advance the state by one packet and derive everything else from it.
 *
 * `baseHr` lets a caller seed a different resting rate (an older patient, an
 * unwell one) without every measure having to be re-derived.
 */
function step(state: BandState): BandState {
  /* Mean-reverting walk: the pull toward rest grows with the distance from
     it, so excursions are possible but do not run away. Rest is personal —
     the state carries each patient's own baselines. */
  const heartRate = clamp(
    state.heartRate + (state.baseHr - state.heartRate) * 0.12 + jitter(2.6),
    48,
    132
  );

  /* Fatigue accumulates slowly and recovers slowly — it is the one measure
     that should look different from the others on a chart: a slow ramp, not a
     wobble. */
  const fatigue = clamp(state.fatigue + jitter(1.6) + (heartRate > 88 ? 0.5 : -0.2), 5, 92);

  const gsr = clamp(state.gsr + jitter(0.7), 1.5, 24);
  const temperature = clamp(state.temperature + (36.65 - state.temperature) * 0.1 + jitter(0.06), 35.9, 38.4);

  return { heartRate, temperature, gsr, fatigue };
}

function packetFrom(state: BandState, patientId: string): WearableReading {
  const hr = Math.round(state.heartRate);

  /* Respiration tracks heart rate at roughly a 1:4 ratio — about four breaths
     per twenty beats — which is the relationship a band actually uses to
     estimate it. */
  const respiratoryRate = Number(clamp(12 + (hr - 60) * 0.11 + jitter(0.8), 8, 26).toFixed(1));

  /* HRV moves *inversely* to heart rate: a faster, more stressed heart has
     less beat-to-beat variation, which is why a falling HRV is the early
     warning sign. */
  const hrv = Number(clamp(62 - (hr - 65) * 1.5 + jitter(4), 9, 110).toFixed(0));

  /* Stress is the inverse of HRV, nudged by skin conductance — the same two
     inputs the stress index uses on a real device. */
  const stress = Math.round(
    clamp(100 - hrv * 1.15 + state.gsr * 1.6 + jitter(3), 2, 98)
  );

  /* SpO2 sits high and steady; the occasional dip is what gives the apnea and
     hypoxia detection something to find. */
  const spo2 = Math.round(clamp(state.baseSpo2 + jitter(1.1) - (Math.random() < 0.03 ? 3 : 0), 92, 100));

  const systolic = Math.round(clamp(state.baseSys + (hr - state.baseHr) * 0.35 + jitter(4), 96, 158));
  const diastolic = Math.round(clamp(state.baseDia + (hr - state.baseHr) * 0.2 + jitter(3), 58, 102));

  return {
    patientId,
    timestamp: new Date().toISOString(),
    heartRate: hr,
    spo2,
    temperature: Number(state.temperature.toFixed(1)),
    systolic,
    diastolic,
    respiratoryRate,
    hrv,
    stress,
    fatigue: Math.round(state.fatigue),
    gsr: Number(state.gsr.toFixed(1)),
  };
}

/** A fresh simulator state, seeded around a resting heart rate. */
function initialBandState(baseHr: number, seed?: { sys?: number; dia?: number; spo2?: number }): BandState {
  return {
    heartRate: baseHr,
    temperature: 36.6,
    gsr: 6,
    fatigue: 22,
    baseHr,
    baseSys: seed?.sys ?? 118,
    baseDia: seed?.dia ?? 76,
    baseSpo2: seed?.spo2 ?? 98,
  };
}

export function useWearable(patientId?: string, enabled = true, baseHr = HR_RESTING) {
  const [state, setState] = useState<WearableState>({
    connected: false,
    batteryLevel: 78,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const patientIdRef = useRef(patientId);
  /* The walk lives in a ref, not in React state: it is written on every tick
     and read on the next one, and nothing renders from it directly — the
     derived packet does. Putting it in state would re-render twice a tick for
     a value no component reads. */
  const bandRef = useRef<BandState>(initialBandState(baseHr));

  useEffect(() => { patientIdRef.current = patientId; }, [patientId]);

  const connect = useCallback(() => {
    setState((s) => ({ ...s, connected: true, lastSynced: "Just now" }));
  }, []);

  useEffect(() => {
    if (!enabled || !patientId) return;
    connect();

    /* Seed the walk from the patient's OWN latest row, so live readings
       continue their story instead of resetting everyone to 118/76. Falls
       back to the resting defaults for brand-new accounts. */
    vitalService
      .getByPatient(patientId)
      .then((rows) => {
        const last = rows?.[0];
        if (last) {
          bandRef.current = initialBandState(last.heartRate ?? baseHr, {
            sys: last.bloodPressureSystolic ?? undefined,
            dia: last.bloodPressureDiastolic ?? undefined,
            spo2: last.spo2 ?? undefined,
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        // Send first reading immediately so Home/Vitals have data
        const first = packetFrom(bandRef.current, patientId);
        wearableService.sendReading(first).catch(() => {});
        setState((s) => ({ ...s, latest: first, lastSynced: formatTime(new Date(first.timestamp)) }));
      });

    intervalRef.current = setInterval(() => {
      const id = patientIdRef.current;
      if (!id) return;
      bandRef.current = step(bandRef.current);
      const reading = packetFrom(bandRef.current, id);
      wearableService.sendReading(reading).catch(() => {});
      setState((s) => ({
        ...s,
        connected: true,
        latest: reading,
        lastSynced: formatTime(new Date(reading.timestamp)),
        batteryLevel: Math.max(10, (s.batteryLevel ?? 78) - 0.02),
      }));
    }, 8000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, patientId, baseHr, connect]);

  return { ...state, connect };
}
