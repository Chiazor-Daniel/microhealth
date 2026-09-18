import { configurePlatform } from "../services/platform";

/**
 * Web bindings for the shared data layer.
 *
 * The browser reaches the API on its own origin (Vite proxies `/api`), and
 * keeps the auth token in `localStorage` — which is synchronous, so
 * `readToken` can answer directly.
 */
const API_BASE = import.meta.env.VITE_API_URL || "/api";
const SOCKET_URL = import.meta.env.VITE_WS_URL || window.location.origin;

const TOKEN_KEY = "token";

configurePlatform({
  apiBaseUrl: API_BASE,
  socketUrl: SOCKET_URL,
  writeToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },
  readToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
});
