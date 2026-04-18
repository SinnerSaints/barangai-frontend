"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/theme";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { useAuth } from "@/context/auth";
import { isAdminRole } from "@/lib/roles";
import SettingsContent from "@/components/settings/SettingsContent";
import { propEffect } from "framer-motion";
import { API_BASE_URL } from "@/lib/auth";

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

  const [preferredLanguage, setPreferredLanguage] = useState("default");
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("preferred_language");
      if (savedLang) setPreferredLanguage(savedLang);
    } catch {}
  },[])

  const handleLanguageChange = async (lang: string) => {
    const user_id = localStorage.getItem("user_id");

    // Optimistic UI update
    setPreferredLanguage(lang);
    
    try {
      localStorage.setItem("preferred_language", lang);
      const token = localStorage.getItem("access_token");

      if (!token) {
        console.warn("No auth token found, cannot sync language to backend.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}accounts/users/${user_id}/update/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ preferred_language: lang }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to update language on backend:", errorData);
        
        // Revert UI state if backend fails
        const oldLang = localStorage.getItem("preferred_language");
        if (oldLang) setPreferredLanguage(oldLang);
      } else {
         // Read the confirmed language back from the server
         const data = await response.json();
         
         // Failsafe: Use the newly selected 'lang' if the backend response is empty
         const confirmedLang = data.preferred_language || lang; 
         localStorage.setItem("preferred_language", confirmedLang);
      }
    } catch (error) { 
      console.error("Network error while updating the language:", error);
    }
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />

      <main className={"flex-1 p-6"}>
        <div className="max-w-[1200px] mx-auto">
          <TopBar hideSearch />
          <SettingsContent
            isDark={isDark}
            isAdmin={isAdmin}
            chatbotOverlayState={chatbotOverlayState}
            dashboardPromoHidden={dashboardPromoHidden}
            sidebarCollapsed={sidebarCollapsed}
            preferred_language={preferredLanguage}
            toggleTheme={toggleTheme}
            handleSidebarToggle={handleSidebarToggle}
            handleChatbotOverlayReset={handleChatbotOverlayReset}
            handleDashboardPromoToggle={handleDashboardPromoToggle}
            handleLanguageChange={handleLanguageChange}
          />
        </div>
      </main>
    </div>
  );
}
