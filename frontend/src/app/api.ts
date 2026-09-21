let _apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
if (process.env.NEXT_PUBLIC_API_URL && !_apiBase.endsWith('/api')) {
  _apiBase = _apiBase.replace(/\/$/, "") + "/api";
}
export const API_BASE = _apiBase;
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkErr: unknown) {
    // Network-level failure — backend not running or CORS issue
    const message = networkErr instanceof Error ? networkErr.message : "";
    const isNetworkFailure = networkErr instanceof TypeError || message.includes("fetch") || message.includes("network");
    if (isNetworkFailure) {
      throw new Error("Cannot reach the server. Make sure the backend is running on port 5001.");
    }
    throw new Error(message || "Network error");
  }

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    throw new Error("Session expired. Please log in again.");
  }

  // Return shape is caller-defined - this is a generic HTTP client, not a
  // typed endpoint wrapper. Callers narrow/cast at the call site.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned invalid response (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export function saveToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
}

export function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }
}
