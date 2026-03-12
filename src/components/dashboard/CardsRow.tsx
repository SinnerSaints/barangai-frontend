"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/auth";
import { BookOpen } from "lucide-react";

type Course = {
  id: string | number;
  title: string;
  description?: string;
  progress?: number;
};

export default function CardsRow() {
  const [items, setItems] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
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

        const mapped = (data || []).map((d: any, idx: number) => ({
          id: d.id ?? idx,
          title: d.title ?? d.name ?? `Course ${idx + 1}`,
          description: d.content ?? d.description ?? "No description available.",
          progress:
            typeof d.progress === "number"
              ? d.progress
              : Math.floor(Math.random() * 80) + 10,
        }));

        setItems(mapped);
      } catch (err) {
        console.error(err);

        // fallback demo data
        setItems([
          { id: 1, title: "Intro to BarangAI", description: "Beginner course", progress: 20 },
          { id: 2, title: "Advanced AI", description: "Deep topics", progress: 50 },
          { id: 3, title: "Community Leadership", description: "Facilitation & growth", progress: 80 },
          { id: 4, title: "Field Practices", description: "Hands-on guidance", progress: 10 },
        ]);
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

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
      {loading &&
        new Array(4).fill(0).map((_, i) => (
          <div
            key={i}
            className="h-44 bg-gray-100 rounded-xl p-4 animate-pulse"
          />
        ))}

      {!loading &&
        items.map((c, idx) => (
          <div
            key={c.id}
            className={`h-44 bg-white rounded-xl p-5 flex flex-col justify-between border border-gray-100 shadow-md transform transition duration-300 ${
              entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            } hover:scale-[1.03] hover:shadow-xl`}
            style={{ transitionDelay: `${idx * 70}ms` }}
          >
            {/* Course info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={18} className="text-brandGreen" />
                <div className="text-lg font-semibold text-[#034440] line-clamp-1">
                  {c.title}
                </div>
              </div>

              <div className="text-sm text-gray-600 line-clamp-2">
                {c.description}
              </div>
            </div>

            {/* Progress */}
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
  );
}