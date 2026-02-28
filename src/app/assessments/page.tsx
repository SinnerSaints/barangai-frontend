"use client";

import Image from "next/image";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { useState } from "react";
import chatBgLight from "@/assets/img/chatBotBg-white.png";
import chatBgDark from "@/assets/img/chatBotBg-black.png";
import { useTheme } from "@/context/theme";

export default function AssessmentsPage() {
  const [assessments] = useState([
    { id: 1, title: "Community Needs Assessment", due: "2026-03-10", status: "Open" },
    { id: 2, title: "Volunteer Skills Check", due: "2026-04-01", status: "Draft" },
  ]);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className={`flex-1 p-6 relative overflow-hidden ${isDark ? "text-white" : "text-black"}`}>
        <div className="absolute inset-0 z-0">
          <Image src={isDark ? chatBgDark : chatBgLight} alt="background" fill className="object-cover opacity-95" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <TopBar />
          <h1 className="text-2xl font-bold mt-6">Assessments</h1>
          <div className="mt-4 grid gap-4">
            {assessments.map((a) => (
              <div key={a.id} className={isDark ? "bg-white/5 rounded p-4 flex justify-between items-center" : "bg-white/90 rounded p-4 flex justify-between items-center"}>
                <div>
                  <div className={isDark ? "font-semibold text-white" : "font-semibold text-gray-900"}>{a.title}</div>
                  <div className={isDark ? "text-sm text-gray-400" : "text-sm text-gray-700"}>Due: {a.due}</div>
                </div>
                <div className={isDark ? "text-sm px-3 py-1 rounded bg-white/10" : "text-sm px-3 py-1 rounded bg-white/10 text-gray-800"}>{a.status}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
