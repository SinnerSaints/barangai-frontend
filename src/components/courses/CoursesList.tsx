"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Course = { id: number; title: string; level?: string; enrolled?: number };

export default function CoursesList({ apiUrl }: { apiUrl?: string }) {
  const [list, setList] = useState<Course[] | null>(null);
  useEffect(() => {
    if (!apiUrl) {
      setList([
        { id: 1, title: "Intro to Barangai", level: "Beginner", enrolled: 124 },
        { id: 2, title: "Advanced Community AI", level: "Advanced", enrolled: 32 },
        { id: 3, title: "Field Practices", level: "Intermediate", enrolled: 58 },
      ]);
      return;
    }
    // attempt fetch if provided
    fetch(apiUrl)
      .then((r) => r.json())
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]));
  }, [apiUrl]);

  if (!list) return <div className="text-gray-400">Loading courses...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      {list.map((c) => (
        <div key={c.id} className="p-4 rounded bg-white/5">
          <div className="text-lg font-semibold">{c.title}</div>
          <div className="text-sm text-gray-400">{c.level} • {c.enrolled} enrolled</div>
          <div className="mt-3 flex justify-between items-center">
            <Link href={`/courses/${c.id}`} className="text-sm bg-accentGreen text-black px-3 py-1 rounded-full">Open</Link>
            <button className="text-sm text-gray-300">Preview</button>
          </div>
        </div>
      ))}
    </div>
  );
}
