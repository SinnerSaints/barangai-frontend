"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ClipboardList, Calendar, BarChart3, Clock3, MoreVertical } from "lucide-react";
import TopBar from "@/components/dashboard/TopBar";
import { API_BASE_URL } from "@/lib/auth";
import { useTheme } from "@/context/theme";
import chatBgLight from "@/assets/img/chatBotBg-white.png";
import chatBgDark from "@/assets/img/chatBotBg-black.png";

// ------------------- Types -------------------
interface Question {
  id: number;
  question_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
}

interface Assessment {
  id: number;
  title: string;
  topic: string;
  questions: Question[];
  total_questions: number;
  created_at: string;
  total_attempts: number;
  time_limit?: number | null;
  status: string;
}

// ------------------- Mapping -------------------
function mapAssessment(item: any, idx: number): Assessment {
  return {
    id: item?.id ?? idx,
    title: item?.title ?? `Assessment ${idx + 1}`,
    topic: item?.lesson?.title ?? item?.topic ?? "General",
    questions: Array.isArray(item?.questions) ? item.questions : [],
    total_questions: Array.isArray(item?.questions) ? item.questions.length : 0,
    created_at: item?.created_at ?? item?.updated_at ?? new Date().toISOString(),
    total_attempts: item?.total_attempts ?? 0,
    time_limit: item?.time_limit ?? null,
    status: item?.status ?? "Published",
  };
}

// ------------------- Priority selection -------------------
function pickPriorityAssessments(items: Assessment[]) {
  const preferredIds = [1, 2];
  const selected: Assessment[] = [];
  const seen = new Set<number>();

  preferredIds.forEach((id) => {
    const match = items.find((item) => item.id === id);
    if (match) {
      selected.push(match);
      seen.add(match.id);
    }
  });

  if (selected.length < 2) {
    items.forEach((item) => {
      if (selected.length >= 2 || seen.has(item.id)) return;
      selected.push(item);
      seen.add(item.id);
    });
  }

  return selected.slice(0, 2);
}

// ------------------- Main Component -------------------
export default function AssessmentsClient({ searchQuery }: { searchQuery?: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
  const fetchEndpoint = `${baseUrl}quizzes/`; // endpoint should return a list of quizzes

  // ------------------- Fetch all quizzes -------------------
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setError("");
        setLoading(true);

        const token = localStorage.getItem("access_token");
        if (!token) throw new Error("No access token found");

        const res = await fetch(fetchEndpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to load quizzes");

        const data = await res.json();
        const items = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
        const mapped = items.map(mapAssessment);

        if (mapped.length === 0) setError("No quizzes found in the system.");

        setAssessments(mapped);
      } catch (err) {
        console.error(err);
        setError("Failed to load quizzes. Check your token or API.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [fetchEndpoint]);

  // ------------------- Filtering -------------------
  const filtered = useMemo(() => {
    const combined = [searchQuery, query].filter(Boolean).join(" ").trim().toLowerCase();
    return assessments.filter(a =>
      [a.title, a.topic, a.status].join(" ").toLowerCase().includes(combined)
    );
  }, [assessments, query, searchQuery]);

  const displayedAssessments = useMemo(() => pickPriorityAssessments(filtered), [filtered]);

  if (loading)
    return <div className="p-10 text-brandGreen font-bold text-center">Loading Assessments...</div>;

  // ------------------- Render -------------------
  return (
    <main className={`flex-1 p-8 lg:p-12 relative overflow-hidden ${isDark ? "text-white" : "text-black"}`}>
      <div className="absolute inset-0 z-0">
        <Image
          src={isDark ? chatBgDark : chatBgLight}
          alt="background"
          fill
          className="object-cover opacity-95"
        />
      </div>

      <div className="relative z-10">
        <TopBar searchValue={query} onSearch={setQuery} />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 mt-6">
          <div>
            <h2 className="text-2xl font-bold">Assessments</h2>
            <p className={`${isDark ? "text-gray-400" : "text-gray-600"} text-sm`}>
              Browse all quizzes available in the system.
            </p>
          </div>
          <div className={`inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm ${isDark ? "bg-white/10 text-zinc-200" : "bg-white/80 text-gray-700"}`}>
            <ClipboardList size={16} className="text-[#9DE16A]" />
            <span>{displayedAssessments.length} assessments</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className={`mb-6 rounded-2xl px-4 py-3 text-sm ${isDark ? "bg-red-500/10 text-red-200" : "bg-red-50 text-red-700"}`}>
            {error}
          </div>
        )}

        {/* Assessments Grid */}
        {displayedAssessments.length === 0 ? (
          <div className={`${isDark ? "text-zinc-300" : "text-gray-500"} p-12 text-center`}>
            No quizzes found. Try refreshing the page.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {displayedAssessments.map(a => (
              <article
                key={a.id}
                className={`flex flex-col overflow-hidden min-h-[320px] rounded-2xl transition-shadow duration-300 group border ${
                  isDark
                    ? "bg-zinc-900 border-white/6 shadow-sm hover:shadow-md text-white"
                    : "bg-white border-gray-100 shadow-md hover:shadow-xl text-black"
                }`}
              >
                <div className={`relative h-44 w-full flex items-center justify-center rounded-t-2xl ${isDark ? "bg-gradient-to-br from-[#143f2f] to-[#0f2b20]" : "bg-gradient-to-br from-brandGreen/60 to-brandGreen/40"}`}>
                  <ClipboardList className="w-16 h-16 text-white/25" />
                </div>

                <div className="p-8 flex flex-col flex-1">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className={`font-bold text-xl leading-snug line-clamp-2 ${isDark ? "text-white" : "text-[#034440]"}`}>
                        {a.title}
                      </h3>
                      <p className={`mt-3 text-sm line-clamp-3 ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                        {a.questions.length} Questions
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <span className={`px-3 py-1 text-sm rounded-full ${a.status.toLowerCase().includes("draft") ? "bg-yellow-100 text-yellow-800" : isDark ? "bg-zinc-800 text-zinc-200" : "bg-blue-100 text-blue-800"}`}>
                        {a.status}
                      </span>
                      <button className={`${isDark ? "text-zinc-300 hover:text-accentGreen" : "text-gray-400 hover:text-brandGreen"}`}>
                        <MoreVertical size={20} />
                      </button>
                    </div>
                  </div>

                  <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-6 ${isDark ? "text-zinc-300" : "text-gray-500"}`}>
                    <div className="flex items-center gap-3">
                      <BarChart3 size={18} className="text-[#9DE16A]" />
                      <span>{a.total_questions} Questions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ClipboardList size={18} className="text-[#9DE16A]" />
                      <span>{a.total_attempts} Attempts</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock3 size={18} className="text-[#9DE16A]" />
                      <span>{a.time_limit ? `${a.time_limit} mins` : "No limit"}</span>
                    </div>
                  </div>

                  <div className={`mt-auto pt-5 border-t flex items-center justify-between text-sm ${isDark ? "border-white/6 text-zinc-300" : "border-gray-100 text-gray-500"}`}>
                    <div className="flex items-center gap-3">
                      <Calendar size={16} />
                      <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                    <button className={`px-4 py-2 rounded-full font-semibold ${isDark ? "bg-zinc-800 text-zinc-100" : "bg-gray-100 text-gray-700"}`}>
                      Quiz #{a.id}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}