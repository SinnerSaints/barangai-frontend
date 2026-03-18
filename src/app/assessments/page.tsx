"use client";

import React from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import AssessmentsClient from "@/components/assessments/AssessmentsClient";

export default function AssessmentsPage() {
  const [collapsed, setCollapsed] = React.useState(false);

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
        <AssessmentsClient />
      </main>
    </div>
  );
}
