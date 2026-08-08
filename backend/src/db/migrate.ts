import { execSync } from "child_process";

console.log("[db] Running Drizzle migrations...");
try {
  execSync("npx drizzle-kit push", { stdio: "inherit", cwd: process.cwd() });
  console.log("[db] Migrations complete.");
} catch (err) {
  console.error("[db] Migration failed:", err);
  process.exit(1);
}
