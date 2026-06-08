"use client";
import { create } from "zustand";
import { apiFetch } from "@/shared/lib/api-client";

interface AuthUser {
  id: string;
  firstName: string;
  role: string;
  tenantId: string | null;
}

interface AuthState {
  user: AuthUser | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  login: async (email, password) => {
    const res = await apiFetch<{ data: { accessToken: string; refreshToken: string; user: AuthUser } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    window.localStorage.setItem("clientra_token", res.data.accessToken);
    window.localStorage.setItem("clientra_refresh_token", res.data.refreshToken);
    window.localStorage.setItem("clientra_user", JSON.stringify(res.data.user));
    set({ user: res.data.user });
  },
  logout: () => {
    const refreshToken = typeof window !== "undefined"
      ? window.localStorage.getItem("clientra_refresh_token")
      : null;
    // Revocar sesión en servidor (SEC-03). Fire-and-forget: no bloquea la UI.
    if (refreshToken) {
      apiFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    window.localStorage.removeItem("clientra_token");
    window.localStorage.removeItem("clientra_refresh_token");
    window.localStorage.removeItem("clientra_user");
    set({ user: null });
  },
  hydrate: () => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem("clientra_user") : null;
    set({ user: raw ? (JSON.parse(raw) as AuthUser) : null, hydrated: true });
  },
}));
