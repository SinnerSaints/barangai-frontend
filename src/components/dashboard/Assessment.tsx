"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Pencil,
  PlayCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  AssessmentAttempt,
  AssessmentQuestion,
  AssessmentResult,
  fetchAssessmentResult,
  fetchAssessmentStatus,
  formatProficiencyLevel,
  getScorePercent,
  startPreAssessment,
  submitPreAssessment,
  startPostAssessment,
  submitPostAssessment,
} from "@/lib/preAssessment";
import { isAdminRole } from "@/lib/roles";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/context/theme";

const CATEGORY_LABELS: Record<string, string> = {
  basic_computer: "Basic Computer Skills",
  document_processing: "Document Processing",
  spreadsheet: "Spreadsheet Skills",
  email_communication: "Email and Communication",
  internet_platforms: "Internet and Online Platforms",
};

const CATEGORY_FIELDS = [
  { key: "basic_computer_score", label: "Basic Computer Skills" },
  { key: "document_processing_score", label: "Document Processing" },
  { key: "spreadsheet_score", label: "Spreadsheet Skills" },
  { key: "email_communication_score", label: "Email and Communication" },
  { key: "internet_platforms_score", label: "Internet and Online Platforms" },
] as const;

const RATINGS = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" },
];

type ViewState = "idle" | "ready" | "completed";

function groupQuestions(questions: AssessmentQuestion[]) {
  return questions.reduce<Record<string, AssessmentQuestion[]>>((groups, question) => {
    const key = question.category;
    if (!groups[key]) groups[key] = [];
    groups[key].push(question);
    return groups;
  }, {});
}

export default function Assessment() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  const [clientRole, setClientRole] = useState<string | null>(null);
  useEffect(() => {
    setClientRole(localStorage.getItem("user_role"));
  }, [user?.role]);
  const showAdminEdit = isAdminRole(user?.role ?? clientRole);

  // STRICTLY YOUR ORIGINAL VARIABLES - NO ADDITIONS
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [mode, setMode] = useState<"PRE" | "POST">("PRE");
  const [allResults, setAllResults] = useState<AssessmentResult[]>([]);
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [hasPromptedSubmit, setHasPromptedSubmit] = useState(false);
  const [error, setError] = useState("");
  const [currentLevel, setCurrentLevel] = useState<string | null>(null);

  useEffect(() => {
    const loadAssessment = async () => {
      try {
        setLoading(true);
        setError("");

        const status = await fetchAssessmentStatus();

        if (status.pre_completed && status.post_completed) {
          const resultsArray = await fetchAssessmentResult();

          const sorted = [...resultsArray].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

          setAllResults(sorted);
          setResult(sorted[sorted.length - 1]);
          setViewState("completed");
          return;
        }

        if (status.pre_completed && !status.post_completed) {
          setMode("POST");
          setCurrentLevel(status.pre_proficiency_level);
          setViewState("idle");
          return;
        }

        setMode("PRE");
        setViewState("idle");
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Unable to load your assessment.");
      } finally {
        setLoading(false);
      }
    };

    loadAssessment();
  }, []);

  const groupedQuestions = useMemo(() => groupQuestions(attempt?.questions ?? []), [attempt?.questions]);
  const totalQuestions = attempt?.questions.length ?? result?.total_questions ?? 0;
  const answeredQuestions = useMemo(
    () => Object.values(ratings).filter((value) => typeof value === "number").length,
    [ratings]
  );
  const isComplete = Boolean(attempt) && answeredQuestions === totalQuestions && totalQuestions > 0;
  const progressPercent = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  // UX ENHANCEMENT: Added a setTimeout so the user can see their final click before the modal pops up
  useEffect(() => {
    if (viewState === "ready" && isComplete && !showSubmitModal && !hasPromptedSubmit) {
      const timer = setTimeout(() => {
        setShowSubmitModal(true);
        setHasPromptedSubmit(true);
      }, 600); // 600ms delay for better visual feedback
      return () => clearTimeout(timer);
    }
  }, [hasPromptedSubmit, isComplete, showSubmitModal, viewState]);

  const handleStart = async () => {
    try {
      setStarting(true);
      setError("");
      const assessmentAttempt = mode === "PRE" ? await startPreAssessment() : await startPostAssessment();

      setAttempt(assessmentAttempt);
      setRatings({});
      setHasPromptedSubmit(false);
      setShowSubmitModal(false);
      setViewState("ready");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to start the assessment.");
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = async () => {
    if (!attempt || !isComplete) return;

    try {
      setSubmitting(true);
      setError("");

      const payload = attempt.questions.map((question) => ({
        question_id: question.id,
        rating: ratings[question.id],
      }));

      const assessmentResult = mode === "PRE" ? await submitPreAssessment(payload) : await submitPostAssessment(payload);

      setResult(assessmentResult);
      if (mode === "POST") {
        const resultsArray = await fetchAssessmentResult(false);
        const sorted = [...resultsArray].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setAllResults(sorted);
      }
      setAttempt(null);
      setHasPromptedSubmit(false);
      setViewState("completed");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to submit your answers.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRate = (questionId: number, rating: number) => {
    setRatings((current) => ({ ...current, [questionId]: rating }));
  };

  const handleConfirmSubmit = () => {
    setShowSubmitModal(false);
    void handleSubmit();
  };

  if (loading) {
    return (
      <section className={`mt-6 rounded-[2rem] border p-8 shadow-xl ${isDark ? "border-white/10 bg-zinc-950/85 text-white" : "border-gray-200 bg-white/90 text-[#034440]"}`}>
        <div className="flex items-center justify-center gap-3 py-12 text-sm font-medium">
          <Loader2 className="h-6 w-6 animate-spin text-accentGreen" />
          Loading your assessment profile...
        </div>
      </section>
    );
  }

  return (
    <section className={`relative mt-6 rounded-[2rem] border p-6 shadow-xl lg:p-8 ${isDark ? "border-white/10 bg-zinc-950/85 text-white" : "border-gray-200 bg-white/90 text-[#034440]"}`}>
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] shadow-sm ${isDark ? "bg-accentGreen/20 text-accentGreen border border-accentGreen/20" : "bg-brandGreen/10 text-brandGreen border border-brandGreen/20"}`}>
              <Sparkles className="h-3.5 w-3.5" />
              {mode === "PRE" ? "Pre-Assessment" : "Post-Assessment"}
            </div>
            {showAdminEdit && (
              <Link
                href="/admin/pre-assessment"
                onClick={() => window.scrollTo({ top: 0 })}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${isDark ? "bg-white/10 text-zinc-200 hover:bg-white/15" : "border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"}`}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            )}
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight lg:text-3xl">
            {mode === "PRE" ? "Measure digital literacy before coursework begins." : "Evaluate your overall growth and progress."}
          </h2>
          <p className={`mt-3 max-w-xl text-sm leading-relaxed ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
            {mode === "PRE"
              ? "Answer each statement based on your current confidence. Your score will determine your initial proficiency level."
              : "Now that you have completed at least 70% of the modules and quizzes, answer these statements again to evaluate your overall growth!"}
          </p>
        </div>

        <div className={`grid min-w-full gap-3 sm:grid-cols-3 lg:min-w-[340px] ${isDark ? "text-zinc-200" : "text-gray-700"}`}>
          <div className={`rounded-2xl border p-4 shadow-sm ${isDark ? "bg-black/40 border-white/10" : "bg-gray-50 border-gray-100"}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Questions</p>
            <p className="mt-2 text-3xl font-black">{totalQuestions || 20}</p>
          </div>
          <div className={`rounded-2xl border p-4 shadow-sm ${isDark ? "bg-black/40 border-white/10" : "bg-gray-50 border-gray-100"}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Answered</p>
            <p className={`mt-2 text-3xl font-black ${answeredQuestions === totalQuestions && totalQuestions > 0 ? (isDark ? "text-accentGreen" : "text-brandGreen") : ""}`}>
              {viewState === "completed" ? result?.total_questions ?? 0 : answeredQuestions}
            </p>
          </div>
          <div className={`rounded-2xl border p-4 shadow-sm ${isDark ? "bg-black/40 border-white/10" : "bg-gray-50 border-gray-100"}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Level</p>
            <p className="mt-2 text-xl font-bold truncate" title={formatProficiencyLevel(result?.proficiency_level || currentLevel)}>
              {formatProficiencyLevel(result?.proficiency_level || currentLevel)}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className={`mt-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-red-200 bg-red-50 text-red-700"}`}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* IDLE STATE */}
      {viewState === "idle" && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className={`rounded-[1.75rem] border p-6 shadow-inner ${isDark ? "bg-black/40 border-white/5" : "bg-gray-50 border-gray-100"}`}>
            <h3 className="text-xl font-bold">What this covers</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Object.values(CATEGORY_LABELS).map((label) => (
                <div key={label} className={`rounded-xl border px-4 py-3 text-sm font-medium shadow-sm transition-transform hover:-translate-y-0.5 ${isDark ? "border-white/10 bg-white/5 text-zinc-200" : "border-gray-200 bg-white text-gray-700"}`}>
                  {label}
                </div>
              ))}
            </div>

            {mode === "POST" && (
              <div className={`mt-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 shadow-sm ${isDark ? "border-amber-500/30 bg-amber-500/10 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span>
                  <strong>Final Evaluation:</strong> You can only take the Post-Assessment <strong>once</strong>. Please ensure you have completed at least 70% of your lessons and practice tasks before proceeding.
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleStart}
              disabled={starting}
              className={`mt-8 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold shadow-lg transition hover:scale-[1.02] active:scale-95 ${isDark ? "bg-accentGreen text-black shadow-accentGreen/20 disabled:bg-zinc-700 disabled:text-zinc-300" : "bg-brandGreen text-white shadow-brandGreen/20 disabled:bg-gray-300"}`}
            >
              {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" />}
              {starting ? "Starting..." : `Start ${mode === "PRE" ? "Pre-Assessment" : "Post-Assessment"}`}
            </button>
          </div>

          <div className={`rounded-[1.75rem] border p-6 shadow-lg ${isDark ? "bg-[#0a120f] border-white/10" : "bg-[#034440] border-transparent text-white"}`}>
            <h3 className="text-xl font-bold">Rating guide</h3>
            <div className="mt-5 space-y-3 text-sm">
              {RATINGS.map((rating) => (
                <div key={rating.value} className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <span className="font-medium">{rating.label}</span>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full font-bold shadow-sm ${isDark ? "bg-white/20 text-white" : "bg-white/20 text-white"}`}>{rating.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* READY STATE - SCROLL CONFINED UX */}
      {viewState === "ready" && attempt && (
        <div className={`mt-8 flex flex-col overflow-hidden rounded-[1.75rem] border shadow-inner ${isDark ? "border-white/10 bg-black/20" : "border-gray-200 bg-gray-50"}`}>
          
          {/* Sticky Progress Header */}
          <div className={`sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b p-5 backdrop-blur-md ${isDark ? "border-white/10 bg-[#0a120f]/90" : "border-gray-200 bg-white/90"}`}>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-80">
                <span>Progress</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className={`h-2.5 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out ${isDark ? "bg-accentGreen" : "bg-brandGreen"}`} 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              disabled={!isComplete || submitting}
              className={`shrink-0 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-sm transition hover:scale-[1.02] active:scale-95 ${isDark ? "bg-accentGreen text-black disabled:bg-zinc-700 disabled:text-zinc-400" : "bg-brandGreen text-white disabled:bg-gray-300"}`}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit
            </button>
          </div>

          {/* Endless Scroll Fix: Confined height with internal scrolling */}
          <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden p-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400/50 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-white/20 dark:hover:scrollbar-thumb-white/40">
            <div className="space-y-8">
              {Object.entries(groupedQuestions).map(([category, questions]) => (
                <div key={category} className="space-y-4">
                  <h3 className={`sticky top-0 z-0 py-2 text-lg font-black tracking-tight drop-shadow-sm ${isDark ? "text-accentGreen bg-transparent" : "text-brandGreen bg-transparent"}`}>
                    {CATEGORY_LABELS[category] || category}
                  </h3>
                  
                  <div className="space-y-4">
                    {questions.map((question) => (
                      <div key={question.id} className={`rounded-2xl border p-5 transition-colors ${isDark ? "border-white/10 bg-[#0f1714]" : "border-gray-200 bg-white shadow-sm"}`}>
                        <p className="mb-5 text-base font-medium leading-relaxed">
                          <span className="mr-2 font-black opacity-40">{question.order}.</span> 
                          {question.question_text}
                        </p>
                        
                        {/* Enhanced Touch-Friendly Grid */}
                        <div className="grid grid-cols-5 gap-2 md:gap-3">
                          {RATINGS.map((rating) => {
                            const isSelected = ratings[question.id] === rating.value;
                            return (
                              <button
                                key={rating.value}
                                type="button"
                                onClick={() => handleRate(question.id, rating.value)}
                                className={`flex flex-col items-center justify-center rounded-xl border p-2 transition-all md:py-3 ${
                                  isSelected
                                    ? isDark
                                      ? "scale-105 border-accentGreen bg-accentGreen text-black shadow-lg shadow-accentGreen/20"
                                      : "scale-105 border-brandGreen bg-brandGreen text-white shadow-md"
                                    : isDark
                                      ? "border-white/10 bg-white/5 text-zinc-300 hover:border-accentGreen/50 hover:bg-white/10"
                                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-brandGreen/50 hover:bg-brandGreen/5"
                                }`}
                              >
                                <span className="text-lg font-black md:text-xl">{rating.value}</span>
                                <span className="mt-1 hidden text-center text-[9px] font-bold uppercase leading-tight tracking-wider opacity-80 md:block">
                                  {rating.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {/* Mobile Only Label Helper */}
                        <div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-wider opacity-50 md:hidden">
                          <span>Strongly Disagree</span>
                          <span>Strongly Agree</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED STATE */}
      {viewState === "completed" && result && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className={`rounded-[1.75rem] border p-8 shadow-lg ${isDark ? "bg-[#0a120f] border-white/10" : "bg-[#034440] border-transparent text-white"}`}>
            <div className="flex items-center gap-3">
              <CheckCircle2 className={`h-8 w-8 ${isDark ? "text-accentGreen" : "text-[#9DE16A]"}`} />
              <h3 className="text-2xl font-black">Assessment Complete</h3>
            </div>

            <div className="mt-8 flex items-end gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Overall score</p>
                <p className="mt-1 text-6xl font-black tracking-tighter">{result.overall_score.toFixed(1)}</p>
                <p className="mt-1 text-sm font-medium opacity-80">out of 5.0</p>
              </div>
              <div className={`rounded-2xl px-5 py-4 text-xl font-black shadow-inner ${isDark ? "bg-white/10" : "bg-white/20"}`}>
                {getScorePercent(result.overall_score)}%
              </div>
            </div>

            <div className={`mt-8 rounded-[1.5rem] border p-6 shadow-sm ${isDark ? "border-white/10 bg-white/5" : "border-white/20 bg-white/10"}`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Proficiency level</p>
              <p className="mt-2 text-3xl font-black tracking-tight">{formatProficiencyLevel(result?.proficiency_level || currentLevel)}</p>
            </div>

            <div className="mt-8">
              <Link
                href="/dashboard"
                onClick={() => window.scrollTo({ top: 0 })}
                className={`inline-flex w-full items-center justify-center rounded-full px-6 py-4 text-sm font-bold shadow-lg transition hover:scale-[1.02] active:scale-95 ${isDark ? "bg-accentGreen text-black shadow-accentGreen/20" : "bg-white text-[#034440]"}`}
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          <div className={`rounded-[1.75rem] border p-6 shadow-inner lg:p-8 ${isDark ? "bg-black/40 border-white/10" : "bg-gray-50 border-gray-100"}`}>
            <h3 className="text-xl font-bold">Category Breakdown</h3>
            <div className="mt-8 space-y-6">
              {CATEGORY_FIELDS.map((item) => {
                const score = result[item.key];
                const percent = getScorePercent(score);

                return (
                  <div key={item.key}>
                    <div className="mb-3 flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold">{item.label}</span>
                      <span className="font-black opacity-60">{score.toFixed(1)} <span className="font-medium text-xs">/ 5.0</span></span>
                    </div>
                    <div className={`h-3 w-full overflow-hidden rounded-full shadow-inner ${isDark ? "bg-white/10" : "bg-gray-200"}`}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#A4ED7D] to-[#56CFAF]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT MODAL */}
      {showSubmitModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-md transition-opacity">
          <div
            className={`w-full max-w-lg rounded-[2rem] border p-8 shadow-2xl ${
              isDark ? "border-white/10 bg-[#0f1714] text-white" : "border-gray-200 bg-white text-[#034440]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`mt-1 rounded-2xl p-4 shadow-inner ${isDark ? "bg-accentGreen/20" : "bg-brandGreen/10"}`}>
                  <CheckCircle2 className={`h-8 w-8 ${isDark ? "text-accentGreen" : "text-brandGreen"}`} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Ready to submit?</h3>
                  <p className={`mt-3 text-sm leading-relaxed ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                    Great job! You have answered all <strong>{totalQuestions} statements</strong>. Once submitted, your responses will be locked in and used to calculate your final proficiency level.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className={`w-full rounded-full px-6 py-3.5 text-sm font-bold sm:w-auto transition ${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                Wait, let me review
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-black shadow-lg sm:w-auto transition hover:scale-[1.02] active:scale-95 ${isDark ? "bg-accentGreen text-black shadow-accentGreen/20" : "bg-brandGreen text-white shadow-brandGreen/20"}`}
              >
                <Send className="h-4 w-4" />
                Submit Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMITTING OVERLAY */}
      {submitting && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-md">
          <div
            className={`w-full max-w-sm rounded-[2rem] border p-8 text-center shadow-2xl ${
              isDark ? "border-white/10 bg-[#0f1714] text-white" : "border-gray-200 bg-white text-[#034440]"
            }`}
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brandGreen/10 shadow-inner">
              <Loader2 className={`h-10 w-10 animate-spin ${isDark ? "text-accentGreen" : "text-brandGreen"}`} />
            </div>
            <h3 className="mt-6 text-2xl font-black tracking-tight">Calculating Results</h3>
            <p className={`mt-3 text-sm leading-relaxed ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
              Hang tight while we analyze your responses and process your digital proficiency profile.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}