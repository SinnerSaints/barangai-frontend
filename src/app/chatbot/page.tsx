"use client";

import ChatbotPage from "@/components/chatbot/ChatBot";
import { useTheme } from "@/context/theme";
import React, { use } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";

export default function Chatbot() {

    const [collapsed, setCollapsed] = React.useState(false);
    const { theme } = useTheme();
    const isDark = theme === "dark";

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
      <main className={`flex-1 p-6 relative overflow-hidden ${isDark ? "text-white" : "text-black"}`}>
        <ChatbotPage />
      </main>
    </div>
  );
}