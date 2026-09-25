import { type PatientContext } from "./types";

/**
 * Guided triage pathways (Agentic AI MVP, function 3).
 *
 * Four decision pathways — hypertension, fever/infection, respiratory risk,
 * medication non-adherence. Each has:
 *   - `detect`: does this pathway own the patient's message + recent vitals?
 *   - targeted symptom questions with tappable options,
 *   - a recommendation rule mapping answers onto safe next steps.
 *
 * The pathways never diagnose. They end in one of three outcomes: monitor
 * (self-care + recheck), review (book nurse / message team), or urgent
 * (seek care now + escalation row).
 */

export type TriageOutcome = "monitor" | "review" | "urgent";

export interface TriagePathway {
  id: "hypertension" | "fever" | "respiratory" | "adherence";
  triggers: RegExp[];
  questions: { content: string; options: { label: string; value: string }[] }[];
  recommend: (answers: string[], ctx: PatientContext) => { outcome: TriageOutcome; advice: string };
}

const DANGER = ["breath", "chest", "confus", "faint", "unconscious", "bleed", "stroke", "vomit", "weakness"];

function hasDanger(answers: string[]): boolean {
  const joined = answers.join(" ").toLowerCase();
  return DANGER.some((d) => joined.includes(d));
}

export const TRIAGE_PATHWAYS: TriagePathway[] = [
  {
    id: "hypertension",
    triggers: [/blood pressure|\bbp\b|hypertens|headache|dizz/i],
    questions: [
      {
        content: "Is your blood pressure high right now? Rest 5 minutes, recheck, and tell me the numbers if you have them.",
        options: [
          { label: "Below 140/90", value: "bp_normal" },
          { label: "140–159 / 90–99", value: "bp_stage1" },
          { label: "160+ / 100+", value: "bp_stage2" },
          { label: "No cuff nearby", value: "bp_unknown" },
        ],
      },
      {
        content: "Any of these with it — chest pain, severe headache, vision changes, weakness, confusion, trouble breathing?",
        options: [
          { label: "None of these", value: "sym_none" },
          { label: "Headache or dizziness", value: "sym_mild" },
          { label: "Yes, one or more", value: "sym_danger" },
        ],
      },
    ],
    recommend: (answers) => {
      if (answers.includes("sym_danger") || hasDanger(answers))
        return { outcome: "urgent", advice: "With these symptoms alongside high blood pressure, please seek urgent care now — do not wait for a review slot." };
      if (answers.includes("bp_stage2"))
        return { outcome: "review", advice: "That reading needs a clinician's eyes today. Rest, avoid salt and exertion, and book a nurse review — I can arrange one." };
      if (answers.includes("bp_stage1") || answers.includes("sym_mild"))
        return { outcome: "review", advice: "Recheck in 30 minutes after sitting quietly. If it stays up, book a nurse review today." };
      return { outcome: "monitor", advice: "Recheck tomorrow morning and keep taking your medication as prescribed. I'll keep watching the trend." };
    },
  },
  {
    id: "fever",
    triggers: [/fever|temperature|hot|chills|malaria|infection/i],
    questions: [
      {
        content: "What is your temperature right now, if you can check?",
        options: [
          { label: "Below 38°C", value: "temp_low" },
          { label: "38–39°C", value: "temp_mid" },
          { label: "Above 39°C", value: "temp_high" },
          { label: "No thermometer", value: "temp_unknown" },
        ],
      },
      {
        content: "Any of these — difficulty breathing, confusion, severe weakness, persistent vomiting, stiff neck?",
        options: [
          { label: "None", value: "sym_none" },
          { label: "Mild body aches", value: "sym_mild" },
          { label: "Yes, one or more", value: "sym_danger" },
        ],
      },
    ],
    recommend: (answers) => {
      if (answers.includes("sym_danger") || hasDanger(answers))
        return { outcome: "urgent", advice: "Fever with these signs needs urgent care now. Please go to a clinic or emergency unit." };
      if (answers.includes("temp_high"))
        return { outcome: "review", advice: "That fever needs review today. Cool down, hydrate, and book a nurse review — malaria and infection should be ruled out." };
      if (answers.includes("temp_mid"))
        return { outcome: "review", advice: "Repeat your temperature in 30 minutes. If it holds or rises, book a nurse review today." };
      return { outcome: "monitor", advice: "Rest and hydrate, and recheck in a few hours. If fever appears or you worsen, come back to me." };
    },
  },
  {
    id: "respiratory",
    triggers: [/breath|cough|oxygen|spo2|chest|wheez|asthma/i],
    questions: [
      {
        content: "How is your breathing right now?",
        options: [
          { label: "Normal", value: "br_normal" },
          { label: "Fast but okay", value: "br_fast" },
          { label: "Difficult / short of breath", value: "br_hard" },
        ],
      },
      {
        content: "Do you know your oxygen (SpO2) reading? Below 94% matters.",
        options: [
          { label: "94% or above", value: "ox_ok" },
          { label: "Below 94%", value: "ox_low" },
          { label: "Can't check", value: "ox_unknown" },
        ],
      },
    ],
    recommend: (answers, ctx) => {
      const latest = ctx.recentVitals[0];
      const lowOx = latest?.spo2 != null && latest.spo2 < 94;
      if (answers.includes("br_hard") || answers.includes("ox_low") || lowOx || hasDanger(answers))
        return { outcome: "urgent", advice: "Low oxygen or difficult breathing needs urgent care now. Please seek care immediately." };
      if (answers.includes("br_fast"))
        return { outcome: "review", advice: "Sit upright, rest, and recheck in 15 minutes. If breathing stays fast, book a nurse review today." };
      return { outcome: "monitor", advice: "Keep an eye on it and recheck later. If breathing worsens at any point, come straight back." };
    },
  },
  {
    id: "adherence",
    triggers: [/missed|forgot.*(drug|med|pill|tablet)|skipped|ran out|refill|adher/i],
    questions: [
      {
        content: "Which best describes the situation?",
        options: [
          { label: "Missed one dose", value: "adh_once" },
          { label: "Missed several doses", value: "adh_multi" },
          { label: "Ran out / need refill", value: "adh_refill" },
        ],
      },
    ],
    recommend: (answers) => {
      if (answers.includes("adh_refill"))
        return { outcome: "review", advice: "Don't stop treatment — request a refill today. I can help you message the care team about it." };
      if (answers.includes("adh_multi"))
        return { outcome: "review", advice: "Several missed doses can let your condition slip. Take today's dose if due, and book a quick review so a clinician can check you're still on track." };
      return { outcome: "monitor", advice: "One missed dose happens. Take it if it's still due today — don't double up tomorrow — and confirm with me next time." };
    },
  },
];

/** Which pathway, if any, owns this message + vitals snapshot. */
export function matchPathway(message: string, ctx?: PatientContext, opts?: { aboutSomeoneElse?: boolean }): TriagePathway | null {
  for (const p of TRIAGE_PATHWAYS) {
    if (p.triggers.some((t) => t.test(message))) return p;
  }
  // Vitals-driven fallback: concerning numbers with no clear topic.
  // Skipped when asking ABOUT someone — "how is Dad?" is a question for
  // the agent, not a symptom report, and must reach chat, not triage.
  if (opts?.aboutSomeoneElse) return null;
  if (ctx?.recentVitals[0]) {
    const v = ctx.recentVitals[0];
    if (v.bloodPressureSystolic != null && v.bloodPressureSystolic >= 140) return TRIAGE_PATHWAYS[0];
    if (v.temperature != null && v.temperature >= 38) return TRIAGE_PATHWAYS[1];
    if (v.spo2 != null && v.spo2 < 94) return TRIAGE_PATHWAYS[2];
  }
  return null;
}

/** Parse pathway answers ("triage:hypertension:bp_stage2+sym_none") from chat text. */
export function parseTriageAnswer(message: string): { pathwayId: string; values: string[] } | null {
  const m = message.match(/triage:([a-z]+):([a-z0-9_+]+)/i);
  if (!m) return null;
  return { pathwayId: m[1].toLowerCase(), values: m[2].split("+") };
}
