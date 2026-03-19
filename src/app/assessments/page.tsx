"use client";

import React from "react";
import Image from "next/image";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import Assessment from "@/components/dashboard/Assessment";
import chatBgLight from "@/assets/img/chatBotBg-white.png";
import chatBgDark from "@/assets/img/chatBotBg-black.png";
import { useTheme } from "@/context/theme";

export default function AssessmentsPage() {
  const [collapsed, setCollapsed] = React.useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

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

      <main className={`relative flex-1 overflow-hidden p-6 ${isDark ? "text-white" : "text-black"}`}>
        <div className="absolute inset-0 z-0">
          <Image src={isDark ? chatBgDark : chatBgLight} alt="background" fill className="object-cover opacity-95" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1200px]">
          <TopBar />
          <Assessment />
        </div>
      </main>
    </div>
  );
}
