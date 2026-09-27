import { defineConfig } from "drizzle-kit";
import { config } from "./src/config/env";

const isPg = /^postgres(ql)?:\/\//.test(config.DATABASE_URL ?? "");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: isPg ? "postgresql" : "sqlite",
  dbCredentials: {
    url: config.DATABASE_URL,
  },
});
