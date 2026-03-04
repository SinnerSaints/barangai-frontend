"use client";

import { useEffect, useState } from "react";
import { BookOpen, MoreVertical, Calendar, BarChart3 } from "lucide-react";
import { API_BASE_URL } from "@/lib/auth";

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

export default function CoursesList({ apiUrl }: { apiUrl?: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  const fetchEndpoint = apiUrl || `${baseUrl}lessons/`;

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(fetchEndpoint, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to load");
        const data = await response.json();
        setLessons(data.map((l: any) => ({
          ...l,
          progress: Math.floor(Math.random() * 100),
          total_lessons: 32,
          total_quizzes: 4
        })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, [fetchEndpoint]);

  if (loading) return <div className="p-10 text-brandGreen font-bold text-center">Loading Courses...</div>;

  return (
    <div className="mt-8 px-4 md:px-0">
      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-300 mb-8">
        <button className="pb-3 border-b-2 border-brandGreen text-brandGreen font-semibold text-sm transition-all">
          Enrolled ({lessons.length})
        </button>
        <button className="pb-3 text-gray-400 font-medium text-sm hover:text-brandGreen transition-colors">
          Completed (0)
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {lessons.map((lesson) => (
          <div 
            key={lesson.id} 
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col overflow-hidden group border border-gray-100"
          >
            {/* Header / Image */}
            <div className="relative h-44 w-full bg-gradient-to-br from-brandGreen/60 to-brandGreen/40 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-white/25" />
              <div className="absolute inset-0 bg-black/5 group-hover:scale-105 transition-transform duration-500 rounded-t-xl" />
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-poppins font-bold text-[#034440] text-lg line-clamp-2">
                  {lesson.title}
                </h3>
                <button className="text-gray-400 hover:text-brandGreen transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-gray-500 text-sm mb-5">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-[#9DE16A]" />
                  <span>{lesson.total_lessons} Lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#9DE16A]" />
                  <span>{lesson.total_quizzes} Quizzes</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-auto">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-gray-400">Progress</span>
                  <span className="text-xs font-semibold text-brandGreen">{lesson.progress}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#A4ED7D] to-[#56CFAF] transition-all duration-1000"
                    style={{ width: `${lesson.progress}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                <Calendar size={14} />
                <span>Last Activity: {new Date(lesson.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}