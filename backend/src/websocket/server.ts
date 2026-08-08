import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config/env";

let io: Server;

export function setupWebSocket(server: HttpServer) {
  io = new Server(server, {
    cors: { origin: config.CORS_ORIGIN, credentials: true },
    pingTimeout: 60000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const payload = jwt.verify(token, config.JWT_SECRET) as { userId: string; role: string };
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const role = socket.data.role;
    const userId = socket.data.userId;

    if (role === "admin" || role === "staff") {
      socket.join("admin:live");
      socket.join(`unit:all`);
    } else if (role === "patient") {
      socket.join(`patient:${userId}`);
    }

    console.log(`[ws] ${role} connected: ${userId}`);

    socket.on("disconnect", () => {
      console.log(`[ws] ${role} disconnected: ${userId}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export function emitToAdmins(event: string, data: unknown) {
  if (io) io.to("admin:live").emit(event, data);
}

export function emitToPatient(patientId: string, event: string, data: unknown) {
  if (io) io.to(`patient:${patientId}`).emit(event, data);
}

export function emitToAll(event: string, data: unknown) {
  if (io) io.emit(event, data);
}
