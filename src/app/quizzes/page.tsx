"use client";

import React from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import AssessmentGate from "@/components/assessment/AssessmentGate";
import QuizPage from "@/components/quizzes/QuizPage";

export default function QuizzesPage() {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      const v = localStorage.getItem("sidebar_collapsed");
      if (v !== null) setCollapsed(v === "true");
    } catch {}
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
          title="Quizzes unlock after the pre-assessment"
          description="The quiz area opens only after the initial digital literacy score has been recorded."
        >
          <QuizPage />
        </AssessmentGate>
      </main>
    </div>
  );
}
