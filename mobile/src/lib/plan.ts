import AsyncStorage from "@react-native-async-storage/async-storage";

export type PlanType = "individual" | "family";
export type FamilyRole = "Mum" | "Dad" | "Spouse" | "Child" | "Grandparent" | "Other";

/** Nobody picked a role — allowed, the agent just won't assume one. */
export type AccountRole = FamilyRole | "Just me" | "Unspecified";

export interface PlanChoice {
  type: PlanType;
  /** Who this account belongs to. */
  role: AccountRole;
  /** Family members to register alongside (family plan only). */
  members: { name: string; role: FamilyRole }[];
}

const KEY = "mh.plan";

export async function savePlan(plan: PlanChoice): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(plan));
  } catch {
    /* Onboarding must never trap the user on a storage failure. */
  }
}

export async function loadPlan(): Promise<PlanChoice | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PlanChoice) : null;
  } catch {
    return null;
  }
}
