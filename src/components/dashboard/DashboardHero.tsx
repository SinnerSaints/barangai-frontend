"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/auth";
import { LessonRecord, mapLesson, readCachedLessons, writeCachedLessons } from "@/lib/lessonProgress";
import { BookOpen, ArrowUpRight } from "lucide-react";

export default function DashboardHero() {
  const [entered, setEntered] = useState(false);
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [userName, setUserName] = useState("User");

  // Animation trigger on mount
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Get username from localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem("user_email");
    const firstName = localStorage.getItem("first_name");
    
    if (!storedEmail) return;
    const emailName = storedEmail.split("@")[0];
    const trimmedFirst = (firstName ?? "").trim();
    setUserName(trimmedFirst || emailName);
  }, []);

  // Fetch logic
  useEffect(() => {
    const fetchLessons = async () => {
      // Load from cache first for instant UI response
      const cachedLessons = readCachedLessons();
      if (cachedLessons.length > 0) {
        setLessons(cachedLessons);
      }

      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}lessons/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch lessons");

        const data = await response.json();
        const lessonItems = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
        
        const mappedLessons = lessonItems.map((lesson: any, index: number) => 
          mapLesson(lesson, index + 1)
        );

        // Update cache and state
        writeCachedLessons(mappedLessons);
        setLessons(mappedLessons);

      } catch (err) {
        console.error("DashboardHero Fetch Error:", err);
      }
    };

    fetchLessons();
  }, []);

  const latestCourses = lessons.slice(0, 3);

  return (
    <section
      className={`relative w-full overflow-hidden rounded-2xl p-6 transition-all duration-700 ease-out border border-white/5 shadow-xl ${
        entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* SOLID DARK EMERALD BASE */}
      <div className="absolute inset-0 z-0 bg-[#043d39]" />
      
      {/* GLASSY MESH GRADIENTS */}
      <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-accentGreen/10 rounded-full blur-[80px]" />
      <div className="absolute bottom-[-50%] left-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        
        {/* LEFT: TEXT CONTENT */}
        <div className="flex-1 min-w-0">
          <p className="text-accentGreen text-xs font-bold uppercase tracking-wider mb-1">
            Welcome back, {userName}
          </p>
          <h2 className="text-white text-3xl font-black leading-tight">
            You&apos;re enrolled in <br />
            <span className="text-white/90">{lessons.length} Courses</span>
          </h2>
          <Link
            href="/courses"
            className="group mt-4 inline-flex items-center gap-2 bg-accentGreen hover:bg-white text-black text-xs font-black px-5 py-2.5 rounded-xl transition-all duration-300 active:scale-95"
          >
            CONTINUE LEARNING
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* RIGHT: COMPACT GLASS CARDS */}
        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {latestCourses.length > 0 ? (
            latestCourses.map((course) => (
              <div
                key={course.id}
                className="w-40 h-32 bg-white/5 backdrop-blur-md rounded-xl p-3 flex flex-col justify-between border border-white/10 group shrink-0"
              >
                <div className="h-7 w-7 bg-white/10 rounded-lg flex items-center justify-center text-accentGreen">
                  <BookOpen size={16} />
                </div>

                <div className="min-w-0">
                  <p className="text-white text-[11px] font-bold line-clamp-2 leading-tight mb-2">
                    {course.title}
                  </p>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accentGreen rounded-full shadow-[0_0_8px_rgba(140,213,89,0.4)] transition-all duration-1000"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* FALLBACK SKELETONS */
            [1, 2, 3].map((i) => (
              <div key={i} className="w-40 h-32 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center opacity-20 shrink-0">
                <BookOpen size={16} className="text-white" />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}