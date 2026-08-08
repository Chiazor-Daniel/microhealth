import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { messages, notifications } from "../db/schema";
import { eq, desc, or } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler";
import { emitToPatient, emitToAdmins } from "../websocket/server";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const result = await db.query.messages.findMany({
      where: or(eq(messages.senderId, userId), eq(messages.recipientId, userId)),
      with: { sender: { columns: { id: true, firstName: true, lastName: true, role: true } } },
      orderBy: [desc(messages.sentAt)],
      limit: 50,
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function send(req: Request, res: Response, next: NextFunction) {
  try {
    const [msg] = await db.insert(messages).values({
      senderId: req.user!.userId,
      recipientId: req.body.recipientId,
      content: req.body.content,
    }).returning();
    if (msg.recipientId) {
      emitToPatient(msg.recipientId, "message:received", msg);
    }
    emitToAdmins("message:sent", msg);
    res.status(201).json(msg);
  } catch (e) { next(e); }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const [msg] = await db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    if (!msg) throw new AppError("Message not found", 404);
    res.json(msg);
  } catch (e) { next(e); }
}

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await db.query.notifications.findMany({
      where: eq(notifications.userId, req.user!.userId),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function createNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const [notif] = await db.insert(notifications).values({
      userId: req.body.userId || req.user!.userId,
      title: req.body.title,
      message: req.body.message,
      type: req.body.type,
    }).returning();
    emitToPatient(notif.userId, "notification:received", notif);
    res.status(201).json(notif);
  } catch (e) { next(e); }
}

export async function markNotificationRead(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const [notif] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    if (!notif) throw new AppError("Notification not found", 404);
    res.json(notif);
  } catch (e) { next(e); }
}
