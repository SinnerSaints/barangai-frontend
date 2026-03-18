"use client";

import React from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import CoursesClient from "@/components/courses/CoursesClient";
import { useTheme } from "@/context/theme";

export default function CoursesPage() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // initialize collapsed state from localStorage on mount
  React.useEffect(() => {
    try {
      const v = localStorage.getItem("sidebar_collapsed");
      if (v !== null) setCollapsed(v === "true");
    } catch (err) {
      // ignore
    }
  }, []);

  const toggle = () => {
    setCollapsed((s) => {
      const next = !s;
      try {
        localStorage.setItem("sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
        <main className="flex-1">
          <CoursesClient apiUrl={undefined} searchQuery={query} />
        </main>
      </div>
  );
}
