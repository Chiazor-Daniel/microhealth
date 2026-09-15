import { db } from "../config/database";
import { aiInsights } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { type GeneratedInsight } from "./engine";
import { emitToPatient } from "../websocket/server";

export async function persistAndEmit(insight: GeneratedInsight, userId: string) {
  const [record] = await db.insert(aiInsights).values({
    patientId: insight.patientId,
    type: insight.type,
    priority: insight.priority,
    title: insight.title,
    message: insight.message,
    explanation: insight.explanation || null,
    suggestedActions: insight.suggestedActions ? JSON.stringify(insight.suggestedActions) : null,
    context: insight.context ? JSON.stringify(insight.context) : null,
  }).returning();

  emitToPatient(userId, "ai:insight", record);
  return record;
}

export async function listInsights(patientId: string, limit = 50) {
  return db.query.aiInsights.findMany({
    where: eq(aiInsights.patientId, patientId),
    orderBy: [desc(aiInsights.createdAt)],
    limit,
  });
}

export async function markRead(id: string) {
  const [record] = await db.update(aiInsights)
    .set({ isRead: true, updatedAt: new Date() })
    .where(eq(aiInsights.id, id))
    .returning();
  return record;
}

export async function dismiss(id: string) {
  const [record] = await db.update(aiInsights)
    .set({ dismissedAt: new Date(), updatedAt: new Date() })
    .where(eq(aiInsights.id, id))
    .returning();
  return record;
}
