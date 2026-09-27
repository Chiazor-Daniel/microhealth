import { sqliteTable, text as sqliteText, integer as sqliteInt, real as sqliteReal } from "drizzle-orm/sqlite-core";
import { pgTable, text as pgText, integer as pgInt, real as pgReal, timestamp as pgTs, boolean as pgBool } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

/**
 * Dual dialect: SQLite locally, Postgres (Neon) in the cloud.
 *
 * One schema file serves both. `DATABASE_URL` starting with postgres://
 * selects pg builders; anything else stays on SQLite. Column usage is kept
 * to the shared subset (text/integer/real) plus the `ts`/`bool` helpers
 * below, so neither dialect sees a type it cannot build.
 */
export const IS_PG = /^postgres(ql)?:\/\//.test(process.env.DATABASE_URL ?? "");

const table = (IS_PG ? pgTable : sqliteTable) as unknown as typeof sqliteTable;
const text = (IS_PG ? pgText : sqliteText) as typeof sqliteText;
const integer = (IS_PG ? pgInt : sqliteInt) as typeof sqliteInt;
const real = (IS_PG ? pgReal : sqliteReal) as typeof sqliteReal;

const id = () => text("id").$defaultFn(() => randomUUID()).primaryKey();
/* Reference builders: the helpers below must expose exactly these types so
   every consumer keeps the nullability it always had. */
const _tsRef = (name: string) => sqliteInt(name, { mode: "timestamp" }).$defaultFn(() => new Date()).notNull();
const _boolRef = (name: string) => sqliteInt(name, { mode: "boolean" }).default(false);
const ts = (name: string): ReturnType<typeof _tsRef> =>
  IS_PG
    ? (pgTs(name).$defaultFn(() => new Date()).notNull() as unknown as ReturnType<typeof _tsRef>)
    : _tsRef(name);
const bool = (name: string, def = false): ReturnType<typeof _boolRef> =>
  IS_PG
    ? (pgBool(name).default(def) as unknown as ReturnType<typeof _boolRef>)
    : sqliteInt(name, { mode: "boolean" }).default(def) as unknown as ReturnType<typeof _boolRef>;
/** Nullable timestamp (matches the columns that never had .notNull()). */
const tsOpt = (name: string) =>
  IS_PG
    ? (pgTs(name).$defaultFn(() => new Date()) as unknown as ReturnType<typeof integer>)
    : integer(name, { mode: "timestamp" }).$defaultFn(() => new Date());

export const users = table("users", {
  id: id(),
  email: text("email").unique(),
  phone: text("phone"),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("patient"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  avatarUrl: text("avatar_url"),
  lastLoginAt: tsOpt("last_login_at"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  patient: one(patients, {
    fields: [users.id],
    references: [patients.userId],
  }),
  staff: one(staff, {
    fields: [users.id],
    references: [staff.userId],
  }),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "recipient" }),
  notifications: many(notifications),
}));

export const patients = table("patients", {
  id: id(),
  userId: text("user_id").references(() => users.id).unique(),
  patientCode: text("patient_code").unique().notNull(),
  age: integer("age"),
  gender: text("gender"),
  bloodGroup: text("blood_group"),
  diagnosis: text("diagnosis"),
  status: text("status").default("active"),
  ward: text("ward"),
  doctorId: text("doctor_id").references(() => staff.id),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, {
    fields: [patients.userId],
    references: [users.id],
  }),
  doctor: one(staff, {
    fields: [patients.doctorId],
    references: [staff.id],
  }),
  appointments: many(appointments),
  vitals: many(vitals),
  metricReadings: many(metricReadings),
  labTests: many(labTests),
  prescriptions: many(prescriptions),
  payments: many(payments),
  referrals: many(referrals),
  familyMembers: many(familyMembers),
}));

export const staff = table("staff", {
  id: id(),
  userId: text("user_id").references(() => users.id).unique(),
  role: text("role").notNull(),
  department: text("department").notNull(),
  status: text("status").default("on-duty"),
  patientCount: integer("patient_count").default(0),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const staffRelations = relations(staff, ({ one, many }) => ({
  user: one(users, {
    fields: [staff.userId],
    references: [users.id],
  }),
  patients: many(patients),
  appointmentsAsDoctor: many(appointments, { relationName: "doctor" }),
  vitalsRecorded: many(vitals, { relationName: "recordedBy" }),
  labTestsOrdered: many(labTests, { relationName: "doctor" }),
  prescriptionsIssued: many(prescriptions, { relationName: "doctor" }),
  referralsFrom: many(referrals, { relationName: "fromDoctor" }),
}));

export const appointments = table("appointments", {
  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  doctorId: text("doctor_id").references(() => staff.id).notNull(),
  department: text("department"),
  scheduledDate: text("scheduled_date").notNull(),
  scheduledTime: text("scheduled_time").notNull(),
  status: text("status").default("confirmed"),
  notes: text("notes"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(staff, {
    fields: [appointments.doctorId],
    references: [staff.id],
  }),
}));

/**
 * The band's wide packet: several measures co-recorded on one row.
 *
 * These are the metrics the MicroHealth band reports *together*, every few
 * seconds — which is why they live as columns rather than as individual
 * records. A row here is "what the band saw at this instant", and heart rate
 * and respiration on the same row genuinely are the same instant.
 *
 * Metrics that arrive on their own schedule — a night of sleep, an ECG
 * capture, a body-composition scan, a lab panel — do *not* belong here; one
 * row per measure is what `metricReadings` is for. Adding a sparse column here
 * for something recorded monthly would leave the table almost entirely null.
 *
 * The metric registry in `src/metrics/registry.ts` is the authoritative list;
 * a column here exists to feed a metric whose `source` is "vitals".
 */
export const vitals = table("vitals", {
  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  heartRate: integer("heart_rate"),
  temperature: real("temperature"),
  spo2: integer("spo2"),
  bloodSugar: real("blood_sugar"),
  weight: real("weight"),
  /* ---- Wide-packet additions ---- */
  respiratoryRate: real("respiratory_rate"),
  hrv: real("hrv"),
  stress: integer("stress"),
  fatigue: integer("fatigue"),
  gsr: real("gsr"),
  notes: text("notes"),
  recordedAt: ts("recorded_at"),
  recordedBy: text("recorded_by").references(() => staff.id),
});

/**
 * A single reading of any metric, recorded on its own schedule.
 *
 * Deliberately generic. Sleep, ECG, body composition, glucose and the lipid
 * panel have nothing in common structurally — a hypnogram, a 30-second
 * waveform, four proportions, a fingerstick and five analytes from one draw —
 * and giving each its own table would mean five migrations, five controllers
 * and five service methods for what is, at the storage layer, the same thing:
 * a value for a named metric at a time.
 *
 * What differs between them is *interpretation*, and that is not the database's
 * job. The registry says how each metric is read, banded and scored; this
 * table only records that a reading happened.
 *
 * `value` is the primary number and `value2` the secondary (blood pressure's
 * diastolic, a composition pair), so a two-part reading stays one row. `meta`
 * carries whatever is genuinely metric-specific and not worth a column —
 * the ECG's rhythm classification, a composition scan's device — as JSON.
 */
export const metricReadings = table("metric_readings", {
  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  /** Matches a `key` in src/metrics/registry.ts. */
  metricKey: text("metric_key").notNull(),
  value: real("value"),
  value2: real("value2"),
  unit: text("unit"),
  /**
   * Where the reading came from: "band", "cuff", "scale", "lab", "manual",
   * "agent". Kept because a patient should be able to tell a lab result from
   * a wearable estimate, and the two are not equally authoritative.
   */
  source: text("source").default("manual"),
  /** Free-form extras. JSON, and only for what has no column. */
  meta: text("meta"),
  notes: text("notes"),
  recordedAt: ts("recorded_at"),
});

export const vitalsRelations = relations(vitals, ({ one }) => ({
  patient: one(patients, {
    fields: [vitals.patientId],
    references: [patients.id],
  }),
  recorder: one(staff, {
    fields: [vitals.recordedBy],
    references: [staff.id],
  }),
}));

export const metricReadingsRelations = relations(metricReadings, ({ one }) => ({
  patient: one(patients, {
    fields: [metricReadings.patientId],
    references: [patients.id],
  }),
}));

export const labTests = table("lab_tests", {
  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  testName: text("test_name").notNull(),
  orderedAt: ts("ordered_at"),
  doctorId: text("doctor_id").references(() => staff.id),
  status: text("status").default("pending"),
  result: text("result"),
  resultNotes: text("result_notes"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const labTestsRelations = relations(labTests, ({ one }) => ({
  patient: one(patients, {
    fields: [labTests.patientId],
    references: [patients.id],
  }),
  doctor: one(staff, {
    fields: [labTests.doctorId],
    references: [staff.id],
  }),
}));

export const prescriptions = table("prescriptions", {
  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  medicine: text("medicine").notNull(),
  dosage: text("dosage").notNull(),
  duration: text("duration"),
  doctorId: text("doctor_id").references(() => staff.id),
  issuedAt: ts("issued_at"),
  status: text("status").default("pending"),
  refills: integer("refills").default(0),
  expiryDate: text("expiry_date"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
  doctor: one(staff, {
    fields: [prescriptions.doctorId],
    references: [staff.id],
  }),
}));

export const inventory = table("inventory", {
  id: id(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  stock: integer("stock").default(0),
  minStock: integer("min_stock").default(0),
  unit: text("unit").notNull(),
  unitCost: real("unit_cost"),
  status: text("status").default("ok"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const payments = table("payments", {
  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  service: text("service").notNull(),
  amount: real("amount").notNull(),
  method: text("method"),
  status: text("status").default("pending"),
  paidAt: ts("paid_at"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  patient: one(patients, {
    fields: [payments.patientId],
    references: [patients.id],
  }),
}));

export const referrals = table("referrals", {
  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  fromDoctorId: text("from_doctor_id").references(() => staff.id),
  toFacility: text("to_facility").notNull(),
  reason: text("reason"),
  status: text("status").default("pending"),
  referralDate: text("referral_date").$defaultFn(() => new Date().toISOString().split("T")[0]),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const referralsRelations = relations(referrals, ({ one }) => ({
  patient: one(patients, {
    fields: [referrals.patientId],
    references: [patients.id],
  }),
  fromDoctor: one(staff, {
    fields: [referrals.fromDoctorId],
    references: [staff.id],
  }),
}));

export const messages = table("messages", {
  id: id(),
  senderId: text("sender_id").references(() => users.id).notNull(),
  recipientId: text("recipient_id").references(() => users.id),
  content: text("content").notNull(),
  subject: text("subject"),
  isRead: bool("is_read"),
  sentAt: ts("sent_at"),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: "recipient",
  }),
}));

export const notifications = table("notifications", {
  id: id(),
  userId: text("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type"),
  subjectPatientId: text("subject_patient_id").references(() => patients.id),
  isRead: bool("is_read"),
  createdAt: ts("created_at"),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const familyMembers = table("family_members", {
  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  name: text("name").notNull(),
  relation: text("relation").notNull(),
  age: integer("age"),
  status: text("status").default("active"),
  createdAt: ts("created_at"),
});

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  patient: one(patients, {
    fields: [familyMembers.patientId],
    references: [patients.id],
  }),
}));

export const aiInsights = table("ai_insights", {
  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  type: text("type").notNull(),
  priority: text("priority").notNull().default("info"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  explanation: text("explanation"),
  suggestedActions: text("suggested_actions"),
  context: text("context"),
  isRead: bool("is_read"),
  dismissedAt: ts("dismissed_at"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  patient: one(patients, {
    fields: [aiInsights.patientId],
    references: [patients.id],
  }),
}));

/**
 * Nurse escalation queue (MVP function 4).
 *
 * The agent never manages high-risk situations alone: when triage or vitals
 * cross a threshold, a row lands here with the vitals snapshot and an
 * AI-written case summary. A clinician picks it up, acts, and resolves it —
 * every step logged on the row.
 */
export const escalations = table("escalations", {
  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  reason: text("reason").notNull(),
  urgency: text("urgency").notNull().default("routine"),
  vitalsSnapshot: text("vitals_snapshot"),
  caseSummary: text("case_summary"),
  status: text("status").notNull().default("open"),
  assignedStaffId: text("assigned_staff_id").references(() => staff.id),
  actionTaken: text("action_taken"),
  actionNote: text("action_note"),
  resolvedAt: ts("resolved_at"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const escalationsRelations = relations(escalations, ({ one }) => ({
  patient: one(patients, {
    fields: [escalations.patientId],
    references: [patients.id],
  }),
}));

/**
 * Medication adherence log (MVP function 5).
 *
 * One row per scheduled dose the agent reminds about: reminded at, confirmed
 * (patient tapped "taken"), or missed (window passed with no confirmation).
 * Repeated misses on a high-risk patient escalate.
 */
export const medicationLogs = table("medication_logs", {
  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  prescriptionId: text("prescription_id").references(() => prescriptions.id).notNull(),
  dueAt: ts("due_at").notNull(),
  remindedAt: ts("reminded_at"),
  confirmedAt: ts("confirmed_at"),
  status: text("status").notNull().default("due"),
  createdAt: ts("created_at"),
});

/**
 * Caregiver alert preferences (MVP function 6).
 *
 * Consent-based and per-category: the patient chooses which alert kinds each
 * trusted contact may receive. No row (or no consent) means no alerts.
 */
export const caregiverAlertPrefs = table("caregiver_alert_prefs", {  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  familyMemberId: text("family_member_id").references(() => familyMembers.id).notNull(),
  contactPhone: text("contact_phone"),
  alertAbnormal: bool("alert_abnormal", true),
  alertMissedMedication: bool("alert_missed_medication", true),
  alertUrgent: bool("alert_urgent", true),
  consentedAt: ts("consented_at"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

/**
 * Visit sessions (telemedicine room).
 *
 * Joining a visit opens a session on the appointment: who joined when, and
 * the summary written at the end. The video track itself joins later (needs
 * a native build); everything around it — shared vitals, chat, summary —
 * runs on this row today.
 */
export const visitSessions = table("visit_sessions", {
  id: id(),
  appointmentId: text("appointment_id").references(() => appointments.id).notNull(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  status: text("status").notNull().default("waiting"),
  joinedAt: ts("joined_at"),
  endedAt: ts("ended_at"),
  summary: text("summary"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

/**
 * Family plan foundation (Stage 1).
 *
 * A group is the shared care space. Membership links REAL patient accounts —
 * a row is only `active` once the invited person's own account is attached;
 * until then it sits as `invited` holding the contact it was sent to. Typed
 * names never become accounts (see the onboarding contract).
 */
export const familyGroups = table("family_groups", {
  id: id(),
  plan: text("plan").notNull().default("family"),
  createdBy: text("created_by").references(() => patients.id).notNull(),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export type FamilyRole = "Mum" | "Dad" | "Spouse" | "Child" | "Grandparent" | "Other";

export const familyMemberships = table("family_memberships", {
  id: id(),
  groupId: text("group_id").references(() => familyGroups.id).notNull(),
  patientId: text("patient_id").references(() => patients.id),
  role: text("role").notNull(),
  status: text("status").notNull().default("invited"),
  invitedContact: text("invited_contact"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const familyMembershipsRelations = relations(familyMemberships, ({ one }) => ({
  group: one(familyGroups, {
    fields: [familyMemberships.groupId],
    references: [familyGroups.id],
  }),
  patient: one(patients, {
    fields: [familyMemberships.patientId],
    references: [patients.id],
  }),
}));

/** Audit: who viewed whose health data, and when. */
export const familyViews = table("family_views", {
  id: id(),
  viewerPatientId: text("viewer_patient_id").references(() => patients.id).notNull(),
  subjectPatientId: text("subject_patient_id").references(() => patients.id).notNull(),
  createdAt: ts("created_at"),
});

/** Invite links: token resolves to a group + role without exposing health data. */
export const familyInvites = table("family_invites", {
  id: id(),
  token: text("token").notNull().unique(),
  groupId: text("group_id").references(() => familyGroups.id).notNull(),
  role: text("role").notNull(),
  createdBy: text("created_by").references(() => patients.id).notNull(),
  usedBy: text("used_by").references(() => patients.id),
  createdAt: ts("created_at"),
});

/**
 * Alert subscriptions — the reverse of caregiver prefs. "Whose alerts do I
 * want?" A subscriber gets notified about the target's abnormal / missed /
 * urgent events, subject to the same family authorization as everything else.
 */
export const alertSubscriptions = table("alert_subscriptions", {
  id: id(),
  subscriberPatientId: text("subscriber_patient_id").references(() => patients.id).notNull(),
  targetPatientId: text("target_patient_id").references(() => patients.id).notNull(),
  alertAbnormal: bool("alert_abnormal", true),
  alertMissedMedication: bool("alert_missed_medication", true),
  alertUrgent: bool("alert_urgent", true),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});
