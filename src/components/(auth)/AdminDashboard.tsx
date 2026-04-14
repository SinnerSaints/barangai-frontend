"use client"

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/auth";
import { useTheme } from "@/context/theme";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { Check, X, Trash2, Search, RefreshCw, AlertCircle, Users, BookOpen, ClipboardList, Plus } from "lucide-react";

type UserItem = {
  id: number;
  email: string;
  password?: string;
  role?: string;
  is_active?: boolean;
  is_approved?: boolean;
  [k: string]: any;
};

type QuestionInput = {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
};

export default function AdminDashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<"users" | "courses" | "quizzes">("users");

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
  const [courseTitle, setCourseTitle] = useState("");
  const [courseTopic, setCourseTopic] = useState("");
  const [courseContent, setCourseContent] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [courseMsg, setCourseMsg] = useState("");

  // States for Quiz Management
  const [quizTitle, setQuizTitle] = useState("");
  const [quizLessonId, setQuizLessonId] = useState("");
  const [questions, setQuestions] = useState<QuestionInput[]>([{ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "A" }]);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [quizMsg, setQuizMsg] = useState("");
  const [adminLessons, setAdminLessons] = useState<any[]>([]);

  const handleSidebarToggle = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try {
      localStorage.setItem("sidebar_collapsed", String(next));
    } catch {}
  };

  // Fetch users logic
  const getAccessToken = async () => { // Para ni ug mo refresh ang user sa page di mawala ang token.
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
      // Use the backend user list endpoint as requested. Include auth token if present.
      const token = await getAccessToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/accounts/users/`, { headers });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      // Expecting an array of users. Map into the PendingUser shape conservatively.
      if (Array.isArray(data)) {
        const mapped: UserItem[] = data.map((u: any, idx: number) => ({
          id: u.id ?? idx + 1,
          email: u.email ?? u.user ?? "",
          password: (u.password as string) ?? (u.raw_password as string) ?? undefined,
          role: u.role ?? undefined,
          is_active: u.is_active ?? u.isActive ?? undefined,
          is_approved: u.is_approved ?? u.isApproved ?? undefined,
          // keep raw for debugging
          ...u,
        }));

  setUsers(mapped);
        // categorize
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
      // fallback sample data so admin can still use UI while backend is absent
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

  // Fetch available lessons for the Quiz dropdown when switching to Quizzes tab
  useEffect(() => {
    if (activeTab === "quizzes" && adminLessons.length === 0) {
      const fetchAdminLessons = async () => {
        try {
          const token = await getAccessToken();
          const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/lessons/`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const data = await res.json();
          setAdminLessons(Array.isArray(data) ? data : data.results || []);
        } catch (err) {}
      };
      fetchAdminLessons();
    }
  }, [activeTab]);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setError(null);
    setLoading(true);
    try {
      // call the backend user endpoints directly: users/<pk>/approve/ or users/<pk>/delete/
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const endpointAction = action === "approve" ? "approve" : "delete";
      const url = `${API_BASE_URL.replace(/\/$/, "")}/accounts/users/${id}/${endpointAction}/`;

      // Some backends expect an empty POST body; others accept JSON. We'll send no body
      // and rely on the URL+method. If your backend expects JSON, we can send { id } instead.
      const res = await fetch(url, {
        method: "ALLOWED_METHODS" in Response.prototype ? "ALLOW_METHODS" : action === "approve" ? "PATCH" : "DELETE",
        headers,
      });

      // Helpful logging for debugging
      // eslint-disable-next-line no-console
      console.log(`Admin action ${action} ${id} ->`, res.status);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Server returned ${res.status} ${text}`);
      }

      // success: refresh the list from server to reflect actual state
      await fetchPending();
    } catch (err: any) {
      setError(`Unable to ${action} user: ${err?.message || err}`);
      // keep users as-is (no optimistic removal) and ensure list synced
      await fetchPending();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCourse(true);
    setCourseMsg("");
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/lessons/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title: courseTitle, topic: courseTopic, content: courseContent }),
      });
      if (!res.ok) throw new Error("Failed to create course");
      setCourseMsg("Course created successfully! ✅");
      setCourseTitle("");
      setCourseTopic("");
      setCourseContent("");
    } catch (err: any) {
      setCourseMsg("Error: " + err.message);
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingQuiz(true);
    setQuizMsg("");
    try {
      const token = await getAccessToken();
      
      // Map to your backend's expected structure
      const payload = {
        title: quizTitle,
        lesson: quizLessonId,
        questions: questions.map(q => ({
          text: q.question_text,
          options: [q.option_a, q.option_b, q.option_c, q.option_d],
          correct_answer: q.correct_option
        }))
      };

      const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/quizzes/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create quiz");
      setQuizMsg("Quiz created successfully! ✅");
      setQuizTitle("");
      setQuizLessonId("");
      setQuestions([{ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "A" }]);
    } catch (err: any) {
      setQuizMsg("Error: " + err.message);
    } finally {
      setCreatingQuiz(false);
    }
  };

  const addQuestion = () => setQuestions([...questions, { question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "A" }]);
  const removeQuestion = (idx: number) => setQuestions(questions.filter((_, i) => i !== idx));
  const updateQuestion = (idx: number, field: keyof QuestionInput, value: string) => {
    const newQ = [...questions];
    newQ[idx][field] = value;
    setQuestions(newQ);
  };

  return (
    <div className="min-h-screen flex relative">
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />

      <main className={`flex-1 p-6 lg:p-8 ${isDark ? "bg-[#0b0b0b] text-white" : "bg-gray-50 text-black"}`}>
        <div className="max-w-[1200px] mx-auto space-y-6">
          <TopBar hideSearch />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
                Manage users, courses, and quizzes efficiently
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
          <div className={`flex items-center gap-6 border-b ${isDark ? "border-white/10" : "border-gray-200"}`}>
            <button
              onClick={() => setActiveTab("users")}
              className={`pb-3 text-sm font-medium flex items-center gap-2 transition-colors relative ${activeTab === "users" ? (isDark ? "text-accentGreen" : "text-brandGreen") : (isDark ? "text-zinc-400 hover:text-zinc-200" : "text-gray-500 hover:text-gray-700")}`}
            >
              <Users size={18} /> User Management
              {activeTab === "users" && <span className={`absolute bottom-0 left-0 w-full h-0.5 ${isDark ? "bg-accentGreen" : "bg-brandGreen"}`}></span>}
            </button>
            <button
              onClick={() => setActiveTab("courses")}
              className={`pb-3 text-sm font-medium flex items-center gap-2 transition-colors relative ${activeTab === "courses" ? (isDark ? "text-accentGreen" : "text-brandGreen") : (isDark ? "text-zinc-400 hover:text-zinc-200" : "text-gray-500 hover:text-gray-700")}`}
            >
              <BookOpen size={18} /> Course Management
              {activeTab === "courses" && <span className={`absolute bottom-0 left-0 w-full h-0.5 ${isDark ? "bg-accentGreen" : "bg-brandGreen"}`}></span>}
            </button>
            <button
              onClick={() => setActiveTab("quizzes")}
              className={`pb-3 text-sm font-medium flex items-center gap-2 transition-colors relative ${activeTab === "quizzes" ? (isDark ? "text-accentGreen" : "text-brandGreen") : (isDark ? "text-zinc-400 hover:text-zinc-200" : "text-gray-500 hover:text-gray-700")}`}
            >
              <ClipboardList size={18} /> Quiz Management
              {activeTab === "quizzes" && <span className={`absolute bottom-0 left-0 w-full h-0.5 ${isDark ? "bg-accentGreen" : "bg-brandGreen"}`}></span>}
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
                  <h2 className="text-2xl font-bold">Create New Course</h2>
                  <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>Add a new lesson/course to the platform.</p>
                </div>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-6 max-w-3xl">
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
                
                {courseMsg && (
                  <div className={`p-4 rounded-xl text-sm font-medium ${courseMsg.includes("Error") ? (isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600") : (isDark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-700")}`}>
                    {courseMsg}
                  </div>
                )}

                <button disabled={creatingCourse} type="submit" className={`inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold transition hover:brightness-95 disabled:opacity-50 ${isDark ? "bg-accentGreen text-black" : "bg-brandGreen text-white"}`}>
                  {creatingCourse ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
                  Publish Course
                </button>
              </form>
            </section>
          )}

          {activeTab === "quizzes" && (
            <section className={`rounded-2xl border p-6 md:p-8 ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold">Create New Quiz</h2>
                  <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>Build an interactive quiz and attach it to a course.</p>
                </div>
              </div>

              <form onSubmit={handleCreateQuiz} className="space-y-8 max-w-4xl">
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
                          <select value={q.correct_option} onChange={e => updateQuestion(idx, "correct_option", e.target.value)} className={`p-2.5 rounded-lg border outline-none text-sm w-full sm:w-auto min-w-[150px] ${isDark ? "bg-zinc-900 border-white/10 focus:border-accentGreen text-white" : "bg-white border-gray-200 focus:border-brandGreen text-black"}`}>
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

                <button disabled={creatingQuiz} type="submit" className={`inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold transition hover:brightness-95 disabled:opacity-50 ${isDark ? "bg-accentGreen text-black" : "bg-brandGreen text-white"}`}>
                  {creatingQuiz ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
                  Publish Quiz
                </button>
              </form>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}