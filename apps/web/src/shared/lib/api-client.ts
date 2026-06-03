const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("clientra_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("clientra_refresh_token");
}

function clearSession(): void {
  window.localStorage.removeItem("clientra_token");
  window.localStorage.removeItem("clientra_refresh_token");
  window.localStorage.removeItem("clientra_user");
}

async function tryRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    window.localStorage.setItem("clientra_token", data.data.accessToken);
    window.localStorage.setItem("clientra_refresh_token", data.data.refreshToken);
    return data.data.accessToken as string;
  } catch {
    return null;
  }
}

async function fetchOnce(path: string, token: string | null, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("No se pudo conectar con el servidor. Verifica que la API esté corriendo.");
    }
    throw new Error("No se pudo conectar con el servidor. Verifica que la API esté corriendo.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res = await fetchOnce(path, getToken(), options);

  if (res.status === 401 && !path.startsWith("/auth/")) {
    const newToken = await tryRefresh();
    if (!newToken) {
      clearSession();
      window.location.href = "/login";
      throw new Error("Sesión expirada. Redirigiendo al inicio de sesión…");
    }
    res = await fetchOnce(path, newToken, options);
    if (res.status === 401) {
      clearSession();
      window.location.href = "/login";
      throw new Error("Sesión expirada. Redirigiendo al inicio de sesión…");
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export { API_URL };
