"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  login as apiLogin,
  signup as apiSignup,
  logout as apiLogout,
  updateProfile as apiUpdateProfile,
} from "@/lib/auth";
import { API_BASE_URL } from "@/lib/auth";

// ─── Cookie helpers (readable by middleware) ──────────────────────────────────

function setAuthCookie(access: string) {
  const isSecure = typeof location !== "undefined" && location.protocol === "https:";
  document.cookie = `access_token=${access}; path=/; max-age=86400; SameSite=Strict${isSecure ? "; Secure" : ""}`;
}

function clearAuthCookie() {
  document.cookie = "access_token=; path=/; max-age=0; SameSite=Strict";
}

// ─── Types ────────────────────────────────────────────────────────────────────

type User = {
  email?: string;
  first_name: string;
  last_name: string;
  role?: string;
  preferred_language?: string;
  [k: string]: any;
};

function coerceString(value: any): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function splitFullName(fullName: any): { first_name?: string; last_name?: string } {
  const name = coerceString(fullName);
  if (!name) return {};
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { first_name: parts[0] };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

function getAvatarValue(data: any): string | undefined {
  return (
    coerceString(data?.avatar) ??
    coerceString(data?.avatar_url) ??
    coerceString(data?.photo) ??
    coerceString(data?.picture) ??
    undefined
  );
}

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    id?: number,
    role?: string
  ) => Promise<void>;
  loginWithTokens: (access: string, refresh: string, userData: any) => void;
  signup: (
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    role?: string
  ) => Promise<void>;
  updateProfile: (opts: {
    email?: string;
    password?: string;
    avatarFile?: File | null;
    first_name: string;
    last_name: string;
  }) => Promise<any>;
  logout: () => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Rehydrate from localStorage on mount + background sync
  useEffect(() => {
    const email = localStorage.getItem("user_email");
    const role = localStorage.getItem("user_role");
    const first_name = localStorage.getItem("first_name");
    const last_name = localStorage.getItem("last_name");
    const avatar = localStorage.getItem("user_avatar");
    const prefLang = localStorage.getItem("preferred_language");

    if (email || role) {
      setUser({
        email: email || undefined,
        first_name: first_name || "",
        last_name: last_name || "",
        role: role || undefined,
        avatar: avatar || undefined,
        preferred_language: prefLang || "default",
      });
    }

    const token = localStorage.getItem("access_token");
    if (token) {
      // Ensure the cookie is present if the token is in localStorage
      // (covers hard refreshes where cookie may have expired but localStorage hasn't)
      setAuthCookie(token);

      fetch(`${API_BASE_URL}accounts/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch fresh profile");
          return res.json();
        })
        .then((data) => {
          const latestLang = data.preferred_language || "default";
          localStorage.setItem("preferred_language", latestLang);
          if (data.first_name) localStorage.setItem("first_name", data.first_name);
          if (data.last_name) localStorage.setItem("last_name", data.last_name);
          if (data.avatar) localStorage.setItem("user_avatar", data.avatar);

          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  preferred_language: latestLang,
                  first_name: data.first_name || prev.first_name,
                  last_name: data.last_name || prev.last_name,
                  avatar: data.avatar || prev.avatar,
                }
              : null
          );
        })
        .catch((err) => console.error("Background sync failed:", err));
    }
  }, []);

  // ─── login ────────────────────────────────────────────────────────────────

  async function login(
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    id?: number,
    role?: string
  ) {
    setLoading(true);
    try {
      const raw = await apiLogin(email, password, first_name, last_name, role ?? "");
      const data: any = raw as any;

      // ✅ Set cookie so middleware can read it
      if (data?.access) setAuthCookie(data.access);

      const uId = data?.id || localStorage.getItem("user_id") || undefined;
      const uEmail = data?.email || data?.user || localStorage.getItem("user_email") || email;
      const uRole = data?.role || localStorage.getItem("user_role") || undefined;
      const uAvatar = data?.avatar || data?.photo || localStorage.getItem("user_avatar") || undefined;
      const uFirstName = data?.first_name || localStorage.getItem("first_name") || first_name;
      const uLastName = data?.last_name || localStorage.getItem("last_name") || last_name;
      const uPrefLang = data?.preferred_language || "default";

      localStorage.setItem("preferred_language", uPrefLang);

      setUser({
        id: uId,
        email: uEmail,
        role: uRole,
        avatar: uAvatar,
        first_name: uFirstName,
        last_name: uLastName,
        preferred_language: uPrefLang,
      });
    } finally {
      setLoading(false);
    }
  }

  // ─── loginWithTokens (Google) ─────────────────────────────────────────────

  function loginWithTokens(access: string, refresh: string, userData: any) {
    // ✅ Set cookie so middleware can read it
    setAuthCookie(access);

    const maybeUser = userData?.user ?? userData?.profile ?? userData;
    const fromFullName = splitFullName(maybeUser?.name);

    const first_name =
      coerceString(maybeUser?.first_name) ??
      coerceString(maybeUser?.firstName) ??
      coerceString(maybeUser?.given_name) ??
      coerceString(maybeUser?.givenName) ??
      fromFullName.first_name ??
      "";
    const last_name =
      coerceString(maybeUser?.last_name) ??
      coerceString(maybeUser?.lastName) ??
      coerceString(maybeUser?.family_name) ??
      coerceString(maybeUser?.familyName) ??
      fromFullName.last_name ??
      "";
    const email =
      coerceString(maybeUser?.email) ??
      coerceString(maybeUser?.user) ??
      localStorage.getItem("user_email") ??
      "";
    const role =
      coerceString(maybeUser?.role) ??
      coerceString(maybeUser?.user_role) ??
      coerceString(maybeUser?.userRole) ??
      localStorage.getItem("user_role") ??
      "";
    const idRaw =
      maybeUser?.id ??
      maybeUser?.user_id ??
      maybeUser?.userId ??
      maybeUser?.pk ??
      localStorage.getItem("user_id") ??
      "";
    const id =
      typeof idRaw === "string" ? idRaw.trim() : idRaw != null ? String(idRaw) : "";
    const avatar =
      coerceString(maybeUser?.avatar_url) ??
      coerceString(maybeUser?.avatar) ??
      coerceString(maybeUser?.photo) ??
      coerceString(maybeUser?.picture) ??
      localStorage.getItem("user_avatar") ??
      undefined;
    const prefLang =
      coerceString(maybeUser?.preferred_language) ??
      localStorage.getItem("preferred_language") ??
      "default";

    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    if (id) localStorage.setItem("user_id", id);
    if (email) localStorage.setItem("user_email", email);
    if (role) localStorage.setItem("user_role", role);
    localStorage.setItem("first_name", first_name);
    localStorage.setItem("last_name", last_name);
    if (avatar) localStorage.setItem("user_avatar", avatar);
    localStorage.setItem("preferred_language", prefLang);

    setUser({
      id: id || undefined,
      email,
      role: role || undefined,
      avatar,
      first_name,
      last_name,
      preferred_language: prefLang,
    });
  }

  // ─── signup ───────────────────────────────────────────────────────────────

  async function signup(
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    role?: string
  ) {
    setLoading(true);
    try {
      const raw = await apiSignup(email, password, first_name, last_name, role);
      const data: any = raw as any;

      // ✅ Set cookie if signup returns tokens immediately
      if (data?.access) setAuthCookie(data.access);

      if (data?.access) {
        const uEmail = data?.email || data?.user || email;
        const uRole = data?.role || undefined;
        const uFirstName = data?.first_name || first_name;
        const uLastName = data?.last_name || last_name;
        setUser({ email: uEmail, first_name: uFirstName, last_name: uLastName, role: uRole });
      }
      return data;
    } finally {
      setLoading(false);
    }
  }

  // ─── updateProfile ────────────────────────────────────────────────────────

  async function updateProfile(opts: {
    email?: string;
    password?: string;
    avatarFile?: File | null;
    first_name: string;
    last_name: string;
  }) {
    setLoading(true);
    try {
      const data = await apiUpdateProfile(opts);
      const email = data?.email || localStorage.getItem("user_email") || undefined;
      const role = data?.role || localStorage.getItem("user_role") || undefined;
      const avatar = getAvatarValue(data) || localStorage.getItem("user_avatar") || undefined;
      const first_name = data?.first_name || localStorage.getItem("first_name") || "";
      const last_name = data?.last_name || localStorage.getItem("last_name") || "";
      setUser({ email, role, avatar, first_name, last_name });
      return data;
    } finally {
      setLoading(false);
    }
  }

  // ─── logout ───────────────────────────────────────────────────────────────

  function logout() {
    // ✅ Clear cookie so middleware blocks access immediately
    clearAuthCookie();
    apiLogout();
    setUser(null);
  }

  // ─────────────────────────────────────────────────────────────────────────

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    loginWithTokens,
    signup,
    updateProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}