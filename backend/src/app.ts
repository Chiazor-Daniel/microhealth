import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { config } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { authRoutes } from "./routes/auth.routes";
import { patientRoutes } from "./routes/patient.routes";
import { appointmentRoutes } from "./routes/appointment.routes";
import { vitalRoutes } from "./routes/vital.routes";
import { labRoutes } from "./routes/lab.routes";
import { prescriptionRoutes } from "./routes/prescription.routes";
import { inventoryRoutes } from "./routes/inventory.routes";
import { paymentRoutes } from "./routes/payment.routes";
import { staffRoutes } from "./routes/staff.routes";
import { referralRoutes } from "./routes/referral.routes";
import { messageRoutes } from "./routes/message.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { reportRoutes } from "./routes/report.routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/vitals", vitalRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);

// Serve built frontend (only in production / bundled deployments)
const staticPath = path.resolve(__dirname, "../frontend/dist");
app.use(express.static(staticPath));
app.get("*", (_req, res, next) => {
  const file = path.join(staticPath, "index.html");
  res.sendFile(file, (err) => {
    if (err) next(err);
  });
});

app.use(errorHandler);
