"use client";

import React from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import AssessmentGate from "@/components/assessment/AssessmentGate";
import CoursesClient from "@/components/courses/CoursesClient";

export default function CoursesPage() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [query, setQuery] = React.useState("");

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
          <AssessmentGate
            title="Courses are locked until the pre-assessment is done"
            description="Your course recommendations should start only after we measure your current digital literacy level."
          >
            <CoursesClient apiUrl={undefined} searchQuery={query} />
          </AssessmentGate>
        </main>
      </div>
  );
}
