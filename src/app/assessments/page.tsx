"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { useState } from "react";

export default function AssessmentsPage() {
  const [assessments] = useState([
    { id: 1, title: "Community Needs Assessment", due: "2026-03-10", status: "Open" },
    { id: 2, title: "Volunteer Skills Check", due: "2026-04-01", status: "Draft" },
  ]);

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <TopBar />
          <h1 className="text-2xl font-bold mt-6">Assessments</h1>
          <div className="mt-4 grid gap-4">
            {assessments.map((a) => (
              <div key={a.id} className="bg-white/5 rounded p-4 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-sm text-gray-400">Due: {a.due}</div>
                </div>
                <div className="text-sm px-3 py-1 rounded bg-white/10">{a.status}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
