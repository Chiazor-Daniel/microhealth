import "dotenv/config";
import path from "node:path";

const rawDbUrl = process.env.DATABASE_URL ?? "./data/microhealth.db";
const isPostgres = /^postgres(ql)?:\/\//.test(rawDbUrl);

export const config = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  DATABASE_URL: isPostgres ? rawDbUrl : path.resolve(rawDbUrl),
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
  CORS_ORIGIN: (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map(s => s.trim()),
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_EXPIRES_IN: "24h",
  JWT_REFRESH_EXPIRES_IN: "7d",
} as const;
