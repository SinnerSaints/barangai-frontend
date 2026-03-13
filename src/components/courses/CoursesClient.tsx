"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, MoreVertical, Calendar, BarChart3 } from "lucide-react";
import TopBar from "@/components/dashboard/TopBar";
import { API_BASE_URL } from "@/lib/auth";
import { useTheme } from "@/context/theme";

interface Lesson {
  id: number;
  title: string;
  topic: string;
  content: string;
  url?: string;
  created_at: string;
  progress?: number; 
  total_lessons?: number;
  total_quizzes?: number;
}

export default function CoursesList({ apiUrl, searchQuery }: { apiUrl?: string; searchQuery?: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"enrolled" | "completed">("enrolled");

  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  const fetchEndpoint = apiUrl || `${baseUrl}lessons/`;

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const cachedCourses = localStorage.getItem("cached_courses"); // Same gihapon, para ka isa ra i call ang api.
        if(cachedCourses) {
          setLessons(JSON.parse(cachedCourses));
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("access_token");
        const response = await fetch(fetchEndpoint, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to load");
        const data = await response.json();
        // map and normalize server data to our UI model
        const mapped_lessons = ((data || []).map((l: any, idx: number) => ({
          id: l.id ?? idx,
          title: l.title ?? l.name ?? `Lesson ${idx + 1}`,
          topic: l.topic ?? l.category ?? "General",
          content: l.content ?? l.description ?? "",
          url: l.url ?? l.link ?? undefined,
          created_at: l.created_at ?? l.created ?? new Date().toISOString(),
          progress: typeof l.progress === 'number' ? l.progress : Math.floor(Math.random() * 90) + 5,
          total_lessons: l.total_lessons ?? 12,
          total_quizzes: l.total_quizzes ?? 3,
        })));

        localStorage.setItem("cached_courses", JSON.stringify(mapped_lessons)); // i-save ang fetched lessons, para ka isa ra i call ang api
        setLessons(mapped_lessons);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, [fetchEndpoint]);

  // derived filtered list (driven by searchQuery passed from page/TopBar)
  const filtered = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    return lessons.filter((l) => {
      if (!q) return true;
      return (l.title || "").toLowerCase().includes(q) || (l.topic || "").toLowerCase().includes(q);
    });
  }, [lessons, searchQuery]);

  if (loading) return (
    <div className="p-10 text-brandGreen font-bold text-center">Loading Courses...</div>
  );

  return (
    // make the component take remaining space when used alongside Sidebar
    <div className={`flex-1 p-8 lg:p-12 ${isDark ? 'bg-transparent' : 'bg-transparent'}`}>


      {/* Header: title and filters (search moved to TopBar) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 mt-6">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#034440]'}`}>Your Courses</h2>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-500'} text-sm`}>Continue learning where you left off.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="hidden md:block">
            <select value={activeTab} onChange={(e) => setActiveTab(e.target.value as any)} className="p-2 rounded border">
              <option value="enrolled">Enrolled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
  <div className="flex gap-4 items-center mb-6">
        <button onClick={() => setActiveTab('enrolled')} className={`px-4 py-2 rounded-full ${activeTab==='enrolled' ? 'bg-brandGreen/10 text-brandGreen font-semibold' : 'text-gray-500'}`}>
          Enrolled ({lessons.length})
        </button>
        <button onClick={() => setActiveTab('completed')} className={`px-4 py-2 rounded-full ${activeTab==='completed' ? 'bg-brandGreen/10 text-brandGreen font-semibold' : 'text-gray-500'}`}>
          Completed (0)
        </button>
      </div>

      {/* Courses Grid */}
      {/* Courses Grid */}
      {filtered.length === 0 ? (
        <div className={`${isDark ? 'text-zinc-300' : 'text-gray-500'} p-12 text-center`}>No courses found. Try a different search or refresh the page.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-10">
          {filtered.map((lesson) => (
            <article key={lesson.id} className={`flex flex-col overflow-hidden min-h-[360px] rounded-2xl transition-shadow duration-300 group border ${isDark ? 'bg-zinc-900 border-white/6 shadow-sm hover:shadow-md text-white' : 'bg-white border-gray-100 shadow-md hover:shadow-xl text-black'}`}>
              <div className={`relative h-52 w-full flex items-center justify-center rounded-t-2xl ${isDark ? 'bg-gradient-to-br from-[#143f2f] to-[#0f2b20]' : 'bg-gradient-to-br from-brandGreen/60 to-brandGreen/40'}`}>
                <BookOpen className="w-18 h-18 text-white/25" />
                <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-500 rounded-t-2xl" />
              </div>

              <div className="p-8 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 pr-4">
                    <h3 className={`font-poppins font-bold text-xl leading-snug line-clamp-2 ${isDark ? 'text-white' : 'text-[#034440]'}`}>{lesson.title}</h3>
                    <div className={`mt-3 text-sm line-clamp-3 ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>{lesson.content || "No description available."}</div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className={`px-3 py-1 text-sm rounded-full ${lesson.topic?.toLowerCase().includes('math') ? 'bg-yellow-100 text-yellow-800' : isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-blue-100 text-blue-800'}`}>{lesson.topic}</span>
                    <button className={`transition-colors ${isDark ? 'text-zinc-300 hover:text-accentGreen' : 'text-gray-400 hover:text-brandGreen'}`}><MoreVertical size={20} /></button>
                  </div>
                </div>

                <div className={`flex gap-6 text-sm mb-6 ${isDark ? 'text-zinc-300' : 'text-gray-500'}`}>
                  <div className="flex items-center gap-3">
                    <BookOpen size={18} className="text-[#9DE16A]" />
                    <span className="text-sm">{lesson.total_lessons} Lessons</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart3 size={18} className="text-[#9DE16A]" />
                    <span className="text-sm">{lesson.total_quizzes} Quizzes</span>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-gray-500'}`}>Progress</span>
                    <span className={`text-sm font-semibold ${isDark ? 'text-accentGreen' : 'text-brandGreen'}`}>{lesson.progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#A4ED7D] to-[#56CFAF] transition-all duration-1000" style={{ width: `${lesson.progress}%` }} />
                  </div>
                </div>

                <div className={`mt-6 pt-5 border-t ${isDark ? 'border-white/6' : 'border-gray-100'} flex items-center justify-between gap-4 text-sm ${isDark ? 'text-zinc-300' : 'text-gray-500'}`}>
                  <div className="flex items-center gap-3">
                    <Calendar size={16} />
                    <span>Last Activity: {new Date(lesson.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {lesson.url ? (
                      <Link href={lesson.url} target="_blank" className={`text-sm px-4 py-2 rounded-full font-semibold ${isDark ? 'bg-accentGreen text-black' : 'bg-accentGreen text-black'}`}>Open</Link>
                    ) : (
                      <button className={`text-sm px-4 py-2 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>View</button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      </div>
  );
}
