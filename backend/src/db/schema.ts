import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const id = () => text("id").$defaultFn(() => randomUUID()).primaryKey();
const ts = (name: string) => integer(name, { mode: "timestamp" }).$defaultFn(() => new Date()).notNull();

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").unique(),
  phone: text("phone"),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("patient"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  avatarUrl: text("avatar_url"),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
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

export const patients = sqliteTable("patients", {
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

export const staff = sqliteTable("staff", {
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

export const appointments = sqliteTable("appointments", {
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
export const vitals = sqliteTable("vitals", {
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
export const metricReadings = sqliteTable("metric_readings", {
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

export const labTests = sqliteTable("lab_tests", {
  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  testName: text("test_name").notNull(),
  orderedAt: integer("ordered_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
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

export const prescriptions = sqliteTable("prescriptions", {
  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  medicine: text("medicine").notNull(),
  dosage: text("dosage").notNull(),
  duration: text("duration"),
  doctorId: text("doctor_id").references(() => staff.id),
  issuedAt: integer("issued_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
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

export const inventory = sqliteTable("inventory", {
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

export const payments = sqliteTable("payments", {
  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  service: text("service").notNull(),
  amount: real("amount").notNull(),
  method: text("method"),
  status: text("status").default("pending"),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  patient: one(patients, {
    fields: [payments.patientId],
    references: [patients.id],
  }),
}));

export const referrals = sqliteTable("referrals", {
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

export const messages = sqliteTable("messages", {
  id: id(),
  senderId: text("sender_id").references(() => users.id).notNull(),
  recipientId: text("recipient_id").references(() => users.id),
  content: text("content").notNull(),
  subject: text("subject"),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
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

export const notifications = sqliteTable("notifications", {
  id: id(),
  userId: text("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type"),
  subjectPatientId: text("subject_patient_id").references(() => patients.id),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  createdAt: ts("created_at"),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const familyMembers = sqliteTable("family_members", {
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

export const aiInsights = sqliteTable("ai_insights", {
  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  type: text("type").notNull(),
  priority: text("priority").notNull().default("info"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  explanation: text("explanation"),
  suggestedActions: text("suggested_actions"),
  context: text("context"),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  dismissedAt: integer("dismissed_at", { mode: "timestamp" }),
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
export const escalations = sqliteTable("escalations", {
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
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
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
export const medicationLogs = sqliteTable("medication_logs", {
  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  prescriptionId: text("prescription_id").references(() => prescriptions.id).notNull(),
  dueAt: integer("due_at", { mode: "timestamp" }).notNull(),
  remindedAt: integer("reminded_at", { mode: "timestamp" }),
  confirmedAt: integer("confirmed_at", { mode: "timestamp" }),
  status: text("status").notNull().default("due"),
  createdAt: ts("created_at"),
});

/**
 * Caregiver alert preferences (MVP function 6).
 *
 * Consent-based and per-category: the patient chooses which alert kinds each
 * trusted contact may receive. No row (or no consent) means no alerts.
 */
export const caregiverAlertPrefs = sqliteTable("caregiver_alert_prefs", {  id: id(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  familyMemberId: text("family_member_id").references(() => familyMembers.id).notNull(),
  contactPhone: text("contact_phone"),
  alertAbnormal: integer("alert_abnormal", { mode: "boolean" }).default(true),
  alertMissedMedication: integer("alert_missed_medication", { mode: "boolean" }).default(true),
  alertUrgent: integer("alert_urgent", { mode: "boolean" }).default(true),
  consentedAt: integer("consented_at", { mode: "timestamp" }),
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
export const visitSessions = sqliteTable("visit_sessions", {
  id: id(),
  appointmentId: text("appointment_id").references(() => appointments.id).notNull(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  status: text("status").notNull().default("waiting"),
  joinedAt: integer("joined_at", { mode: "timestamp" }),
  endedAt: integer("ended_at", { mode: "timestamp" }),
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
export const familyGroups = sqliteTable("family_groups", {
  id: id(),
  plan: text("plan").notNull().default("family"),
  createdBy: text("created_by").references(() => patients.id).notNull(),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export type FamilyRole = "Mum" | "Dad" | "Spouse" | "Child" | "Grandparent" | "Other";

export const familyMemberships = sqliteTable("family_memberships", {
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
export const familyViews = sqliteTable("family_views", {
  id: id(),
  viewerPatientId: text("viewer_patient_id").references(() => patients.id).notNull(),
  subjectPatientId: text("subject_patient_id").references(() => patients.id).notNull(),
  createdAt: ts("created_at"),
});

/** Invite links: token resolves to a group + role without exposing health data. */
export const familyInvites = sqliteTable("family_invites", {
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
export const alertSubscriptions = sqliteTable("alert_subscriptions", {
  id: id(),
  subscriberPatientId: text("subscriber_patient_id").references(() => patients.id).notNull(),
  targetPatientId: text("target_patient_id").references(() => patients.id).notNull(),
  alertAbnormal: integer("alert_abnormal", { mode: "boolean" }).default(true),
  alertMissedMedication: integer("alert_missed_medication", { mode: "boolean" }).default(true),
  alertUrgent: integer("alert_urgent", { mode: "boolean" }).default(true),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});
