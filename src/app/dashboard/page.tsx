"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, LockKeyhole } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import DashboardHero from "@/components/dashboard/DashboardHero";
import CardsRow from "@/components/dashboard/CardsRow";
import Assessment from "@/components/dashboard/Assessment";
import DownloadPromo from "@/components/dashboard/DownloadPromo";
import { useTheme } from "@/context/theme";
import { fetchAssessmentStatus } from "@/lib/preAssessment";

export default function DashboardPage() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [loadingStatus, setLoadingStatus] = React.useState(true);
  const [isLocked, setIsLocked] = React.useState(false);
  const [statusError, setStatusError] = React.useState(false);
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

  React.useEffect(() => {
    const loadAssessmentStatus = async () => {
      try {
        setLoadingStatus(true);
        setStatusError(false);
        const status = await fetchAssessmentStatus();
        setIsLocked(!status.pre_completed);
      } catch (err) {
        console.error(err);
        setIsLocked(true);
        setStatusError(true);
      } finally {
        setLoadingStatus(false);
      }
    };

    loadAssessmentStatus();
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

  const showLockOverlay = loadingStatus || isLocked;

  return (
    <div className="min-h-screen flex">
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      <main className={`relative flex-1 overflow-hidden p-6 ${isDark ? "text-white" : "text-black" }`}>
        <div
          aria-hidden={showLockOverlay}
          className={`relative z-10 mx-auto max-w-[1200px] transition ${showLockOverlay ? "pointer-events-none select-none blur-md" : ""}`}
        >
          <TopBar />

          <div className="mt-6">
            <DownloadPromo />
            <DashboardHero />
            <CardsRow />
            {!showLockOverlay && <Assessment />}
          </div>
        </div>

        {showLockOverlay && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 px-6 backdrop-blur-sm">
            <section
              className={`mx-auto w-full max-w-2xl rounded-[2rem] border p-8 shadow-2xl ${
                isDark
                  ? "border-white/10 bg-zinc-950/90 text-white"
                  : "border-gray-200 bg-white/95 text-[#034440]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-2xl p-3 ${isDark ? "bg-white/10" : "bg-brandGreen/10"}`}>
                  {loadingStatus ? (
                    <Loader2 className="h-7 w-7 animate-spin text-brandGreen" />
                  ) : (
                    <LockKeyhole className="h-7 w-7 text-brandGreen" />
                  )}
                </div>

                <div>
                  <h1 className="text-2xl font-bold">Courses are locked until the pre-assessment is done</h1>
                  <p className={`mt-3 ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                    {loadingStatus
                      ? "Checking your pre-assessment status right now."
                      : statusError
                        ? "Unable to verify your pre-assessment status right now."
                        : "Complete the pre-assessment first to unlock the dashboard, courses, and quizzes."}
                  </p>
                  <p className={`mt-2 text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
                    Your course recommendations should start only after we measure your current digital literacy level.
                  </p>

                  {!loadingStatus && (
                    <div className="mt-6">
                      <Link
                        href="/assessments"
                        className={`inline-flex rounded-full px-6 py-3 text-sm font-semibold ${
                          isDark ? "bg-accentGreen text-black" : "bg-brandGreen text-white"
                        }`}
                      >
                        TAKE YOUR PRE-ASSESSMENT
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
