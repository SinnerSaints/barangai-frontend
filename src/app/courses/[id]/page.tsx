"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, Calendar, Download, ExternalLink } from "lucide-react";
import AssessmentGate from "@/components/assessment/AssessmentGate";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { API_BASE_URL } from "@/lib/auth";
import {
  LessonRecord,
  mapLesson,
  readCachedLessons,
  writeCachedLessons,
} from "@/lib/lessonProgress";
import { useTheme } from "@/context/theme";

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = Number(params?.id);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [lesson, setLesson] = useState<LessonRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Offline Access Handler
  const handleSaveOffline = () => {
    if (!lesson) return;
    const cached = readCachedLessons();
    const already = cached.some((item) => Number(item.id) === courseId);
    const updated = already
      ? cached.map((item) => Number(item.id) === courseId ? { ...lesson } : item)
      : [...cached, { ...lesson }];
    writeCachedLessons(updated);
    alert("Course saved for offline access!");
  };

  const baseUrl = API_BASE_URL.endsWith("/")
    ? API_BASE_URL
    : `${API_BASE_URL}/`;

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sidebar_collapsed");
      if (stored !== null) {
        setCollapsed(stored === "true");
      }
    } catch {}
  }, []);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!Number.isFinite(courseId)) {
        setError("Invalid course.");
        setLoading(false);
        return;
      }

      let cachedLesson: LessonRecord | null = null;

      try {
        cachedLesson =
          readCachedLessons().find(
            (item) => Number(item.id) === courseId
          ) ?? null;

        if (cachedLesson) {
          setLesson(cachedLesson);
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("access_token");

        const response = await fetch(
          `${baseUrl}lessons/${courseId}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const mappedLesson = mapLesson(data, courseId);

          const nextLessons = readCachedLessons();
          const mergedLessons =
            nextLessons.length === 0
              ? [mappedLesson]
              : nextLessons.some(
                  (item) => Number(item.id) === courseId
                )
              ? nextLessons.map((item) =>
                  Number(item.id) === courseId
                    ? mappedLesson
                    : item
                )
              : [...nextLessons, mappedLesson];

          writeCachedLessons(mergedLessons);
          setLesson(mappedLesson);
          return;
        }

        const listResponse = await fetch(`${baseUrl}lessons/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!listResponse.ok) {
          throw new Error("Failed to load course.");
        }

        const listData = await listResponse.json();
        const mappedLessons = Array.isArray(listData)
          ? listData.map((item, index) =>
              mapLesson(item, index + 1)
            )
          : [];

        const matchedLesson = mappedLessons.find(
          (item) => Number(item.id) === courseId
        );

        if (!matchedLesson) {
          throw new Error("Course not found.");
        }

        writeCachedLessons(mappedLessons);
        setLesson(matchedLesson);
      } catch (err) {
        console.error(err);
        if (!cachedLesson) {
          setError("Unable to load this course right now.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [baseUrl, courseId]);

  const toggle = () => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem("sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const createdAt = useMemo(() => {
    if (!lesson?.created_at) return "";
    return new Date(lesson.created_at).toLocaleDateString();
  }, [lesson?.created_at]);
  const topicBackHref = useMemo(() => {
    const topic = (lesson?.topic || "").trim();
    if (!topic) return "/courses";
    return `/courses/topic/${encodeURIComponent(topic)}`;
  }, [lesson?.topic]);

  // ✅ FIXED COMPLETE HANDLER (SYNC WITH BACKEND)
  const handleCompleteCourse = async () => {
    if (!lesson) return;

    try {
      const token = localStorage.getItem("access_token");

      const res = await fetch(`${baseUrl}lessons/${courseId}/complete/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();

      // ✅ USE BACKEND RESPONSE (TOGGLE SAFE)
      const updatedLesson = {
        ...lesson,
        completed: data.completed,
        progress: data.completed ? 100 : 0,
      };

      setLesson(updatedLesson);

      const cached = readCachedLessons();
      const updatedCache = cached.map((item) =>
        Number(item.id) === courseId ? updatedLesson : item
      );

      writeCachedLessons(updatedCache);

    } catch (err) {
      console.error("Backend update failed", err);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      <main
        className={`flex-1 p-8 lg:p-12 relative overflow-hidden ${
          isDark ? "text-white" : "text-black"
        }`}
      >
        <div className="relative z-10 flex h-full min-h-screen flex-col">
          <AssessmentGate
            title="Course content is locked until the pre-assessment is complete"
            description="Finish the dashboard pre-assessment first so the platform can place you at the right digital literacy level."
          >
            <TopBar searchValue={query} onSearch={setQuery} />

            <div className="mt-6 mb-6 flex items-center justify-between gap-4">
              <Link
                href={topicBackHref}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                  isDark
                    ? "bg-white/10 text-white"
                    : "bg-white/80 text-[#034440]"
                }`}
              >
                <ArrowLeft size={16} />
                Back to Lessons
              </Link>

              <div className="flex gap-3">
                {lesson?.url && (
                  <Link
                    href={lesson.url}
                    target="_blank"
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                      isDark
                        ? "bg-accentGreen text-black"
                        : "bg-brandGreen text-white"
                    }`}
                  >
                    <ExternalLink size={16} />
                    Open Resource
                  </Link>
                )}

                <button
                  onClick={handleSaveOffline}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-blue-600 text-white"
                >
                  <Download size={16} />
                  Save Offline
                </button>

                {/* ✅ TOGGLE BUTTON */}
                {lesson && (
                  <button
                    onClick={handleCompleteCourse}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                      lesson.completed
                        ? isDark
                          ? "bg-red-400 text-black"
                          : "bg-red-600 text-white"
                        : isDark
                        ? "bg-green-400 text-black"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    {lesson.completed ? "Mark Incomplete" : "Complete Course"}
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center font-bold text-brandGreen">
                Loading course...
              </div>
            ) : error ? (
              <div
                className={`rounded-3xl border p-8 ${
                  isDark
                    ? "border-white/10 bg-zinc-900/80"
                    : "border-gray-200 bg-white/90"
                }`}
              >
                <h1 className="text-2xl font-bold">
                  Course unavailable
                </h1>
                <p
                  className={`mt-3 ${
                    isDark ? "text-zinc-300" : "text-gray-600"
                  }`}
                >
                  {error}
                </p>
              </div>
            ) : lesson ? (
              <section
                className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border shadow-xl ${
                  isDark
                    ? "border-white/10 bg-zinc-950/90"
                    : "border-gray-200 bg-white/90"
                }`}
              >
                <div
                  className={`border-b px-8 py-7 ${
                    isDark ? "border-white/10" : "border-gray-200"
                  }`}
                >
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        isDark
                          ? "bg-zinc-800 text-zinc-200"
                          : "bg-brandGreen/10 text-brandGreen"
                      }`}
                    >
                      {lesson.topic}
                    </span>

                    <span
                      className={`inline-flex items-center gap-2 text-sm ${
                        isDark ? "text-zinc-400" : "text-gray-500"
                      }`}
                    >
                      <Calendar size={14} />
                      {createdAt}
                    </span>
                  </div>

                  <h1 className="max-w-4xl text-3xl font-bold leading-tight lg:text-4xl">
                    {lesson.title}
                  </h1>

                  <div
                    className={`mt-6 flex flex-wrap gap-6 text-sm ${
                      isDark ? "text-zinc-300" : "text-gray-600"
                    }`}
                  >
                    <div className="inline-flex items-center gap-3">
                      <BookOpen size={18} className="text-[#9DE16A]" />
                      <span>{lesson.total_lessons} Lessons</span>
                    </div>

                    <div>
                      <span className="font-semibold">
                        {lesson.total_quizzes}
                      </span>{" "}
                      quizzes
                    </div>

                    <div>
                      <span className="font-semibold">
                        {lesson.progress}%
                      </span>{" "}
                      progress
                    </div>

                    <div>
                      <span className="font-semibold">
                        {lesson.completed
                          ? "Completed"
                          : "In progress"}
                      </span>
                    </div>

                    {typeof lesson.score === "number" && (
                      <div>
                        <span className="font-semibold">
                          {lesson.score}%
                        </span>{" "}
                        latest score
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
                  <div className="max-w-4xl">
                    <h2
                      className={`mb-4 text-lg font-semibold ${
                        isDark
                          ? "text-zinc-100"
                          : "text-[#034440]"
                      }`}
                    >
                      Course Content
                    </h2>

                    <div
                      className={`whitespace-pre-wrap text-base leading-8 ${
                        isDark
                          ? "text-zinc-200"
                          : "text-gray-700"
                      }`}
                    >
                      {lesson.content ||
                        "No content available for this course yet."}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </AssessmentGate>
        </div>
      </main>
    </div>
  );
}