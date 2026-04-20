"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, LockKeyhole, Brain, BookOpen, Target, ArrowRight } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import DashboardHero from "@/components/dashboard/DashboardHero";
import CardsRow from "@/components/dashboard/CardsRow";
import Assessment from "@/components/dashboard/Assessment";
import DownloadPromo from "@/components/dashboard/DownloadPromo";
import { useTheme } from "@/context/theme";
import { fetchAssessmentStatus } from "@/lib/preAssessment";
import { fetchGeneralStatisticsReport, type GeneralStatisticsReport } from "@/lib/statistics";

export default function DashboardPage() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [loadingStatus, setLoadingStatus] = React.useState(true);
  const [isLocked, setIsLocked] = React.useState(false);
  const [statusError, setStatusError] = React.useState(false);
  
  // State for recommendations
  const [reportData, setReportData] = React.useState<GeneralStatisticsReport | null>(null);

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

  // Fetch Pre-assessment status
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

  // Fetch stats for the recommendation engine (only if dashboard is unlocked)
  React.useEffect(() => {
    const loadRecommendations = async () => {
      if (!isLocked && !loadingStatus) {
        try {
          const report = await fetchGeneralStatisticsReport();
          setReportData(report);
        } catch (err) {
          console.error("Failed to load statistics for recommendations:", err);
        }
      }
    };
    loadRecommendations();
  }, [isLocked, loadingStatus]);

  const toggle = () => {
    setCollapsed((s) => {
      const next = !s;
      try {
        localStorage.setItem("sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // Extract the absolute weakest topic
  const topWeakness = React.useMemo(() => {
    if (!reportData || !reportData.weaknesses || reportData.weaknesses.length === 0) return null;
    return [...reportData.weaknesses].sort((a, b) => a.accuracy_percent - b.accuracy_percent)[0];
  }, [reportData]);

  const showLockOverlay = loadingStatus || isLocked;

  return (
    <div className="min-h-screen flex">
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      <main className={`relative flex-1 overflow-hidden p-6 ${isDark ? "text-white" : "text-black" }`}>
        <div
          aria-hidden={showLockOverlay}
          className={`relative z-10 mx-auto max-w-[1200px] transition duration-300 ${showLockOverlay ? "pointer-events-none select-none blur-md" : ""}`}
        >
          <TopBar />

          <div className="mt-6 space-y-6">
            <DownloadPromo />
            <DashboardHero />
            
            {/* --- DYNAMIC RECOMMENDATIONS WIDGET --- */}
            {topWeakness && !showLockOverlay && (
              <div className={`relative overflow-hidden p-6 md:p-8 rounded-[20px] backdrop-blur-xl border transition-all duration-300 ${isDark ? "bg-[#1A322D]/40 border-white/10 shadow-black/40" : "bg-white border-[#1A322D]/10 shadow-[#1A322D]/5"}`}>
                {/* Subtle Background Glow */}
                <div className={`absolute -right-20 -top-20 w-64 h-64 blur-3xl rounded-full pointer-events-none opacity-50 ${isDark ? "bg-[#B4ED7C]/10" : "bg-[#5A9B29]/10"}`} />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl backdrop-blur-md ${isDark ? "bg-[#B4ED7C]/10 text-[#B4ED7C]" : "bg-[#B4ED7C]/30 text-[#3E7416]"}`}>
                        <Brain className="w-6 h-6" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold tracking-tight">Recommended for You</h2>
                    </div>
                  </div>
                  
                  <p className={`mb-6 text-sm md:text-base max-w-2xl ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
                    Based on your progress, spending a few minutes on <strong className={`font-semibold ${isDark ? "text-[#B4ED7C]" : "text-[#5A9B29]"}`}>{topWeakness.topic}</strong> will help close your knowledge gaps and boost your proficiency.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Lesson Card */}
                    <Link href="/lessons" className={`group flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.01] ${isDark ? "bg-white/[0.02] border-white/10 hover:bg-white/[0.06] hover:border-white/20" : "bg-slate-50/50 border-slate-200 hover:bg-white hover:shadow-md"}`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`p-3 rounded-xl shrink-0 ${isDark ? "bg-[#B4ED7C]/10 text-[#B4ED7C]" : "bg-[#B4ED7C]/20 text-[#3E7416]"}`}>
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-base mb-1 group-hover:underline decoration-2 underline-offset-4">Review Lesson</h3>
                          <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                            Revisit the fundamentals of {topWeakness.topic} to build a stronger foundation.
                          </p>
                        </div>
                      </div>
                    </Link>

                    {/* Quiz Card */}
                    <Link href="/quizzes" className={`group flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.01] ${isDark ? "bg-white/[0.02] border-white/10 hover:bg-white/[0.06] hover:border-white/20" : "bg-slate-50/50 border-slate-200 hover:bg-white hover:shadow-md"}`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`p-3 rounded-xl shrink-0 ${isDark ? "bg-[#B4ED7C]/10 text-[#B4ED7C]" : "bg-[#B4ED7C]/20 text-[#3E7416]"}`}>
                          <Target size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-base mb-1 group-hover:underline decoration-2 underline-offset-4">Targeted Practice</h3>
                          <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                            Take a quick quiz focused exclusively on {topWeakness.topic} to test your retention.
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}

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
                          isDark ? "bg-[#B4ED7C] text-black" : "bg-[#5A9B29] text-white"
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