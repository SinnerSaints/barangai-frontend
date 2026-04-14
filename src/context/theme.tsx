"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Important: keep the initial render deterministic between server and client
  // to avoid hydration mismatches (localStorage isn't available on the server).
  const [theme, setThemeState] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem("theme");
      if (v === "light" || v === "dark") setThemeState(v);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("theme", theme);
    } catch {}
    // set data-theme attribute on html for global CSS selectors if desired
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      // Theme-aware CSS variables so Tailwind utilities (e.g. `bg-brandGreen`)
      // can react to runtime theme toggles.
      const isDark = theme === "dark";
      document.documentElement.style.setProperty("--brandGreen", isDark ? "#060606" : "#ffffff");
      document.documentElement.style.setProperty(
        "--brandGreen-rgb",
        isDark ? "6 6 6" : "255 255 255"
      );
      document.documentElement.style.setProperty("--foreground", theme === "dark" ? "#ededed" : "#171717");
      document.documentElement.style.setProperty("--background", theme === "dark" ? "#0a0a0a" : "#ffffff");
    }
  }, [theme, ready]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggle = () => setThemeState((s) => (s === "light" ? "dark" : "light"));

  return <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
