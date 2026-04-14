"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/auth";
import { LessonRecord, mapLesson, readCachedLessons, writeCachedLessons } from "@/lib/lessonProgress";
import { BookOpen } from "lucide-react";

export default function DashboardHero() {
  const [entered, setEntered] = useState(false);
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(t);
  }, []);

    useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Get username from localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem("user_email");
    const firstName = localStorage.getItem("first_name");

    if (!storedEmail) return;
    const emailName = storedEmail.split("@")[0]; // extract username
    const trimmedFirst = (firstName ?? "").trim();
    setUserName(trimmedFirst || emailName);
  }, []);

  useEffect(() => {
    const fetchLessons = async () => {
      const cachedLessons = readCachedLessons();
      if (cachedLessons.length > 0) {
        setLessons(cachedLessons);
      }

      try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(`${API_BASE_URL}lessons/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        const lessonItems = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
        const mappedLessons = lessonItems.map((lesson: any, index: number) => mapLesson(lesson, index + 1));
        writeCachedLessons(mappedLessons);
        setLessons(mappedLessons);

      } catch (err) {
        console.error(err);
      }
    };

    const storedUser = localStorage.getItem("user_name");
    if (storedUser) setUserName(storedUser);

    fetchLessons();
  }, []);

  const latestCourses = lessons.slice(0, 3);

  return (
    <section
      className={`w-full bg-[#034440] text-white rounded-2xl p-6 flex gap-6 items-center transition-all duration-700 ${
        entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      {/* LEFT CONTENT */}
      <div className="flex-1">
        <p className="text-sm opacity-80">Hey there, {userName} </p>

        <h2 className="text-3xl font-bold my-4">
          You’re enrolled in
          <span className="block text-4xl">{lessons.length} Courses</span>
          <span className="text-base opacity-80">keep learning!</span>
        </h2>

        <Link
          href="/courses"
          className="mt-2 inline-block bg-accentGreen text-black px-5 py-2 rounded-full font-semibold hover:scale-105 transition"
        >
          Continue Learning
        </Link>
      </div>

      {/* RIGHT SIDE COURSES */}
      <div className="flex gap-4">
        {latestCourses.map((course) => (
          <Link
            key={course.id}
            href="/courses"
            className="w-40 h-32 bg-white/20 backdrop-blur-md rounded-lg p-3 flex flex-col justify-between hover:bg-white/30 transition"
          >
            <BookOpen className="text-white/70" size={22} />

            <div>
              <p className="text-sm font-semibold line-clamp-2">
                {course.title}
              </p>

              <div className="w-full h-2 bg-white/20 rounded-full mt-2">
                <div
                  className="h-full bg-accentGreen rounded-full"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>
          </Link>
        ))}

        {/* fallback if no courses */}
        {latestCourses.length === 0 &&
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-40 h-32 bg-white/20 rounded-lg flex items-center justify-center text-white/50"
            >
              No Course
            </div>
          ))}
      </div>
    </section>
  );
}
