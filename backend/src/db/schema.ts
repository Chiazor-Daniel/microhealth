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
  notes: text("notes"),
  recordedAt: ts("recorded_at"),
  recordedBy: text("recorded_by").references(() => staff.id),
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
