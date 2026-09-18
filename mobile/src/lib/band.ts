import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Whether this patient has a band connected.
 *
 * The wearable feed in this build is a simulator — there is no device to read
 * from — but it stands in for one, so it has to behave like one. Running it
 * unconditionally meant a patient who had just signed up and skipped the
 * wearable step was handed fabricated readings within seconds of arriving,
 * which is both dishonest and the reason a brand-new account never showed the
 * empty states it should.
 *
 * Kept on the device rather than the server because it describes *this*
 * phone's pairing, not the patient's record.
 */

const key = (patientId: string) => `mh:band-connected:${patientId}`;

/**
 * @param fallback Used until the stored value is read, and when there isn't
 *   one. An account that already has readings is treated as connected — that
 *   is how the seeded demo patient behaves, and it means existing accounts
 *   keep their feed without anyone having to re-pair.
 */
export function useBandConnected(patientId?: string, fallback = false) {
  const [connected, setConnected] = useState(fallback);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    AsyncStorage.getItem(key(patientId))
      .then((stored) => {
        if (cancelled || stored === null) return;
        setConnected(stored === "true");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return connected;
}

/** Remember that this patient paired a band, so the feed starts for them. */
export async function setBandConnected(patientId: string, connected: boolean) {
  try {
    await AsyncStorage.setItem(key(patientId), String(connected));
  } catch {
    /* Losing the flag costs the patient a re-pair, nothing worse. */
  }
}
