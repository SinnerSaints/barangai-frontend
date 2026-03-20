"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/auth";
import { LessonRecord, mapLesson, readCachedLessons, writeCachedLessons } from "@/lib/lessonProgress";
import { BookOpen } from "lucide-react";

export default function CardsRow() {
  const [items, setItems] = useState<LessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      const cachedLessons = readCachedLessons();
      if (cachedLessons.length > 0) {
        setItems(cachedLessons);
        setLoading(false);
      }

      try {
        const token = localStorage.getItem("access_token");

        const res = await fetch(`${API_BASE_URL}lessons/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch courses");

        const data = await res.json();
        const lessonItems = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
        const mapped = lessonItems.map((item: any, index: number) => mapLesson(item, index + 1));
        writeCachedLessons(mapped);
        setItems(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setEntered(true), 80);
      return () => clearTimeout(t);
    }
  }, [loading]);

  // 👇 Limit to 4 lessons
  const visibleItems = items.slice(0, 4);

  return (
    <>
      <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        {loading &&
          new Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-44 bg-gray-100 rounded-xl p-4 animate-pulse" />
          ))}

        {!loading &&
          visibleItems.map((c, idx) => (
            <div
              key={c.id}
              className={`h-44 bg-white rounded-xl p-5 flex flex-col justify-between border border-gray-100 shadow-md transform transition duration-300 ${
                entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              } hover:scale-[1.03] hover:shadow-xl`}
              style={{ transitionDelay: `${idx * 70}ms` }}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={18} className="text-brandGreen" />
                  <div className="text-lg font-semibold text-[#034440] line-clamp-1">
                    {c.title}
                  </div>
                </div>

                <div className="text-sm text-gray-600 line-clamp-2">
                  {c.content || "No description available."}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="text-brandGreen font-semibold">
                    {c.progress ?? 0}%
                  </span>
                </div>

                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#A4ED7D] to-[#56CFAF]"
                    style={{ width: `${c.progress ?? 0}%` }}
                  />
                </div>

                <div className="flex justify-end mt-3">
                  <Link
                    href={`/courses/${c.id}`}
                    className="text-sm bg-accentGreen text-black px-3 py-1.5 rounded-full font-medium hover:brightness-95 transition"
                  >
                    Continue
                  </Link>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* 👇 View More Link */}
      {!loading && items.length > 4 && (
        <div className="flex justify-center mt-6">
          <Link
            href="/courses"
            className="text-sm font-medium text-brandGreen hover:underline"
          >
            View More →
          </Link>
        </div>
      )}
    </>
  );
}