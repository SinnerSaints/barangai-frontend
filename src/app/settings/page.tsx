"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/theme";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { useAuth } from "@/context/auth";
import { isAdminRole } from "@/lib/roles";
import SettingsContent from "@/components/settings/SettingsContent";

export default function SettingsPage() {
  const { theme, toggle: toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();

  const [clientRole, setClientRole] = useState<string | null>(null);
  useEffect(() => {
    setClientRole(localStorage.getItem("user_role"));
  }, [user?.role]);

  const isAdmin = isAdminRole(user?.role ?? clientRole);

  // State for sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem("sidebar_collapsed");
      if (v !== null) setSidebarCollapsed(v === "true");
    } catch (err) {
      // ignore
    }
  }, []);

  const handleSidebarToggle = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try {
      localStorage.setItem("sidebar_collapsed", String(next));
    } catch {}
  };

  // State for chatbot download overlay
  const [chatbotOverlayState, setChatbotOverlayState] = useState<string | null>(null);
  useEffect(() => {
    try {
      setChatbotOverlayState(localStorage.getItem("download_chatbot_state"));
    } catch {}
  }, []);

  const handleChatbotOverlayReset = () => {
    try {
      localStorage.removeItem("download_chatbot_state");
      setChatbotOverlayState(null); // Reset to default (will open next time)
    } catch {}
  };

  // State for dashboard download promo
  const [dashboardPromoHidden, setDashboardPromoHidden] = useState(false);
  useEffect(() => {
    try {
      setDashboardPromoHidden(localStorage.getItem("dashboard_download_promo") === "hidden");
    } catch {}
  }, []);

  const handleDashboardPromoToggle = () => {
    const next = !dashboardPromoHidden;
    setDashboardPromoHidden(next);
    try {
      if (next) {
        localStorage.setItem("dashboard_download_promo", "hidden");
      } else {
        localStorage.removeItem("dashboard_download_promo");
      }
    } catch {}
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />

      <main className={`flex-1 p-6 ${isDark ? "text-white bg-black/90" : "text-black bg-gray-50"}`}>
        <div className="max-w-[1200px] mx-auto">
          <TopBar hideSearch />
          <SettingsContent
            isDark={isDark}
            isAdmin={isAdmin}
            chatbotOverlayState={chatbotOverlayState}
            dashboardPromoHidden={dashboardPromoHidden}
            sidebarCollapsed={sidebarCollapsed}
            toggleTheme={toggleTheme}
            handleSidebarToggle={handleSidebarToggle}
            handleChatbotOverlayReset={handleChatbotOverlayReset}
            handleDashboardPromoToggle={handleDashboardPromoToggle}
          />
        </div>
      </main>
    </div>
  );
}
