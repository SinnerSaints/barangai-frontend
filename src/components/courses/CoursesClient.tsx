"use client";

import Image from "next/image";
import TopBar from "@/components/dashboard/TopBar";
import CoursesList from "@/components/courses/CoursesList";
import chatBgLight from "@/assets/img/chatBotBg-white.png";
import chatBgDark from "@/assets/img/chatBotBg-black.png";
import { useTheme } from "@/context/theme";

export default function CoursesClient({ apiUrl }: { apiUrl?: string | undefined }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <main className={`flex-1 p-6 relative overflow-hidden ${isDark ? "text-white" : "text-black"}`}>
      <div className="absolute inset-0 z-0">
        <Image src={isDark ? chatBgDark : chatBgLight} alt="background" fill className="object-cover opacity-95" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <TopBar />
        <h1 className="text-2xl font-bold mt-6">Courses</h1>
        <p className={isDark ? "text-gray-400 mt-2" : "text-gray-700 mt-2"}>Browse available courses — mock data shown below.</p>
        <CoursesList apiUrl={apiUrl} />
      </div>
    </main>
  );
}
