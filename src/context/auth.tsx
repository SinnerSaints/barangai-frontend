"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, signup as apiSignup, logout as apiLogout, updateProfile as apiUpdateProfile } from "@/lib/auth";

type User = {
  email?: string;
  role?: string;
  [k: string]: any;
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, id?: number, role?: string) => Promise<void>;
  signup: (email: string, password: string, role?: string) => Promise<void>;
  updateProfile: (opts: { email?: string; password?: string; avatarFile?: File | null }) => Promise<any>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // initialize from localStorage if present
    const email = localStorage.getItem("user_email");
    const role = localStorage.getItem("user_role");
    if (email || role) {
      setUser({ email: email || undefined, role: role || undefined });
    }
  }, []);

  async function login(email: string, password: string, id?: number, role?: string) {
    setLoading(true);
    try {
      // apiLogin accepts id and role but they may be optional; pass undefined when not provided
      const raw = await apiLogin(email, password, id ?? 0, role ?? "");
      const data: any = raw as any; // backend payload (access, refresh, email, role...)
      // apiLogin already persists tokens and user_email if provided
      const uId = data?.id || localStorage.getItem("user_id") || undefined;
      const uEmail = data?.email || data?.user || localStorage.getItem("user_email") || email;
      const uRole = data?.role || localStorage.getItem("user_role") || undefined;
      const uAvatar = data?.avatar || data?.photo || localStorage.getItem("user_avatar") || undefined;
      setUser({ id: uId, email: uEmail, role: uRole, avatar: uAvatar });
    } finally {
      setLoading(false);
    }
  }

  async function signup(email: string, password: string, role?: string) {
    setLoading(true);
    try {
      const raw = await apiSignup(email, password, role);
      const data: any = raw as any;
      // auto-login behavior: if the register endpoint returned tokens, set user
      if (data?.access) {
        const uEmail = data?.email || data?.user || email;
        const uRole = data?.role || undefined;
        setUser({ email: uEmail, role: uRole });
      }
      return data;
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(opts: { email?: string; password?: string; avatarFile?: File | null }) {
    setLoading(true);
    try {
      const data = await apiUpdateProfile(opts);
      const email = data?.email || localStorage.getItem("user_email") || undefined;
      const role = data?.role || localStorage.getItem("user_role") || undefined;
      const avatar = data?.avatar || data?.photo || localStorage.getItem("user_avatar") || undefined;
      setUser({ email, role, avatar });
      return data;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    apiLogout();
    setUser(null);
  }

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
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
