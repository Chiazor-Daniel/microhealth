import { platform } from "./platform";

let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
  platform().writeToken(token);
}

export function getToken(): string | null {
  if (!authToken) {
    authToken = platform().readToken();
  }
  return authToken;
}

/**
 * How long to wait before giving up.
 *
 * Nothing here is a long-running job — the slowest endpoint is the agent, which
 * answers in seconds. A request that has not come back by now is not going to,
 * and a spinner that never resolves is worse than an honest failure.
 */
const TIMEOUT_MS = 30_000;

/**
 * What to say when the request never reached the server.
 *
 * `fetch` rejects with the runtime's own words — "Network request failed" on
 * React Native, "Failed to fetch" on web — and neither means anything to a
 * patient. The overwhelmingly likely cause in this app is that the phone is not
 * on the same network as the API, so the message names that.
 */
const OFFLINE = "Can't reach MicroHealth right now. Check your connection and try again.";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    res = await fetch(`${platform().apiBaseUrl}${path}`, {
      ...options,
      headers,
      credentials: "include",
      signal: controller.signal,
    });
  } catch {
    /* Covers both a refused connection and the timeout above — from the
       caller's side they are the same thing: the server did not answer.
       Written with AbortController rather than AbortSignal.timeout, which
       exists in browsers and is not dependable in Hermes. */
    throw new Error(OFFLINE);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Network error" }));
    throw new Error(error.error?.message || error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) => request<T>(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) => request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
