"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Course = {
  id: string | number;
  title: string;
  description?: string;
  progress?: number;
};

type Props = {
  apiUrl?: string | undefined;
};

export default function CardsRow({ apiUrl }: Props) {
  const [items, setItems] = useState<Course[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!apiUrl) {
        // use mock data when no API provided
        setItems([
          { id: 1, title: "Intro to Barangai", description: "Beginner course", progress: 20 },
          { id: 2, title: "Advanced AI", description: "Deep topics", progress: 50 },
          { id: 3, title: "Community Leadership", description: "Facilitation & growth", progress: 80 },
          { id: 4, title: "Field Practices", description: "Hands-on guidance", progress: 10 },
        ]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        if (!cancelled) {
          // attempt to map server payload to Course[] (best-effort)
          const mapped = Array.isArray(data)
            ? data.map((d: any) => ({ id: d.id ?? d.pk ?? d._id, title: d.title || d.name || "Untitled", description: d.description, progress: d.progress }))
            : [];
          setItems(mapped);
        }
      } catch (err) {
        // fallback to mock on error
        if (!cancelled) {
          setItems([
            { id: 1, title: "Intro to Barangai", description: "Beginner course", progress: 20 },
            { id: 2, title: "Advanced AI", description: "Deep topics", progress: 50 },
            { id: 3, title: "Community Leadership", description: "Facilitation & growth", progress: 80 },
            { id: 4, title: "Field Practices", description: "Hands-on guidance", progress: 10 },
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  const list = items || [];
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setEntered(true), 60);
      return () => clearTimeout(t);
    }
  }, [loading]);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
      {loading && (
        <>
          {new Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-44 bg-gray-100 rounded-lg p-4 animate-pulse" />
          ))}
        </>
      )}

      {!loading && list.map((c, idx) => (
        <div
          key={c.id}
          className={`h-44 bg-white/90 rounded-lg p-4 flex flex-col justify-between transform transition duration-300 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"} hover:scale-[1.02] hover:shadow-lg`}
          style={{ transitionDelay: `${idx * 60}ms` }}
        >
          <div>
            <div className="text-lg font-semibold text-gray-900">{c.title}</div>
            <div className="text-sm text-gray-700 mt-1">{c.description}</div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Progress: {c.progress ?? 0}%</div>
            <Link href={c.id ? `/courses/${c.id}` : "/courses"} className="text-sm bg-accentGreen text-black px-3 py-1 rounded-full hover:brightness-95 transition">
              Continue
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
