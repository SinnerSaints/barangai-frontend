"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/context/theme";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { useAuth } from "@/context/auth";
import { isAdminRole } from "@/lib/roles";

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

          <div className={`w-full p-8 rounded-2xl shadow-lg mt-6 ${isDark ? "bg-zinc-900 border border-white/10" : "bg-white border border-gray-200"}`}>
            <h1 className="text-3xl font-bold mb-6">Settings</h1>

            <div className="space-y-8">
              {/* Profile Settings */}
              <div className={`pb-6 last:border-b-0 ${isDark ? "border-b border-white/10" : "border-b border-gray-200"}`}>
                <h2 className="text-xl font-semibold mb-3">Profile</h2>
                <p className={`${isDark ? "text-gray-400" : "text-gray-600"} text-sm mb-4`}>
                  Manage your personal information, email, and avatar.
                </p>
                <Link href="/profile" className="inline-flex items-center justify-center rounded-full bg-accentGreen px-5 py-2 text-sm font-semibold text-black hover:brightness-95 transition">
                  Edit Profile
                </Link>
              </div>

              {/* Administration Settings (Admin Only) */}
              {isAdmin && (
                <div className={`pb-6 last:border-b-0 ${isDark ? "border-b border-white/10" : "border-b border-gray-200"}`}>
                  <h2 className="text-xl font-semibold mb-3">Administration</h2>
                  <p className={`${isDark ? "text-gray-400" : "text-gray-600"} text-sm mb-4`}>
                    Access the admin panel to manage users, approvals, and system settings.
                  </p>
                  <Link href="/admin" className="inline-flex items-center justify-center rounded-full bg-accentGreen px-5 py-2 text-sm font-semibold text-black hover:brightness-95 transition">
                    Open Admin Panel
                  </Link>
                </div>
              )}

              {/* Appearance Settings */}
              <div className={`pb-6 last:border-b-0 ${isDark ? "border-b border-white/10" : "border-b border-gray-200"}`}>
                <h2 className="text-xl font-semibold mb-3">Appearance</h2>
                <div className="flex items-center justify-between py-2">
                  <span className="text-base">Dark Mode</span>
                  <button
                    onClick={toggleTheme}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isDark ? "bg-accentGreen" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isDark ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between py-2 mt-2">
                  <span className="text-base">Collapse Sidebar</span>
                  <button
                    onClick={handleSidebarToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      sidebarCollapsed ? "bg-accentGreen" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        sidebarCollapsed ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Notifications & Promos */}
              <div className={`pb-6 last:border-b-0 ${isDark ? "border-b border-white/10" : "border-b border-gray-200"}`}>
                <h2 className="text-xl font-semibold mb-3">Notifications & Promos</h2>
                <div className="flex items-center justify-between py-2">
                  <span className="text-base">Chatbot Download Overlay</span>
                  <button
                    onClick={handleChatbotOverlayReset}
                    className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:brightness-95 transition"
                  >
                    Reset
                  </button>
                </div>
                <p className={`${isDark ? "text-gray-400" : "text-gray-600"} text-xs mt-1`}>
                  Resets the state of the chatbot download overlay, making it appear again on the chatbot page. Current state: {chatbotOverlayState || "default"}.
                </p>

                <div className="flex items-center justify-between py-2 mt-4">
                  <span className="text-base">Dashboard Download Promo</span>
                  <button
                    onClick={handleDashboardPromoToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      !dashboardPromoHidden ? "bg-accentGreen" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        !dashboardPromoHidden ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <p className={`${isDark ? "text-gray-400" : "text-gray-600"} text-xs mt-1`}>
                  Toggle visibility of the download promo on the dashboard.
                </p>
              </div>

              {/* Other settings can be added here */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
