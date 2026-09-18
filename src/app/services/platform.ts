/**
 * Platform bindings for the shared data layer.
 *
 * Everything under `services/` and `hooks/` is written against this contract
 * instead of the DOM, so the same service and hook code runs in the browser and
 * in React Native. The only thing that changes between the two is *where* the
 * API lives and *where* the auth token is kept — and that is all this holds.
 *
 * Each platform registers itself once, before the app renders:
 *   web     — src/app/providers/AppProviders.tsx
 *   native  — mobile/src/lib/platform.ts, awaited by mobile/app/_layout.tsx
 */

export interface PlatformBindings {
  /** Base URL for REST requests: `/api` on web, an absolute URL on native. */
  apiBaseUrl: string;
  /** Absolute origin of the socket.io server. */
  socketUrl: string;
  /**
   * Persist the auth token, or clear it when null.
   *
   * Reads are synchronous — `getToken()` is called all over the service layer
   * and cannot be made async without rewriting every call site. A platform
   * whose storage is async (native, via AsyncStorage) primes its own cache
   * first and reads from that; see mobile/src/lib/platform.ts.
   */
  writeToken(token: string | null): void;
  readToken(): string | null;
}

let bindings: PlatformBindings | null = null;

export function configurePlatform(next: PlatformBindings) {
  bindings = next;
}

export function platform(): PlatformBindings {
  if (!bindings) {
    throw new Error("configurePlatform() must run before the data layer is used");
  }
  return bindings;
}
