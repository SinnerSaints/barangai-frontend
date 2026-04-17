"use client";

import React from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import AssessmentGate from "@/components/assessment/AssessmentGate";
import TopicLessonsClient from "@/components/courses/TopicLessonsClient";

export default function TopicLessonsPage() {
  const params = useParams<{ topic: string }>();
  const topic = decodeURIComponent(params?.topic ?? "");
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
          title="Courses are locked until the pre-assessment is done"
          description="Your course recommendations should start only after we measure your current digital literacy level."
        >
          <TopicLessonsClient topic={topic} />
        </AssessmentGate>
      </main>
    </div>
  );
}
