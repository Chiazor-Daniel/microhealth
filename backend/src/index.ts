import { createServer } from "http";
import { execSync } from "child_process";
import { app } from "./app";
import { setupWebSocket } from "./websocket/server";
import { config } from "./config/env";
import { runSeed } from "./db/seed";

async function main() {
  try {
    execSync("npx drizzle-kit push --force", { stdio: "inherit", cwd: process.cwd() });
  } catch (err) {
    console.error("[server] Migration failed:", err);
  }

  try {
    await runSeed();
  } catch (err) {
    console.error("[server] Auto-seed failed:", err);
  }

  const server = createServer(app);
  setupWebSocket(server);

  const PORT = config.PORT;

  server.listen(PORT, () => {
    console.log(`[server] MicroHealth API running on http://localhost:${PORT}`);
    console.log(`[server] WebSocket ready`);
    console.log(`[server] Environment: ${config.NODE_ENV}`);
  });
}

main();

process.on("unhandledRejection", (err) => {
  console.error("[server] Unhandled rejection:", err);
  process.exit(1);
});
