import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../app";

// We test route structure, validation, and auth middleware
// Full integration tests need a running Postgres with seed data

describe("Auth API - Route & Validation Tests", () => {
  describe("POST /api/auth/login", () => {
    it("should reject missing email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: "123456" });
      expect(res.status).toBe(400);
    });

    it("should reject invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "not-an-email", password: "123456" });
      expect(res.status).toBe(400);
    });

    it("should reject short password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@test.com", password: "12" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login/verify-otp", () => {
    it("should reject missing code", async () => {
      const res = await request(app)
        .post("/api/auth/login/verify-otp")
        .send({ email: "test@test.com" });
      expect(res.status).toBe(400);
    });

    it("should reject short code", async () => {
      const res = await request(app)
        .post("/api/auth/login/verify-otp")
        .send({ email: "test@test.com", code: "123" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/patient/login", () => {
    it("should reject missing phone", async () => {
      const res = await request(app)
        .post("/api/auth/patient/login")
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/forgot-password", () => {
    it("should require email field", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/health", () => {
    it("should return ok", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe("Auth middleware", () => {
    it("should reject unauthenticated requests to protected routes", async () => {
      const res = await request(app).get("/api/patients");
      expect(res.status).toBe(401);
    });

    it("should reject unauthenticated requests to dashboard", async () => {
      const res = await request(app).get("/api/dashboard/kpi");
      expect(res.status).toBe(401);
    });

    it("should reject unauthenticated requests to vitals", async () => {
      const res = await request(app).get("/api/vitals/abnormal");
      expect(res.status).toBe(401);
    });

    it("should reject requests with invalid token format", async () => {
      const res = await request(app)
        .get("/api/patients")
        .set("Authorization", "Bearer invalid-token");
      expect(res.status).toBe(401);
    });

    it("should reject requests with malformed token", async () => {
      const res = await request(app)
        .get("/api/patients")
        .set("Authorization", "not-bearer-format");
      expect(res.status).toBe(401);
    });
  });

  describe("Route method validation", () => {
    it("should reject GET on POST-only endpoints", async () => {
      const res = await request(app).get("/api/auth/login");
      expect(res.status).toBe(404);
    });
  });
});
