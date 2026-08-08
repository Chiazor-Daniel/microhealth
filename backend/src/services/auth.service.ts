import bcrypt from "bcryptjs";
import { db } from "../config/database";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export async function createUser(data: {
  email?: string;
  phone?: string;
  password?: string;
  role: "admin" | "staff" | "patient";
  firstName: string;
  lastName: string;
}) {
  const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : null;
  const [user] = await db.insert(users).values({
    email: data.email,
    phone: data.phone,
    passwordHash,
    role: data.role,
    firstName: data.firstName,
    lastName: data.lastName,
  }).returning();
  return user;
}

export async function validatePassword(plainPassword: string, hash: string) {
  return bcrypt.compare(plainPassword, hash);
}
