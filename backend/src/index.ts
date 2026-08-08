import { createServer } from "http";
import { app } from "./app";
import { setupWebSocket } from "./websocket/server";
import { config } from "./config/env";

const server = createServer(app);
setupWebSocket(server);

const PORT = config.PORT;

server.listen(PORT, () => {
  console.log(`[server] MicroHealth API running on http://localhost:${PORT}`);
  console.log(`[server] WebSocket ready`);
  console.log(`[server] Environment: ${config.NODE_ENV}`);
});

process.on("unhandledRejection", (err) => {
  console.error("[server] Unhandled rejection:", err);
  process.exit(1);
});
