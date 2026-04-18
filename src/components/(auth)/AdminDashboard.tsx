"use client"

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/auth";
import { useTheme } from "@/context/theme";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { 
  Check, X, Trash2, Search, RefreshCw, AlertCircle, Users, 
  BookOpen, ClipboardList, Plus, Pencil, BarChart3, ChevronLeft 
} from "lucide-react";

type UserStats = {
  pre_assessment?: {
    score: number;
    completed_at: string;
  };
  lesson_progress: {
    title: string;
    progress: number;
    completed: boolean;
  }[];
  quiz_history: {
    quiz_title: string;
    score: number;
    date: string;
    correct_count: number;
    total_questions: number;
  }[];
};

type UserItem = {
  id: number;
  email: string;
  password?: string;
  role?: string;
  is_active?: boolean;
  is_approved?: boolean;
  stats?: UserStats;
  [k: string]: any;
};

type QuestionInput = {
  id?: number; 
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_choice: string;
};

export default function AdminDashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<"users" | "courses" | "quizzes" | "tracking">("users");

  // State for sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem("sidebar_collapsed");
      if (v !== null) setSidebarCollapsed(v === "true");
    } catch {}
  }, []);

  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserItem[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingQuery, setPendingQuery] = useState("");
  const [approvedQuery, setApprovedQuery] = useState("");

  // States for Course Management
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [courseThumbnail, setCourseThumbnail] = useState<File | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseTopic, setCourseTopic] = useState("");
  const [courseContent, setCourseContent] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [courseMsg, setCourseMsg] = useState("");

  // States for Quiz Management
  const [quizzesList, setQuizzesList] = useState<any[]>([]);
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizLessonId, setQuizLessonId] = useState("");
  const [questions, setQuestions] = useState<QuestionInput[]>([{ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_choice: "A" }]);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [quizMsg, setQuizMsg] = useState("");
  const [adminLessons, setAdminLessons] = useState<any[]>([]);

  // State for Track Management
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [trackingQuery, setTrackingQuery] = useState("");

  const handleSidebarToggle = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try {
      localStorage.setItem("sidebar_collapsed", String(next));
    } catch {}
  };

  const getAccessToken = async () => { 
    let token = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (!token && refreshToken) {
      try {
        const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/accounts/token/`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({refresh: refreshToken}),
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem("access_token", data.access);
          return data.access;
        }
      } catch (err) {
        console.error("Token refresh failed", err)
      }
    }
    return token;
  };

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken(); 
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/accounts/users/`, { headers });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const mapped: UserItem[] = data.map((u: any, idx: number) => ({
          id: u.id ?? idx + 1,
          email: u.email ?? u.user ?? "",
          password: (u.password as string) ?? (u.raw_password as string) ?? undefined,
          role: u.role ?? undefined,
          is_active: u.is_active ?? u.isActive ?? undefined,
          is_approved: u.is_approved ?? u.isApproved ?? undefined,
          ...u,
        }));

        setUsers(mapped);
        const approved = mapped.filter((x) => {
          if (typeof x.is_active === "boolean") return x.is_active === true;
          if (typeof x.is_approved === "boolean") return x.is_approved === true;
          return false;
        });
        const pending = mapped.filter((x) => !approved.includes(x));
        setApprovedUsers(approved);
        setPendingUsers(pending);
        setLastRefreshed(new Date().toLocaleString());
      } else {
        setUsers([]);
        setApprovedUsers([]);
        setPendingUsers([]);
        setLastRefreshed(new Date().toLocaleString());
      }
    } catch (err: any) {
      setError("Unable to load pending users from server — using sample data.");
      const sample = [
        { id: 1, email: "user1@example.com", password: "pass123", role: "CAPTAIN", is_active: false },
        { id: 2, email: "user2@example.com", password: "hunter2", role: "OFFICIALS", is_active: false },
        { id: 3, email: "approved@example.com", password: undefined, role: "CAPTAIN", is_active: true },
      ];
      setUsers(sample as any);
      setPendingUsers(sample.filter((s) => !s.is_active));
      setApprovedUsers(sample.filter((s) => s.is_active));
      setLastRefreshed(new Date().toLocaleString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  useEffect(() => {
    const fetchTabData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getAccessToken();
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        if (activeTab === 'courses' || activeTab === 'quizzes') {
          const lessonsRes = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/lessons/`, { headers });
          if (!lessonsRes.ok) throw new Error('Failed to fetch lessons');
          const lessonsData = await lessonsRes.json();
          const lessons = Array.isArray(lessonsData) ? lessonsData : lessonsData.results || [];
          setAdminLessons(lessons);
          if (activeTab === 'courses') {
            setCoursesList(lessons);
          }
        }
        
        if (activeTab === 'quizzes') {
          const quizzesRes = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/quizzes/admin/`, { headers });
          if (!quizzesRes.ok) throw new Error('Failed to fetch quizzes');
          const quizzesData = await quizzesRes.json();
          setQuizzesList(Array.isArray(quizzesData) ? quizzesData : quizzesData.results || []);
        }
      } catch (err: any) {
        setError(err.message || `Failed to load data for ${activeTab} tab.`);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'courses' || activeTab === 'quizzes') {
      fetchTabData();
    }
  }, [activeTab]);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setError(null);
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const endpointAction = action === "approve" ? "approve" : "delete";
      const url = `${API_BASE_URL.replace(/\/$/, "")}/accounts/users/${id}/${endpointAction}/`;

      const res = await fetch(url, {
        method: action === "approve" ? "PATCH" : "DELETE",
        headers,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Server returned ${res.status} ${text}`);
      }
      await fetchPending();
    } catch (err: any) {
      setError(`Unable to ${action} user: ${err?.message || err}`);
      await fetchPending();
    } finally {
      setLoading(false);
    }
  };

  /* ================= COURSE LOGIC ================= */
  const handleStartEditCourse = (course: any) => {
    setEditingCourseId(course.id);
    setCourseTitle(course.title || "");
    setCourseTopic(course.topic || "");
    setCourseContent(course.content || "");
    setCourseThumbnail(null);
    setCourseMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelCourseEdit = () => {
    setEditingCourseId(null);
    setCourseTitle("");
    setCourseTopic("");
    setCourseContent("");
    setCourseThumbnail(null);
    setCourseMsg("");
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCourse(true);
    setCourseMsg("");
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const formData = new FormData();
      formData.append('title', courseTitle);
      formData.append('topic', courseTopic);
      formData.append('content', courseContent);
      if (courseThumbnail) {
        formData.append('thumbnail', courseThumbnail);
      }

      const isEditing = editingCourseId !== null;
      const url = isEditing 
        ? `${API_BASE_URL.replace(/\/$/, "")}/lessons/${editingCourseId}/`
        : `${API_BASE_URL.replace(/\/$/, "")}/lessons/`;

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers,
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to save course' }));
        throw new Error(errorData.detail || 'Failed to save course');
      }

      setCourseMsg(isEditing ? "Course updated successfully! ✅" : "Course created successfully! ✅");
      cancelCourseEdit();
      
      const lessonsRes = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/lessons/`, { headers });
      const lessonsData = await lessonsRes.json();
      setCoursesList(Array.isArray(lessonsData) ? lessonsData : lessonsData.results || []);
      
    } catch (err: any) {
      setCourseMsg("Error: " + err.message);
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    setLoading(true);
    setError(null);
    try {
        const token = await getAccessToken();
        const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/lessons/${id}/`, {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to delete course");
        setCourseMsg("Course deleted successfully.");
        setCoursesList(coursesList.filter(c => c.id !== id));
    } catch (err: any) {
        setError(err.message || "Failed to delete course.");
    } finally {
        setLoading(false);
    }
  };

  /* ================= QUIZ LOGIC ================= */
  const handleStartEditQuiz = (quiz: any) => {
    setEditingQuizId(quiz.id);
    setQuizTitle(quiz.title || "");
    setQuizLessonId(quiz.lesson ? String(quiz.lesson) : "");

    if (quiz.questions && quiz.questions.length > 0) {
      setQuestions(quiz.questions.map((q: any) => ({
        id: q.id,
        question_text: q.question_text || "",
        option_a: q.choice_a || q.option_a || "",
        option_b: q.choice_b || q.option_b || "",
        option_c: q.choice_c || q.option_c || "",
        option_d: q.choice_d || q.option_d || "",
        correct_choice: q.correct_choice || "A"
      })));
    } else {
      setQuestions([{ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_choice: "A" }]);
    }
    
    setQuizMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelQuizEdit = () => {
    setEditingQuizId(null);
    setQuizTitle("");
    setQuizLessonId("");
    setQuestions([{ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_choice: "A" }]);
    setQuizMsg("");
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingQuiz(true);
    setQuizMsg("");
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const payload = {
        title: quizTitle,
        lesson: parseInt(quizLessonId),
        questions: questions.map(q => ({
          ...(q.id ? { id: q.id } : {}),
          question_text: q.question_text,
          choice_a: q.option_a,
          choice_b: q.option_b,
          choice_c: q.option_c,
          choice_d: q.option_d,
          correct_choice: q.correct_choice
        }))
      };

      const isEditing = editingQuizId !== null;
      const url = isEditing 
        ? `${API_BASE_URL.replace(/\/$/, "")}/quizzes/admin/${editingQuizId}/`
        : `${API_BASE_URL.replace(/\/$/, "")}/quizzes/admin/`;

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers,
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to save quiz.' }));
        let errorMessage = 'Failed to save quiz.';
        if (typeof errorData === 'object' && errorData !== null) {
            if (errorData.detail) {
                errorMessage = `Error: ${errorData.detail}`;
            } else {
                const fieldErrors = Object.entries(errorData).map(([field, errors]) => {
                    const errorString = Array.isArray(errors) ? errors.join(' ') : JSON.stringify(errors);
                    return `${field}: ${errorString}`;
                }).join('; ');
                if (fieldErrors) errorMessage = `Validation failed: ${fieldErrors}`;
            }
        }
        throw new Error(errorMessage);
      }

      setQuizMsg(isEditing ? "Quiz updated successfully! ✅" : "Quiz created successfully! ✅");
      cancelQuizEdit();

      const quizzesRes = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/quizzes/admin/`, { headers });
      const quizzesData = await quizzesRes.json();
      setQuizzesList(Array.isArray(quizzesData) ? quizzesData : quizzesData.results || []);
    } catch (err: any) {
      setQuizMsg("Error: " + err.message);
    } finally {
      setCreatingQuiz(false);
    }
  };

  const addQuestion = () => setQuestions([...questions, { question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_choice: "A" }]);
  const removeQuestion = (idx: number) => setQuestions(questions.filter((_, i) => i !== idx));
  const updateQuestion = (idx: number, field: Exclude<keyof QuestionInput, "id">, value: string) => {
    const newQ = [...questions];
    newQ[idx][field] = value;
    setQuestions(newQ);
  };

  const handleDeleteQuiz = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) return;
    setLoading(true);
    setError(null);
    try {
        const token = await getAccessToken();
        const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/quizzes/admin/${id}/`, {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to delete quiz");
        setQuizMsg("Quiz deleted successfully.");
        setQuizzesList(quizzesList.filter(q => q.id !== id));
    } catch (err: any) {
        setError(err.message || "Failed to delete quiz.");
    } finally {
        setLoading(false);
    }
  };

  /* ================= TRACKING LOGIC ================= */
  const fetchUserDetails = async (user: UserItem) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const base = API_BASE_URL.replace(/\/$/, "");
  
      const [progressRes, statsRes] = await Promise.all([
        fetch(`${base}/accounts/users/${user.id}/progress/`, { headers }),
        fetch(`${base}/accounts/users/${user.id}/statistics/`, { headers }),
      ]);
  
      if (!progressRes.ok || !statsRes.ok)
        throw new Error("Failed to fetch user data");
  
      const progressData = await progressRes.json();
      const statsData = await statsRes.json();
  
      setSelectedUser({
        ...user,
        stats: {
          pre_assessment: progressData.pre_assessment ?? null,
          lesson_progress: progressData.lesson_progress ?? [],
          quiz_history: statsData.quiz_history ?? [],
        },
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex relative">
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />

      <main className={`flex-1 p-6 lg:p-8 ${isDark ? " text-white" : " text-black"}`}>
        <div className="max-w-[1200px] mx-auto space-y-6">
          <TopBar hideSearch />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
                Manage users, courses, quizzes, and tracking
              </p>
            </div>
            <button
              onClick={fetchPending}
              disabled={loading}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-black"
              } disabled:opacity-50`}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh Data
            </button>
          </div>

          {/* Tabs */}
          <div className={`flex items-center gap-6 border-b overflow-x-auto ${isDark ? "border-white/10" : "border-gray-200"}`}>
            <button
              onClick={() => { setActiveTab("users"); setSelectedUser(null); }}
              className={`whitespace-nowrap pb-3 text-sm font-medium flex items-center gap-2 transition-colors relative ${activeTab === "users" ? (isDark ? "text-accentGreen" : "text-brandGreen") : (isDark ? "text-zinc-400 hover:text-zinc-200" : "text-gray-500 hover:text-gray-700")}`}
            >
              <Users size={18} /> User Management
              {activeTab === "users" && <span className={`absolute bottom-0 left-0 w-full h-0.5 ${isDark ? "bg-accentGreen" : "bg-brandGreen"}`}></span>}
            </button>
            <button
              onClick={() => { setActiveTab("courses"); setSelectedUser(null); }}
              className={`whitespace-nowrap pb-3 text-sm font-medium flex items-center gap-2 transition-colors relative ${activeTab === "courses" ? (isDark ? "text-accentGreen" : "text-brandGreen") : (isDark ? "text-zinc-400 hover:text-zinc-200" : "text-gray-500 hover:text-gray-700")}`}
            >
              <BookOpen size={18} /> Course Management
              {activeTab === "courses" && <span className={`absolute bottom-0 left-0 w-full h-0.5 ${isDark ? "bg-accentGreen" : "bg-brandGreen"}`}></span>}
            </button>
            <button
              onClick={() => { setActiveTab("quizzes"); setSelectedUser(null); }}
              className={`whitespace-nowrap pb-3 text-sm font-medium flex items-center gap-2 transition-colors relative ${activeTab === "quizzes" ? (isDark ? "text-accentGreen" : "text-brandGreen") : (isDark ? "text-zinc-400 hover:text-zinc-200" : "text-gray-500 hover:text-gray-700")}`}
            >
              <ClipboardList size={18} /> Quiz Management
              {activeTab === "quizzes" && <span className={`absolute bottom-0 left-0 w-full h-0.5 ${isDark ? "bg-accentGreen" : "bg-brandGreen"}`}></span>}
            </button>
            <button
              onClick={() => setActiveTab("tracking")}
              className={`whitespace-nowrap pb-3 text-sm font-medium flex items-center gap-2 transition-colors relative ${activeTab === "tracking" ? (isDark ? "text-accentGreen" : "text-brandGreen") : (isDark ? "text-zinc-400 hover:text-zinc-200" : "text-gray-500 hover:text-gray-700")}`}
            >
              <BarChart3 size={18} /> Track Management
              {activeTab === "tracking" && <span className={`absolute bottom-0 left-0 w-full h-0.5 ${isDark ? "bg-accentGreen" : "bg-brandGreen"}`}></span>}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`flex items-start gap-3 p-4 rounded-2xl border text-sm ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* CONTENT BY TAB */}
          
          {activeTab === "users" && (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-6 rounded-2xl border ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
                  <p className={`text-sm font-medium ${isDark ? "text-zinc-400" : "text-gray-500"}`}>Total Users</p>
                  <p className="mt-2 text-4xl font-bold">{users?.length ?? (pendingUsers.length + approvedUsers.length)}</p>
                </div>
                <div className={`p-6 rounded-2xl border ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
                  <p className={`text-sm font-medium ${isDark ? "text-zinc-400" : "text-gray-500"}`}>Pending Approvals</p>
                  <p className="mt-2 text-4xl font-bold text-yellow-500">{pendingUsers ? pendingUsers.length : "—"}</p>
                </div>
                <div className={`p-6 rounded-2xl border flex flex-col justify-between ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-zinc-400" : "text-gray-500"}`}>Approved</p>
                    <p className="mt-2 text-4xl font-bold text-accentGreen">{approvedUsers ? approvedUsers.length : "—"}</p>
                  </div>
                  <div className={`text-xs mt-4 ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                    Last refreshed: {lastRefreshed ?? "Not refreshed yet"}
                  </div>
                </div>
              </div>

              {/* Users Tables */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <section className={`rounded-2xl border overflow-hidden ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
                  <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? "border-white/10" : "border-gray-200"}`}>
                    <div>
                      <h2 className="text-xl font-semibold">Pending Users</h2>
                      <p className={`text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>{pendingUsers.length} waiting for approval</p>
                    </div>
                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-zinc-400" : "text-gray-500"}`} />
                      <input
                        value={pendingQuery}
                        onChange={(e) => setPendingQuery(e.target.value)}
                        placeholder="Search pending..."
                        className={`pl-9 pr-4 py-2 w-full sm:w-64 rounded-full text-sm outline-none border transition-colors ${isDark ? "bg-black/50 border-white/10 focus:border-accentGreen text-white placeholder:text-zinc-500" : "bg-gray-50 border-gray-200 focus:border-brandGreen text-black placeholder:text-gray-400"}`}
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className={`text-xs uppercase tracking-wider ${isDark ? "bg-black/40 text-zinc-400" : "bg-gray-50 text-gray-500"}`}>
                          <th className="px-6 py-4 font-medium">ID</th>
                          <th className="px-6 py-4 font-medium">Email</th>
                          <th className="px-6 py-4 font-medium">Role</th>
                          <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? "divide-white/10" : "divide-gray-200"}`}>
                        {pendingUsers && pendingUsers.length > 0 ? (
                          pendingUsers
                            .filter((u) => {
                              const q = pendingQuery.trim().toLowerCase();
                              if (!q) return true;
                              return (u.email || "").toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q);
                            })
                            .map((u) => (
                              <tr key={`p-${u.id}`} className={`transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                                <td className={`px-6 py-4 text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>#{u.id}</td>
                                <td className="px-6 py-4 text-sm font-medium">{u.email}</td>
                                <td className="px-6 py-4 text-sm">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'CAPTAIN' ? (isDark ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-100 text-green-800') : (isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-100 text-blue-800')}`}>
                                    {u.role ?? "—"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                  <button onClick={() => handleAction(u.id, "approve")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-accentGreen text-black hover:brightness-95 transition">
                                    <Check size={14} /> Approve
                                  </button>
                                  <button onClick={() => handleAction(u.id, "reject")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${isDark ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>
                                    <X size={14} /> Reject
                                  </button>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={4} className={`px-6 py-12 text-center text-sm ${isDark ? "text-zinc-500" : "text-gray-400"}`}>No pending users</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className={`rounded-2xl border overflow-hidden ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
                  <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? "border-white/10" : "border-gray-200"}`}>
                    <div>
                      <h2 className="text-xl font-semibold">Approved Users</h2>
                      <p className={`text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>{approvedUsers.length} active users</p>
                    </div>
                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-zinc-400" : "text-gray-500"}`} />
                      <input
                        value={approvedQuery}
                        onChange={(e) => setApprovedQuery(e.target.value)}
                        placeholder="Search approved..."
                        className={`pl-9 pr-4 py-2 w-full sm:w-64 rounded-full text-sm outline-none border transition-colors ${isDark ? "bg-black/50 border-white/10 focus:border-accentGreen text-white placeholder:text-zinc-500" : "bg-gray-50 border-gray-200 focus:border-brandGreen text-black placeholder:text-gray-400"}`}
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className={`text-xs uppercase tracking-wider ${isDark ? "bg-black/40 text-zinc-400" : "bg-gray-50 text-gray-500"}`}>
                          <th className="px-6 py-4 font-medium">ID</th>
                          <th className="px-6 py-4 font-medium">Email</th>
                          <th className="px-6 py-4 font-medium">Role</th>
                          <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? "divide-white/10" : "divide-gray-200"}`}>
                        {approvedUsers && approvedUsers.length > 0 ? (
                          approvedUsers
                            .filter((u) => {
                              const q = approvedQuery.trim().toLowerCase();
                              if (!q) return true;
                              return (u.email || "").toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q);
                            })
                            .map((u) => (
                              <tr key={`a-${u.id}`} className={`transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                                <td className={`px-6 py-4 text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>#{u.id}</td>
                                <td className="px-6 py-4 text-sm font-medium">{u.email}</td>
                                <td className="px-6 py-4 text-sm">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'CAPTAIN' ? (isDark ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-100 text-green-800') : (isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-100 text-blue-800')}`}>
                                    {u.role ?? "—"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button onClick={() => handleAction(u.id, "reject")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${isDark ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>
                                    <Trash2 size={14} /> Remove
                                  </button>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={4} className={`px-6 py-12 text-center text-sm ${isDark ? "text-zinc-500" : "text-gray-400"}`}>No approved users</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </>
          )}

          {activeTab === "courses" && (
            <section className={`rounded-2xl border p-6 md:p-8 ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold">{editingCourseId ? "Edit Course" : "Create New Course"}</h2>
                  <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
                    {editingCourseId ? "Update existing lesson content." : "Add a new lesson/course to the platform."}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveCourse} className="space-y-6 max-w-3xl">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-zinc-300" : "text-gray-700"}`}>Course Title</label>
                  <input required value={courseTitle} onChange={e => setCourseTitle(e.target.value)} className={`w-full p-4 rounded-xl border outline-none transition-colors ${isDark ? "bg-black/50 border-white/10 focus:border-accentGreen text-white" : "bg-gray-50 border-gray-200 focus:border-brandGreen text-black"}`} placeholder="e.g. Advanced Spreadsheet Mastery" />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-zinc-300" : "text-gray-700"}`}>Topic / Category</label>
                  <input required value={courseTopic} onChange={e => setCourseTopic(e.target.value)} className={`w-full p-4 rounded-xl border outline-none transition-colors ${isDark ? "bg-black/50 border-white/10 focus:border-accentGreen text-white" : "bg-gray-50 border-gray-200 focus:border-brandGreen text-black"}`} placeholder="e.g. Spreadsheet" />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-zinc-300" : "text-gray-700"}`}>Course Description</label>
                  <textarea required value={courseContent} onChange={e => setCourseContent(e.target.value)} rows={5} className={`w-full p-4 rounded-xl border outline-none transition-colors resize-y ${isDark ? "bg-black/50 border-white/10 focus:border-accentGreen text-white" : "bg-gray-50 border-gray-200 focus:border-brandGreen text-black"}`} placeholder="Detailed description of the course..." />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-zinc-300" : "text-gray-700"}`}>
                    Course Thumbnail {editingCourseId && <span className="opacity-60 text-xs font-normal ml-2">(Leave empty to keep existing)</span>}
                  </label>
                  <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => setCourseThumbnail(e.target.files?.[0] || null)} 
                      className={`w-full text-sm rounded-xl border outline-none transition-colors ${isDark ? "bg-black/50 border-white/10 file:bg-zinc-800 file:text-zinc-300 file:border-0 file:px-4 file:py-3 file:mr-4" : "bg-gray-50 border-gray-200 file:bg-gray-100 file:text-gray-600 file:border-0 file:px-4 file:py-3 file:mr-4"}`} 
                  />
                </div>
                
                {courseMsg && (
                  <div className={`p-4 rounded-xl text-sm font-medium ${courseMsg.includes("Error") ? (isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600") : (isDark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-700")}`}>
                    {courseMsg}
                  </div>
                )}

                <div className="flex gap-4">
                  <button disabled={creatingCourse} type="submit" className={`inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold transition hover:brightness-95 disabled:opacity-50 ${isDark ? "bg-accentGreen text-black" : "bg-brandGreen text-white"}`}>
                    {creatingCourse ? <RefreshCw size={18} className="animate-spin" /> : (editingCourseId ? <Check size={18} /> : <Plus size={18} />)}
                    {editingCourseId ? "Update Course" : "Publish Course"}
                  </button>
                  {editingCourseId && (
                    <button type="button" onClick={cancelCourseEdit} className={`inline-flex items-center gap-2 px-6 py-4 rounded-full text-sm font-bold transition disabled:opacity-50 ${isDark ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-gray-200 hover:bg-gray-300 text-black"}`}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Course List */}
              <section className={`mt-12 rounded-2xl border overflow-hidden ${isDark ? "bg-zinc-900/50 border-white/10" : "bg-white border-gray-200"}`}>
                <div className={`p-5 border-b ${isDark ? "border-white/10" : "border-gray-200"}`}>
                  <h2 className="text-xl font-semibold">Existing Courses</h2>
                  <p className={`text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>{coursesList.length} courses found</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className={`text-xs uppercase tracking-wider ${isDark ? "bg-black/40 text-zinc-400" : "bg-gray-50 text-gray-500"}`}>
                        <th className="px-6 py-4 font-medium">ID</th>
                        <th className="px-6 py-4 font-medium">Title</th>
                        <th className="px-6 py-4 font-medium">Topic</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-white/10" : "divide-gray-200"}`}>
                      {coursesList.length > 0 ? (
                        coursesList.map(course => (
                          <tr key={course.id} className={`transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                            <td className={`px-6 py-4 text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>#{course.id}</td>
                            <td className="px-6 py-4 text-sm font-medium">{course.title}</td>
                            <td className="px-6 py-4 text-sm">{course.topic}</td>
                            <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                              <button onClick={() => handleStartEditCourse(course)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${isDark ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}>
                                <Pencil size={14} /> Edit
                              </button>
                              <button onClick={() => handleDeleteCourse(course.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${isDark ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>
                                <Trash2 size={14} /> Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className={`px-6 py-12 text-center text-sm ${isDark ? "text-zinc-500" : "text-gray-400"}`}>No courses found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </section>
          )}

          {activeTab === "quizzes" && (
            <section className={`rounded-2xl border p-6 md:p-8 ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold">{editingQuizId ? "Edit Quiz" : "Create New Quiz"}</h2>
                  <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
                    {editingQuizId ? "Update existing quiz questions and details." : "Build an interactive quiz and attach it to a course."}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveQuiz} className="space-y-8 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-zinc-300" : "text-gray-700"}`}>Quiz Title</label>
                    <input required value={quizTitle} onChange={e => setQuizTitle(e.target.value)} className={`w-full p-4 rounded-xl border outline-none transition-colors ${isDark ? "bg-black/50 border-white/10 focus:border-accentGreen text-white" : "bg-gray-50 border-gray-200 focus:border-brandGreen text-black"}`} placeholder="e.g. Module 1 Assessment" />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-zinc-300" : "text-gray-700"}`}>Link to Course / Lesson</label>
                    <select required value={quizLessonId} onChange={e => setQuizLessonId(e.target.value)} className={`w-full p-4 rounded-xl border outline-none transition-colors appearance-none ${isDark ? "bg-black/50 border-white/10 focus:border-accentGreen text-white" : "bg-gray-50 border-gray-200 focus:border-brandGreen text-black"}`}>
                      <option value="" disabled>Select a course</option>
                      {adminLessons.map(lesson => (
                        <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-bold">Questions</h3>
                    <button type="button" onClick={addQuestion} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-200 hover:bg-gray-300 text-black"}`}>
                      <Plus size={14} /> Add Question
                    </button>
                  </div>

                  {questions.map((q, idx) => (
                    <div key={idx} className={`p-6 rounded-2xl border relative ${isDark ? "bg-black/40 border-white/10" : "bg-gray-50 border-gray-200"}`}>
                      {questions.length > 1 && (
                        <button type="button" onClick={() => removeQuestion(idx)} className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-500/10 rounded-full transition">
                          <Trash2 size={16} />
                        </button>
                      )}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold mb-1 opacity-70">Question {idx + 1}</label>
                          <input required value={q.question_text} onChange={e => updateQuestion(idx, "question_text", e.target.value)} className={`w-full p-3 rounded-lg border outline-none text-sm ${isDark ? "bg-zinc-900 border-white/10 focus:border-accentGreen text-white" : "bg-white border-gray-200 focus:border-brandGreen text-black"}`} placeholder="Enter question text..." />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold mb-1 opacity-70">Option A</label>
                            <input required value={q.option_a} onChange={e => updateQuestion(idx, "option_a", e.target.value)} className={`w-full p-2.5 rounded-lg border outline-none text-sm ${isDark ? "bg-zinc-900 border-white/10 focus:border-accentGreen text-white" : "bg-white border-gray-200 focus:border-brandGreen text-black"}`} placeholder="Answer A" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1 opacity-70">Option B</label>
                            <input required value={q.option_b} onChange={e => updateQuestion(idx, "option_b", e.target.value)} className={`w-full p-2.5 rounded-lg border outline-none text-sm ${isDark ? "bg-zinc-900 border-white/10 focus:border-accentGreen text-white" : "bg-white border-gray-200 focus:border-brandGreen text-black"}`} placeholder="Answer B" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1 opacity-70">Option C</label>
                            <input required value={q.option_c} onChange={e => updateQuestion(idx, "option_c", e.target.value)} className={`w-full p-2.5 rounded-lg border outline-none text-sm ${isDark ? "bg-zinc-900 border-white/10 focus:border-accentGreen text-white" : "bg-white border-gray-200 focus:border-brandGreen text-black"}`} placeholder="Answer C" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1 opacity-70">Option D</label>
                            <input required value={q.option_d} onChange={e => updateQuestion(idx, "option_d", e.target.value)} className={`w-full p-2.5 rounded-lg border outline-none text-sm ${isDark ? "bg-zinc-900 border-white/10 focus:border-accentGreen text-white" : "bg-white border-gray-200 focus:border-brandGreen text-black"}`} placeholder="Answer D" />
                          </div>
                        </div>
                        <div className="pt-2">
                          <label className="block text-xs font-semibold mb-1 opacity-70 text-accentGreen">Correct Option</label>
                          <select value={q.correct_choice} onChange={e => updateQuestion(idx, "correct_choice", e.target.value)} className={`p-2.5 rounded-lg border outline-none text-sm w-full sm:w-auto min-w-[150px] ${isDark ? "bg-zinc-900 border-white/10 focus:border-accentGreen text-white" : "bg-white border-gray-200 focus:border-brandGreen text-black"}`}>
                            <option value="A">Option A</option>
                            <option value="B">Option B</option>
                            <option value="C">Option C</option>
                            <option value="D">Option D</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {quizMsg && (
                  <div className={`p-4 rounded-xl text-sm font-medium ${quizMsg.includes("Error") ? (isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600") : (isDark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-700")}`}>
                    {quizMsg}
                  </div>
                )}

                <div className="flex gap-4">
                  <button disabled={creatingQuiz} type="submit" className={`inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold transition hover:brightness-95 disabled:opacity-50 ${isDark ? "bg-accentGreen text-black" : "bg-brandGreen text-white"}`}>
                    {creatingQuiz ? <RefreshCw size={18} className="animate-spin" /> : (editingQuizId ? <Check size={18} /> : <Plus size={18} />)}
                    {editingQuizId ? "Update Quiz" : "Publish Quiz"}
                  </button>
                  {editingQuizId && (
                    <button type="button" onClick={cancelQuizEdit} className={`inline-flex items-center gap-2 px-6 py-4 rounded-full text-sm font-bold transition disabled:opacity-50 ${isDark ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-gray-200 hover:bg-gray-300 text-black"}`}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Quiz List */}
              <section className={`mt-12 rounded-2xl border overflow-hidden ${isDark ? "bg-zinc-900/50 border-white/10" : "bg-white border-gray-200"}`}>
                <div className={`p-5 border-b ${isDark ? "border-white/10" : "border-gray-200"}`}>
                  <h2 className="text-xl font-semibold">Existing Quizzes</h2>
                  <p className={`text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>{quizzesList.length} quizzes found</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className={`text-xs uppercase tracking-wider ${isDark ? "bg-black/40 text-zinc-400" : "bg-gray-50 text-gray-500"}`}>
                        <th className="px-6 py-4 font-medium">ID</th>
                        <th className="px-6 py-4 font-medium">Title</th>
                        <th className="px-6 py-4 font-medium">Lesson</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-white/10" : "divide-gray-200"}`}>
                      {quizzesList.length > 0 ? (
                        quizzesList.map(quiz => (
                          <tr key={quiz.id} className={`transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                            <td className={`px-6 py-4 text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>#{quiz.id}</td>
                            <td className="px-6 py-4 text-sm font-medium">{quiz.title}</td>
                            <td className="px-6 py-4 text-sm">{adminLessons.find(l => l.id === quiz.lesson)?.title || `Lesson ID: ${quiz.lesson}`}</td>
                            <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                              <button onClick={() => handleStartEditQuiz(quiz)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${isDark ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}>
                                <Pencil size={14} /> Edit
                              </button>
                              <button onClick={() => handleDeleteQuiz(quiz.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${isDark ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>
                                <Trash2 size={14} /> Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className={`px-6 py-12 text-center text-sm ${isDark ? "text-zinc-500" : "text-gray-400"}`}>No quizzes found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </section>
          )}

          {activeTab === "tracking" && (
            <div className="space-y-6">
              {selectedUser ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className={`flex items-center gap-2 text-sm font-medium mb-4 ${isDark ? "text-zinc-400 hover:text-white" : "text-gray-500 hover:text-black"}`}
                  >
                    <ChevronLeft size={16} /> Back to Track Management
                  </button>

                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold">{selectedUser.email}</h2>
                      <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>Account ID: #{selectedUser.id} • Role: {selectedUser.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Pre-Assessment Card */}
                    <div className={`p-6 rounded-2xl border ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${isDark ? "bg-yellow-500/10 text-yellow-500" : "bg-yellow-100 text-yellow-600"}`}>
                          <ClipboardList size={20} />
                        </div>
                        <h3 className="font-semibold text-lg">Pre-Assessment</h3>
                      </div>
                      {selectedUser.stats?.pre_assessment ? (
                        <div>
                          <p className="text-4xl font-bold">{selectedUser.stats.pre_assessment.score}%</p>
                          <p className={`text-xs mt-2 ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
                            Completed: {new Date(selectedUser.stats.pre_assessment.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <p className={`text-sm italic mt-2 ${isDark ? "text-zinc-500" : "text-gray-400"}`}>Not completed yet</p>
                      )}
                    </div>

                    {/* Lesson Progress Card - replace the existing one */}
                    <div className={`p-6 rounded-2xl border col-span-1 md:col-span-2 ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
                      <div className="flex items-center gap-3 mb-6">
                        <div className={`p-2 rounded-lg ${isDark ? "bg-blue-500/10 text-blue-500" : "bg-blue-100 text-blue-600"}`}>
                          <BookOpen size={20} />
                        </div>
                        <h3 className="font-semibold text-lg">Lesson Progress by Topic</h3>
                      </div>

                      {selectedUser.stats?.lesson_progress && selectedUser.stats.lesson_progress.length > 0 ? (() => {
                        // Group by topic
                        const grouped = new Map<string, typeof selectedUser.stats.lesson_progress>();
                        for (const lesson of selectedUser.stats.lesson_progress) {
                          const topic = (lesson as any).topic || "General";
                          const existing = grouped.get(topic) ?? [];
                          existing.push(lesson);
                          grouped.set(topic, existing);
                        }

                        return (
                          <div className="space-y-4">
                            {Array.from(grouped.entries()).map(([topic, topicLessons]) => {
                              const completedCount = topicLessons.filter(l => l.completed).length;
                              const topicProgress = Math.round(
                                topicLessons.reduce((sum, l) => sum + l.progress, 0) / topicLessons.length
                              );

                              return (
                                <div key={topic} className={`overflow-hidden rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-800/40" : "border-gray-100 bg-gray-50"}`}>
                                  {/* Topic header */}
                                  <div className="flex items-center justify-between px-4 py-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold truncate">{topic}</p>
                                      <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
                                        {completedCount}/{topicLessons.length} lessons completed
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                      <div className={`h-1.5 w-20 rounded-full overflow-hidden ${isDark ? "bg-zinc-700" : "bg-gray-200"}`}>
                                        <div
                                          className={`h-full rounded-full ${isDark ? "bg-accentGreen" : "bg-brandGreen"}`}
                                          style={{ width: `${topicProgress}%` }}
                                        />
                                      </div>
                                      <span className={`text-xs font-semibold w-8 text-right ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                                        {topicProgress}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* Individual lessons */}
                                  <div className={`border-t divide-y ${isDark ? "border-zinc-700 divide-zinc-700" : "border-gray-100 divide-gray-100"}`}>
                                    {topicLessons.map((lesson, i) => (
                                      <div key={i} className="flex items-center justify-between px-4 py-2.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <div className={`w-2 h-2 rounded-full shrink-0 ${lesson.completed ? (isDark ? "bg-accentGreen" : "bg-brandGreen") : (isDark ? "bg-zinc-600" : "bg-gray-300")}`} />
                                          <span className={`text-xs truncate ${isDark ? "text-zinc-300" : "text-gray-700"}`}>{lesson.title}</span>
                                        </div>
                                        <span className={`text-xs font-medium shrink-0 ml-2 ${lesson.completed ? (isDark ? "text-accentGreen" : "text-brandGreen") : (isDark ? "text-zinc-500" : "text-gray-400")}`}>
                                          {lesson.completed ? "Complete" : "In Progress"}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })() : (
                        <p className={`text-sm italic ${isDark ? "text-zinc-500" : "text-gray-400"}`}>No lesson progress found.</p>
                      )}
                    </div>

                    {/* Latest Quiz Card */}
                    <div className={`p-6 rounded-2xl border ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${isDark ? "bg-green-500/10 text-green-500" : "bg-green-100 text-green-600"}`}>
                          <Check size={20} />
                        </div>
                        <h3 className="font-semibold text-lg">Latest Quiz</h3>
                      </div>
                      {selectedUser.stats?.quiz_history && selectedUser.stats.quiz_history.length > 0 ? (
                        <div>
                          <p className="text-4xl font-bold text-green-500">{selectedUser.stats.quiz_history[0].score}%</p>
                          <p className={`text-sm font-medium mt-2 truncate ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                            {selectedUser.stats.quiz_history[0].quiz_title}
                          </p>
                        </div>
                      ) : (
                        <p className={`text-sm italic mt-2 ${isDark ? "text-zinc-500" : "text-gray-400"}`}>No attempts recorded</p>
                      )}
                    </div>
                  </div>

                  {/* Detailed Quiz History Table */}
                  <section className={`rounded-2xl border overflow-hidden mt-8 ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
                    <div className={`p-5 border-b ${isDark ? "border-white/10" : "border-gray-200"}`}>
                      <h3 className="font-semibold text-lg">Full Quiz History</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                          <tr className={`text-xs uppercase tracking-wider ${isDark ? "bg-black/40 text-zinc-400" : "bg-gray-50 text-gray-500"}`}>
                            <th className="px-6 py-4 font-medium">Quiz Name</th>
                            <th className="px-6 py-4 font-medium">Score</th>
                            <th className="px-6 py-4 font-medium">Accuracy</th>
                            <th className="px-6 py-4 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? "divide-white/10" : "divide-gray-200"}`}>
                          {selectedUser.stats?.quiz_history && selectedUser.stats.quiz_history.length > 0 ? (
                            selectedUser.stats.quiz_history.map((q, i) => (
                              <tr key={i} className={`transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                                <td className="px-6 py-4 text-sm font-medium">{q.quiz_title}</td>
                                <td className={`px-6 py-4 text-sm font-bold ${q.score >= 75 ? "text-green-500" : "text-yellow-500"}`}>{q.score}%</td>
                                <td className={`px-6 py-4 text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>{q.correct_count}/{q.total_questions} Correct</td>
                                <td className={`px-6 py-4 text-sm ${isDark ? "text-zinc-500" : "text-gray-400"}`}>{new Date(q.date).toLocaleDateString()}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className={`px-6 py-12 text-center text-sm ${isDark ? "text-zinc-500" : "text-gray-400"}`}>No quiz history found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              ) : (
                <section className={`rounded-2xl border overflow-hidden ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
                  <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? "border-white/10" : "border-gray-200"}`}>
                    <div>
                      <h2 className="text-xl font-semibold">Select User to Track</h2>
                      <p className={`text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>Click on an approved user to view their detailed progress.</p>
                    </div>
                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-zinc-400" : "text-gray-500"}`} />
                      <input
                        value={trackingQuery}
                        onChange={(e) => setTrackingQuery(e.target.value)}
                        placeholder="Search users..."
                        className={`pl-9 pr-4 py-2 w-full sm:w-64 rounded-full text-sm outline-none border transition-colors ${isDark ? "bg-black/50 border-white/10 focus:border-accentGreen text-white placeholder:text-zinc-500" : "bg-gray-50 border-gray-200 focus:border-brandGreen text-black placeholder:text-gray-400"}`}
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className={`text-xs uppercase tracking-wider ${isDark ? "bg-black/40 text-zinc-400" : "bg-gray-50 text-gray-500"}`}>
                          <th className="px-6 py-4 font-medium">ID</th>
                          <th className="px-6 py-4 font-medium">Email</th>
                          <th className="px-6 py-4 font-medium">Role</th>
                          <th className="px-6 py-4 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? "divide-white/10" : "divide-gray-200"}`}>
                        {approvedUsers && approvedUsers.length > 0 ? (
                          approvedUsers
                            .filter((u) => {
                              const q = trackingQuery.trim().toLowerCase();
                              if (!q) return true;
                              return (u.email || "").toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q);
                            })
                            .map((u) => (
                              <tr 
                                key={`t-${u.id}`} 
                                onClick={() => fetchUserDetails(u)}
                                className={`transition-colors cursor-pointer group ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                              >
                                <td className={`px-6 py-4 text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>#{u.id}</td>
                                <td className={`px-6 py-4 text-sm font-medium transition-colors ${isDark ? "group-hover:text-accentGreen" : "group-hover:text-brandGreen"}`}>{u.email}</td>
                                <td className="px-6 py-4 text-sm">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'CAPTAIN' ? (isDark ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-100 text-green-800') : (isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-100 text-blue-800')}`}>
                                    {u.role ?? "—"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${isDark ? "text-accentGreen bg-accentGreen/10 group-hover:bg-accentGreen/20" : "text-brandGreen bg-brandGreen/10 group-hover:bg-brandGreen/20"}`}>
                                    <BarChart3 size={14} /> View Stats
                                  </button>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={4} className={`px-6 py-12 text-center text-sm ${isDark ? "text-zinc-500" : "text-gray-400"}`}>No users available to track</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}