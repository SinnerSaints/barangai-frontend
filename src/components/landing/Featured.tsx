"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/auth";
import { mapLesson, readCachedLessons, type LessonRecord } from "@/lib/lessonProgress";
import RotatingText from "@/components/ui/text/RotatingText";

const FALLBACK_COURSES: LessonRecord[] = [
  {
    id: 1,
    title: "Digital Literacy Essentials",
    topic: "Basic Computer",
    content: "Get confident with files, apps, and everyday computer use.",
    created_at: new Date().toISOString(),
    progress: 45,
    completed: false,
    total_lessons: 8,
    total_quizzes: 3,
  },
  {
    id: 2,
    title: "Smart Document Processing",
    topic: "Document Processing",
    content: "Learn practical workflows for forms, letters, and records.",
    created_at: new Date().toISOString(),
    progress: 60,
    completed: false,
    total_lessons: 6,
    total_quizzes: 2,
  },
  {
    id: 3,
    title: "Spreadsheet Fundamentals",
    topic: "Spreadsheet",
    content: "Understand formulas, tables, and data organization basics.",
    created_at: new Date().toISOString(),
    progress: 20,
    completed: false,
    total_lessons: 7,
    total_quizzes: 2,
  },
];

export default function Featured() {
  const [courses, setCourses] = useState<LessonRecord[]>(FALLBACK_COURSES);

  useEffect(() => {
    const cached = readCachedLessons();
    if (cached.length > 0) setCourses(cached.slice(0, 6));

    const load = async () => {
      try {
        const base = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${base}lessons/`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const lessons = (Array.isArray(data) ? data : data?.results ?? [])
          .slice(0, 6)
          .map((lesson: unknown, idx: number) => mapLesson(lesson, idx + 1));
        if (lessons.length > 0) setCourses(lessons);
      } catch {
        // Keep cached/fallback courses for landing.
      }
    };

    void load();
  }, []);

  const carouselItems = useMemo(() => {
    const topThree = courses.slice(0, 3);
    return [...topThree, ...topThree, ...topThree];
  }, [courses]);

  const getTiltClass = (index: number) => {
    const pattern = ["rotate-[-4deg]", "rotate-[-2deg]", "rotate-0", "rotate-[2deg]", "rotate-[4deg]"];
    return pattern[index % pattern.length];
  };

  return (
    <section className="w-full h-full">
      <div className="mx-auto w-full max-w-7xl rounded-[36px] border border-[#9DE16A]/25 bg-[#0B1E1D]/85 px-5 py-10 text-white shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:px-8 md:py-14">
        <div className="mx-auto inline-flex w-full justify-center">
          <span className="rounded-full border border-[#9DE16A]/40 bg-[#9DE16A]/15 px-4 py-1 text-xs font-semibold text-[#C8F5A8] shadow-sm">
            Explore our most loved lessons
          </span>
        </div> 
        <h1 className="mt-5 text-center font-league text-5xl font-extrabold leading-[0.95] md:text-8xl">
          Learn Skills
          <br />
          with Modern{" "}
          <span className="inline-block align-middle text-[#9DE16A]">
            <RotatingText
              texts={["Courses", "Tutorials", "Lessons"]}
              mainClassName="inline-block"
              staggerFrom="last"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.03}
              splitLevelClassName="overflow-hidden"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            />
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-[#C5D9D8] md:text-xl">
          Boost your digital confidence through practical lessons designed for real community needs.
        </p>

        <div className="relative mx-auto mt-10 w-full overflow-hidden rounded-3xl p-2">
          <div className="featured-fade-left pointer-events-none absolute inset-y-0 left-0 z-20 w-16" />
          <div className="featured-fade-right pointer-events-none absolute inset-y-0 right-0 z-20 w-16" />

          <div className="featured-horizontal-track flex gap-4">
            {carouselItems.map((course, idx) => (
              <article
                key={`${course.id}-${idx}`}
                className={`h-[235px] min-w-[calc(100%-1rem)] rounded-[22px] border border-[#9DE16A]/20 bg-gradient-to-br from-[#123432]/90 to-[#0D2624]/90 p-4 text-white shadow-[0_8px_20px_rgba(0,0,0,0.28)] transition-transform duration-300 hover:scale-[1.01] sm:min-w-[calc(50%-0.5rem)] lg:min-w-[calc((100%-2rem)/3)] ${getTiltClass(
                  idx
                )}`}
              >
                <div className="flex h-full flex-col justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-xl font-bold">{course.title}</p>
                    <p className="mt-1 truncate text-xs uppercase tracking-wider text-[#9DE16A]">
                      {course.topic}
                    </p>
                    <p className="mt-3 line-clamp-3 text-sm text-[#D6E6E4]">
                      {course.content || "No description available."}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-[#9DE16A]/35 bg-[#9DE16A]/15 px-3 py-1 text-xs font-semibold text-[#D2F7B8]">
                      {course.total_lessons} lessons
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .featured-horizontal-track {
          animation: featuredHorizontalLoop 24s linear infinite;
          will-change: transform;
        }

        .featured-horizontal-track:hover {
          animation-play-state: paused;
        }

        .featured-fade-left {
          background: linear-gradient(90deg, rgba(11, 30, 29, 1) 0%, rgba(11, 30, 29, 0) 100%);
        }

        .featured-fade-right {
          background: linear-gradient(270deg, rgba(11, 30, 29, 1) 0%, rgba(11, 30, 29, 0) 100%);
        }

        @keyframes featuredHorizontalLoop {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-33.333% - 0.75rem));
          }
        }
      `}</style>
    </section>
  );
}