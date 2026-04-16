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
      // `brandGreen` should be a brand color, not a background.
      // Use a dark green for light mode, and a light green for dark mode.
      document.documentElement.style.setProperty("--brandGreen", isDark ? "#9CE067" : "#034440");
      document.documentElement.style.setProperty(
        "--brandGreen-rgb",
        isDark ? "156 225 103" : "3 68 64"
      );

      // Set foreground and background colors for use with `bg-background`, etc.
      document.documentElement.style.setProperty("--foreground", theme === "dark" ? "#ededed" : "#171717");
      document.documentElement.style.setProperty("--foreground-rgb", theme === "dark" ? "237 237 237" : "23 23 23");
      document.documentElement.style.setProperty("--background", theme === "dark" ? "#0a0a0a" : "#ffffff");
      document.documentElement.style.setProperty("--background-rgb", theme === "dark" ? "10 10 10" : "255 255 255");
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
