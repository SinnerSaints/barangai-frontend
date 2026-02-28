"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardHero() {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className={`w-full bg-[#034440] text-white rounded-2xl p-6 flex gap-6 items-center transition-all duration-700 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
      <div className="flex-1">
        <p className="text-sm opacity-80">Hey there, User!</p>
        <h2 className="text-3xl font-bold my-4">You’ve completed
          <span className="block text-4xl">5 Courses</span>
          <span className="text-base">this week</span>
        </h2>
        <Link href="/courses" className="mt-2 inline-block bg-accentGreen text-black px-4 py-2 rounded-full">Get Started</Link>
      </div>

      <div className="flex gap-4">
        <div className="w-40 h-32 bg-white/30 rounded-md" />
        <div className="w-40 h-32 bg-white/30 rounded-md" />
        <div className="w-40 h-32 bg-white/30 rounded-md" />
      </div>
    </section>
  );
}
