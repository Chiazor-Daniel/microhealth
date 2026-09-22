import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app";
import jwt from "jsonwebtoken";

import { careLabel } from "../agent/rules";
import { matchPathway, parseTriageAnswer, TRIAGE_PATHWAYS } from "../agent/triage";

const config = { JWT_SECRET: process.env.JWT_SECRET || "dev-secret" };
const patientToken = jwt.sign({ userId: "test-user-id", role: "patient" }, config.JWT_SECRET, { expiresIn: "1h" });
const staffToken = jwt.sign({ userId: "test-staff-id", role: "staff" }, config.JWT_SECRET, { expiresIn: "1h" });

describe("Care labels (PDF wording)", () => {
  it("maps internal states onto the four plain labels", () => {
    expect(careLabel("normal")).toBe("Normal");
    expect(careLabel("low")).toBe("Watch Closely");
    expect(careLabel("high")).toBe("Watch Closely");
    expect(careLabel("high", "attention")).toBe("Needs Attention");
    expect(careLabel("attention")).toBe("Needs Attention");
    expect(careLabel("normal", "urgent")).toBe("Seek Care Now");
  });
});

describe("Triage pathways", () => {
  it("matches hypertension from message text", () => {
    expect(matchPathway("My blood pressure feels high")?.id).toBe("hypertension");
  });
  it("matches fever, respiratory and adherence", () => {
    expect(matchPathway("I have a fever and chills")?.id).toBe("fever");
    expect(matchPathway("I can't breathe well")?.id).toBe("respiratory");
    expect(matchPathway("I missed my drugs twice")?.id).toBe("adherence");
  });
  it("falls back to vitals when the message is vague", () => {
    const ctx: any = { recentVitals: [{ spo2: 91 }] };
    expect(matchPathway("I feel off today", ctx)?.id).toBe("respiratory");
  });
  it("parses chained answers", () => {
    expect(parseTriageAnswer("Severity: triage:hypertension:bp_stage1+sym_none")).toEqual({
      pathwayId: "hypertension",
      values: ["bp_stage1", "sym_none"],
    });
    expect(parseTriageAnswer("hello")).toBeNull();
  });
  it("recommends urgent on danger signs, review on stage 2, monitor otherwise", () => {
    const hyper = TRIAGE_PATHWAYS[0];
    expect(hyper.recommend(["bp_stage1", "sym_danger"], {} as any).outcome).toBe("urgent");
    expect(hyper.recommend(["bp_stage2", "sym_none"], {} as any).outcome).toBe("review");
    expect(hyper.recommend(["bp_normal", "sym_none"], {} as any).outcome).toBe("monitor");
  });
});

describe("Escalation queue auth", () => {
  it("rejects patients with 403", async () => {
    const res = await request(app).get("/api/escalations/queue").set("Authorization", `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
  });
  it("rejects bad actions with 400", async () => {
    const res = await request(app)
      .post("/api/escalations/queue/nope/act")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ action: "teleport" });
    expect([400, 404, 500]).toContain(res.status);
  });
});
