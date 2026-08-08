import { db } from "../config/database";
import { users, patients, staff, appointments, vitals, labTests, prescriptions, inventory, payments, referrals } from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  const existing = await db.query.users.findFirst({ where: eq(users.email, "admin@microhealth.ng") });
  if (existing) {
    console.log("[seed] Demo data already present, skipping.");
    return;
  }

  console.log("[seed] Starting...");

  // Admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const [adminUser] = await db.insert(users).values({
    email: "admin@microhealth.ng",
    phone: "+2348000000001",
    passwordHash: adminPassword,
    role: "admin",
    firstName: "System",
    lastName: "Administrator",
  }).onConflictDoNothing({ target: users.email }).returning();

  // Staff user (Dr. Okonkwo)
  const staffPassword = await bcrypt.hash("staff123", 12);
  const [doctorUser] = await db.insert(users).values({
    email: "dr.okonkwo@microhealth.ng",
    phone: "+2348012345678",
    passwordHash: staffPassword,
    role: "staff",
    firstName: "Musa",
    lastName: "Okonkwo",
  }).onConflictDoNothing({ target: users.email }).returning();

  // Patient user
  const patientPassword = await bcrypt.hash("patient123", 12);
  const [patientUser] = await db.insert(users).values({
    email: "ada.patient@example.com",
    phone: "+2348034567890",
    passwordHash: patientPassword,
    role: "patient",
    firstName: "Ada",
    lastName: "Nwosu",
  }).onConflictDoNothing({ target: users.email }).returning();

  if (doctorUser) {
    await db.insert(staff).values({
      userId: doctorUser.id,
      role: "Physician",
      department: "General Medicine",
      status: "on-duty",
      patientCount: 12,
    }).onConflictDoNothing({ target: staff.userId });
  }

  let patientId: string | undefined;
  if (patientUser) {
    const [patient] = await db.insert(patients).values({
      userId: patientUser.id,
      patientCode: "MH-1001",
      age: 34,
      gender: "F",
      bloodGroup: "O+",
      diagnosis: "Hypertension follow-up",
      status: "active",
      ward: "Ward-A",
    }).onConflictDoNothing({ target: patients.patientCode }).returning();
    patientId = patient?.id;
  }

  const doctor = doctorUser ? await db.query.staff.findFirst({
    where: eq(staff.userId, doctorUser.id),
    with: { user: true },
  }) : null;

  if (patientId && doctor?.id) {
    const today = new Date().toISOString().split("T")[0];

    await db.insert(appointments).values({
      patientId,
      doctorId: doctor.id,
      department: "General Medicine",
      scheduledDate: today,
      scheduledTime: "09:00:00",
      status: "confirmed",
      notes: "Routine check-up",
    });

    await db.insert(vitals).values({
      patientId,
      bloodPressureSystolic: 138,
      bloodPressureDiastolic: 88,
      heartRate: 78,
      temperature: 36.6,
      spo2: 98,
      recordedBy: doctor.id,
    });

    await db.insert(labTests).values({
      patientId,
      testName: "Fasting Blood Sugar",
      doctorId: doctor.id,
      status: "pending",
    });

    await db.insert(prescriptions).values({
      patientId,
      medicine: "Amlodipine 5mg",
      dosage: "1 tablet daily",
      duration: "30 days",
      doctorId: doctor.id,
      status: "pending",
    });

    await db.insert(payments).values({
      patientId,
      service: "Consultation",
      amount: 5000.00,
      method: "cash",
      status: "paid",
      paidAt: new Date(),
    });

    await db.insert(referrals).values({
      patientId,
      fromDoctorId: doctor.id,
      toFacility: "Lagos University Teaching Hospital",
      reason: "Cardiology review",
      status: "pending",
    });
  }

  // Inventory items
  await db.insert(inventory).values([
    { name: "Paracetamol 500mg", category: "Medication", stock: 120, minStock: 20, unit: "tablets", unitCost: 15.00, status: "ok" },
    { name: "Surgical gloves", category: "Supplies", stock: 8, minStock: 50, unit: "boxes", unitCost: 2500.00, status: "low" },
    { name: "Blood pressure monitor", category: "Equipment", stock: 2, minStock: 2, unit: "units", unitCost: 45000.00, status: "ok" },
  ]).onConflictDoNothing();

  console.log("[seed] Complete.");
  console.log("Credentials:");
  console.log("  Admin:    admin@microhealth.ng / admin123");
  console.log("  Staff:    dr.okonkwo@microhealth.ng / staff123");
  console.log("  Patient:  +2348034567890 (tap Sign In — no password required)");
}

export async function runSeed() {
  return seed();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .catch((err) => {
      console.error("[seed] Failed:", err);
      process.exit(1);
    });
}
