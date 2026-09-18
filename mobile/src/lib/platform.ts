import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { configurePlatform } from "@app/services/platform";

/**
 * Native bindings for the shared data layer.
 *
 * Two differences from the browser, both handled here so the service and hook
 * code above this line stays identical on the two platforms:
 *
 *   Where the API lives. On web it is same-origin (`/api`, proxied by Vite).
 *   A phone has no such origin, so the base URL has to be absolute. In
 *   development we take the host Metro is already serving from and assume the
 *   backend sits beside it on :3001 — which is right whether that host is
 *   `localhost` (simulator, web) or a LAN address (a real device scanning the
 *   QR code). Set EXPO_PUBLIC_API_URL to override.
 *
 *   How the token is stored. AsyncStorage is asynchronous, but `getToken()` is
 *   called synchronously throughout the service layer. So we prime a
 *   module-level cache once at boot and serve reads from that.
 */

const TOKEN_KEY = "token";

let tokenCache: string | null = null;

/** The backend host, inferred from wherever Metro is being served. */
function inferApiBase(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  /* `hostUri` is "192.168.1.5:8081" in development, and undefined in a
     production build — where EXPO_PUBLIC_API_URL is required anyway. */
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (host) return `http://${host}:3001/api`;

  return "http://localhost:3001/api";
}

const API_BASE = inferApiBase();

/** Origin of the socket server — the API base without its `/api` suffix. */
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, "");

configurePlatform({
  apiBaseUrl: API_BASE,
  socketUrl: SOCKET_URL,
  writeToken(token) {
    tokenCache = token;
    /* Fire and forget: a failed write costs the user a re-login, and there is
       nothing useful to do about it at the call site. */
    if (token) AsyncStorage.setItem(TOKEN_KEY, token).catch(() => {});
    else AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
  },
  readToken() {
    return tokenCache;
  },
});

/**
 * Load the persisted token into the cache. Await this before rendering
 * anything that reads auth state — `AuthProvider` checks `getToken()` on
 * mount, and would otherwise always see a signed-out user.
 */
export async function hydratePlatform() {
  try {
    tokenCache = await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    tokenCache = null;
  }
}

export { API_BASE, SOCKET_URL };
