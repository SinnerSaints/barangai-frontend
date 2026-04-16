"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, MoreVertical, Calendar, BarChart3 } from "lucide-react";
import TopBar from "@/components/dashboard/TopBar";
import { API_BASE_URL } from "@/lib/auth";
import { LessonRecord, mapLesson, readCachedLessons, writeCachedLessons } from "@/lib/lessonProgress";
import { useTheme } from "@/context/theme";

function getTopicColors(topic?: string | null) {
  const t = (topic || "").toLowerCase();

  // Word / Documents
  if (t.includes("word") || t.includes("document")) {
    return {
      banner: "from-blue-500/90 via-sky-400/90 to-blue-600/90",
      pill: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    };
  }

  // Excel / Spreadsheet
  if (t.includes("excel") || t.includes("sheet") || t.includes("spreadsheet")) {
    return {
      banner: "from-emerald-500/90 via-green-400/90 to-emerald-600/90",
      pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    };
  }

  // Internet / Browsing
  if (t.includes("internet") || t.includes("browser") || t.includes("online")) {
    return {
      banner: "from-amber-400/90 via-yellow-300/90 to-amber-500/90",
      pill: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    };
  }

  // Email / Communication
  if (t.includes("email") || t.includes("communication") || t.includes("messaging")) {
    return {
      banner: "from-violet-500/90 via-indigo-400/90 to-violet-600/90",
      pill: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    };
  }

  // Default: soft teal
  return {
    banner: "from-teal-500/90 via-cyan-400/90 to-teal-600/90",
    pill: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
  };
}

export default function CoursesList({ apiUrl, searchQuery }: { apiUrl?: string; searchQuery?: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"enrolled" | "completed">("enrolled");
  const [query, setQuery] = React.useState("");

  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  const fetchEndpoint = apiUrl || `${baseUrl}lessons/`;

  useEffect(() => {
    const fetchLessons = async () => {
      const cachedLessons = readCachedLessons();
      if (cachedLessons.length > 0) {
        setLessons(cachedLessons);
        setLoading(false);
      }

      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(fetchEndpoint, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to load");

        const data = await response.json();

        const lessonsArray = Array.isArray(data)
          ? data
          : data.results || [];

        const mappedLessons = lessonsArray.map((lesson: any, index: number) => mapLesson(lesson, index + 1));

        writeCachedLessons(mappedLessons);
        setLessons(mappedLessons);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [fetchEndpoint]);

  const filtered = useMemo(() => {
    const q = (query || searchQuery || "").trim().toLowerCase();
    return lessons.filter((l) => {
      if (!q) return true;
      return (l.title || "").toLowerCase().includes(q) || (l.topic || "").toLowerCase().includes(q);
    });
  }, [lessons, query, searchQuery]);

  const enrolledLessons = useMemo(() => filtered.filter((lesson) => !lesson.completed), [filtered]);
  const completedLessons = useMemo(() => filtered.filter((lesson) => lesson.completed), [filtered]);
  const visibleLessons = activeTab === "completed" ? completedLessons : enrolledLessons;

  if (loading) return (
    <div className="flex items-center justify-center h-full p-10 text-brandGreen font-medium">
      Loading Courses...
    </div>
  );

  return (
    <main
      className={`flex-1 p-6 md:p-8 lg:p-10 relative overflow-hidden ${
        isDark ? "text-zinc-100" : "text-zinc-900"
      }`}
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        <TopBar searchValue={query} onSearch={setQuery} />
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Your Courses</h2>
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Continue learning where you left off.
            </p>
          </div>
          
          <div className={`inline-flex p-1 rounded-lg border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <button 
              onClick={() => setActiveTab('enrolled')} 
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'enrolled' 
                  ? (isDark ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-brandGreen shadow-sm') 
                  : `text-zinc-500 hover:text-zinc-700 ${isDark ? 'hover:text-zinc-300' : ''}`
              }`}
            >
              Enrolled ({enrolledLessons.length})
            </button>
            <button 
              onClick={() => setActiveTab('completed')} 
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'completed' 
                  ? (isDark ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-brandGreen shadow-sm') 
                  : `text-zinc-500 hover:text-zinc-700 ${isDark ? 'hover:text-zinc-300' : ''}`
              }`}
            >
              Completed ({completedLessons.length})
            </button>
          </div>
        </div>

        {/* Courses Grid */}
        {visibleLessons.length === 0 ? (
          <div className={`p-12 text-center rounded-xl border border-dashed ${isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-500'}`}>
            {activeTab === "completed"
              ? "No completed courses yet. Finish a quiz to mark a lesson as complete."
              : "No courses found. Try a different search or refresh the page."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleLessons.map((lesson) => (
              <article 
                key={lesson.id} 
                className={`flex flex-col p-5 rounded-2xl transition-all duration-200 border hover:-translate-y-1 ${
                  isDark 
                    ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20' 
                    : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-200/40'
                }`}
              >
                {/* Topic banner */}
                <div className="relative -mx-5 -mt-5 mb-4 overflow-hidden rounded-t-2xl h-2.5">
                  <div
                    className={`h-full w-full bg-gradient-to-r ${getTopicColors(lesson.topic).banner}`}
                  />
                </div>

                {/* Card Top: Icon & Topic */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2.5 rounded-xl ${isDark ? 'bg-zinc-800 text-accentGreen' : 'bg-green-50 text-brandGreen'}`}>
                    <BookOpen size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md ${getTopicColors(lesson.topic).pill}`}
                    >
                      {lesson.topic}
                    </span>
                    <button className={`p-1 rounded-md transition-colors ${isDark ? 'text-zinc-500 hover:bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-100'}`}>
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>

                {/* Card Body: Title */}
                <div className="flex-1 mb-4">
                  <h3 className={`font-semibold text-lg leading-tight line-clamp-2 mb-1.5 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    {lesson.title}
                  </h3>
                  <div className="mt-1 text-xs font-medium">
                    {lesson.completed ? (
                      <span className={isDark ? "text-accentGreen" : "text-emerald-600"}>
                        Completed
                      </span>
                    ) : lesson.progress > 0 ? (
                      <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>
                        In progress
                      </span>
                    ) : (
                      <span className={isDark ? "text-zinc-500" : "text-zinc-400"}>
                        Not started
                      </span>
                    )}
                    {typeof lesson.score === "number" && (
                      <span className={`ml-2 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                        • Last score{" "}
                        <span className={isDark ? "text-accentGreen" : "text-emerald-600"}>
                          {lesson.score}%
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadata: Lessons & Quizzes */}
                <div className={`flex items-center justify-between text-xs font-medium mb-4 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={14} className={isDark ? "text-accentGreen" : "text-brandGreen"} />
                      <span>{lesson.total_lessons} Lessons</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BarChart3 size={14} className={isDark ? "text-accentGreen" : "text-brandGreen"} />
                      <span>{lesson.total_quizzes} Quizzes</span>
                    </div>
                  </div>
                  <div className={`hidden sm:flex items-center gap-1.5 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                    <Calendar size={12} />
                    <span>
                      {new Date(lesson.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Progress & Actions */}
                <div className="mt-auto space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Progress</span>
                      <span className={`text-xs font-bold ${isDark ? 'text-accentGreen' : 'text-brandGreen'}`}>
                        {lesson.progress}%
                      </span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                      <div 
                        className={`h-full rounded-full ${isDark ? 'bg-accentGreen' : 'bg-brandGreen'}`}
                        style={{ width: `${lesson.progress}%` }} 
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className={`flex items-center gap-1.5 text-[11px] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                      <Calendar size={11} />
                      <span>
                        {new Date(lesson.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {lesson.total_quizzes > 0 && (
                        <Link
                          href={`/courses/${lesson.id}#quizzes`}
                          className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                            isDark
                              ? "border-accentGreen/60 text-accentGreen hover:bg-accentGreen/10"
                              : "border-brandGreen/50 text-brandGreen hover:bg-brandGreen/10"
                          } transition-colors`}
                        >
                          Quizzes
                        </Link>
                      )}
                      <Link
                        href={`/courses/${lesson.id}`}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                          isDark 
                            ? "bg-accentGreen text-zinc-900 hover:bg-accentGreen/90" 
                            : "bg-brandGreen text-white hover:bg-brandGreen/90"
                        }`}
                      >
                        Open
                      </Link>
                    </div>
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