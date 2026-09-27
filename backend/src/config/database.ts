import { config } from "./env";
import * as schema from "../db/schema";

const usePostgres = /^postgres(ql)?:\/\//.test(config.DATABASE_URL);

async function createSqliteDb() {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const { default: Database } = await import("better-sqlite3");
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  fs.mkdirSync(path.dirname(config.DATABASE_URL), { recursive: true });
  const sqlite = new Database(config.DATABASE_URL);
  sqlite.exec("PRAGMA journal_mode = WAL;");
  return { db: drizzle(sqlite, { schema }), kind: "sqlite" as const, close: () => sqlite.close() };
}

async function createPostgresDb() {
  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const pool = new Pool({
    connectionString: config.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  return { db: drizzle(pool, { schema }), kind: "postgres" as const, close: () => pool.end() };
}

const ready = usePostgres ? createPostgresDb() : createSqliteDb();

/**
 * Top-level-await export keeps every existing `import { db }` working
 * unchanged on both dialects. tsx and modern Node resolve it before any
 * query runs; the connection test below fails fast with a readable error
 * when the database is unreachable.
 *
 * Typed as the SQLite flavour: only one branch runs per deploy, and every
 * query the codebase issues is in the portable subset both dialects share.
 */
type Db = Awaited<ReturnType<typeof createSqliteDb>>["db"];
export const db: Db = (await ready).db as unknown as Db;
export const dbKind: "sqlite" | "postgres" = (await ready).kind;

try {
  await db.query.users.findMany({ limit: 1 });
  console.log(`[db] connected (${(await ready).kind}): ${usePostgres ? "postgres" : config.DATABASE_URL}`);
} catch (err: any) {
  console.error(`[db] connection failed: ${err?.message ?? err}`);
  throw err;
}

export async function closeDb() {
  await (await ready).close();
}
