// Single client for the Express API. The browser never talks to Supabase directly.
export const apiUrl = (import.meta.env["VITE_API_URL"] || "http://localhost:5000/api").replace(
  /\/$/,
  "",
);

export type AuthUser = { id: string; name: string; email: string; phone?: string; role: string };
export type AuthState = { token: string; user: AuthUser };

const authKey = "azix-auth-v1";

export function readAuth(): AuthState | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = JSON.parse(window.localStorage.getItem(authKey) || "null") as AuthState | null;
    if (!saved?.token || !saved.user?.email) return null;
    const payload = JSON.parse(
      atob((saved.token.split(".")[1] ?? "").replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      window.localStorage.removeItem(authKey);
      return null;
    }
    return saved;
  } catch {
    window.localStorage.removeItem(authKey);
    return null;
  }
}

export function saveAuth(auth: AuthState) {
  window.localStorage.setItem(authKey, JSON.stringify(auth));
}

export function clearAuth() {
  window.localStorage.removeItem(authKey);
}

export async function apiRequest<T>(
  path: string,
  {
    token,
    method = "GET",
    body,
  }: { token?: string | undefined; method?: string; body?: unknown } = {},
): Promise<T> {
  const isForm = body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      method,
      headers: {
        ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? null : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new Error("The store is unreachable right now. Check your connection and try again.");
  }
  if (response.status === 204) return undefined as T;
  const result = (await response.json().catch(() => ({}))) as { data?: T; message?: string };
  if (response.status === 401 && token) clearAuth();
  if (!response.ok) throw new Error(result.message || "Request failed. Please try again.");
  return result.data as T;
}
