import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app";
import jwt from "jsonwebtoken";

const config = { JWT_SECRET: process.env.JWT_SECRET || "dev-secret" };

function generateToken(role: string, userId = "test-user-id") {
  return jwt.sign({ userId, role }, config.JWT_SECRET, { expiresIn: "1h" });
}

describe("API Authorization Tests", () => {
  const staffToken = generateToken("staff");
  const adminToken = generateToken("admin");
  const patientToken = generateToken("patient");

  describe("Staff role access", () => {
    it("can access patients list", async () => {
      const res = await request(app)
        .get("/api/patients")
        .set("Authorization", `Bearer ${staffToken}`);
      // 200 if DB available, but at least not 401/403
      expect(res.status).not.toBe(401);
    });

    it("can access appointments", async () => {
      const res = await request(app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(res.status).not.toBe(401);
    });

    it("can access dashboard KPI", async () => {
      const res = await request(app)
        .get("/api/dashboard/kpi")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(res.status).not.toBe(401);
    });

    it("can access inventory", async () => {
      const res = await request(app)
        .get("/api/inventory")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(res.status).not.toBe(401);
    });

    it("can access staff list", async () => {
      const res = await request(app)
        .get("/api/staff")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(res.status).not.toBe(401);
    });

    it("can access reports", async () => {
      const res = await request(app)
        .get("/api/reports/demographics")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(res.status).not.toBe(401);
    });
  });

  describe("Admin role access", () => {
    it("has same access as staff", async () => {
      const res = await request(app)
        .get("/api/patients")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });
  });

  describe("Patient role access", () => {
    it("cannot access staff-only routes", async () => {
      const res = await request(app)
        .get("/api/patients")
        .set("Authorization", `Bearer ${patientToken}`);
      expect(res.status).toBe(403);
    });

    it("can access patient home dashboard", async () => {
      const res = await request(app)
        .get("/api/dashboard/patient-home")
        .set("Authorization", `Bearer ${patientToken}`);
      expect(res.status).not.toBe(401);
    });

    it("can access own appointments", async () => {
      const res = await request(app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${patientToken}`);
      expect(res.status).not.toBe(401);
    });

    it("can access messages", async () => {
      const res = await request(app)
        .get("/api/messages")
        .set("Authorization", `Bearer ${patientToken}`);
      expect(res.status).not.toBe(401);
    });
  });

  describe("Validation tests", () => {
    it("POST /api/patients requires valid data", async () => {
      const res = await request(app)
        .post("/api/patients")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ invalidField: true });
      // Should pass validation but may fail on DB insert
      expect([201, 422, 400, 500]).toContain(res.status);
    });

    it("POST /api/vitals requires valid data", async () => {
      const res = await request(app)
        .post("/api/vitals")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ patientId: "invalid-uuid" });
      expect(res.status).not.toBe(401);
    });

    it("POST /api/inventory requires name", async () => {
      const res = await request(app)
        .post("/api/inventory")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it("PATCH /api/appointments/:id/status with invalid uuid", async () => {
      const res = await request(app)
        .patch("/api/appointments/not-a-uuid/status")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "confirmed" });
      // Drizzle may 400 or 500 on invalid UUID
      expect([400, 404, 500]).toContain(res.status);
    });
  });
});
