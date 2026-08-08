import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { config } from "./env";
import * as schema from "../db/schema";

fs.mkdirSync(path.dirname(config.DATABASE_URL), { recursive: true });

const sqlite = new Database(config.DATABASE_URL);
sqlite.exec("PRAGMA journal_mode = WAL;");

export const db = drizzle(sqlite, { schema });
export { sqlite };
