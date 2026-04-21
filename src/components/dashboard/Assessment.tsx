"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Loader2,
  LockKeyhole,
  Pencil,
  PlayCircle,
  Send,
  Sparkles,
  Trophy,
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
  email_communication: "Email & Communication",
  internet_platforms: "Internet & Online Platforms",
};

const CATEGORY_ICONS: Record<string, string> = {
  basic_computer: "🖥️",
  document_processing: "📄",
  spreadsheet: "📊",
  email_communication: "✉️",
  internet_platforms: "🌐",
};

const CATEGORY_FIELDS = [
  { key: "basic_computer_score", label: "Basic Computer Skills" },
  { key: "document_processing_score", label: "Document Processing" },
  { key: "spreadsheet_score", label: "Spreadsheet Skills" },
  { key: "email_communication_score", label: "Email & Communication" },
  { key: "internet_platforms_score", label: "Internet & Online Platforms" },
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

  useEffect(() => {
    if (viewState === "ready" && isComplete && !showSubmitModal && !hasPromptedSubmit) {
      const timer = setTimeout(() => {
        setShowSubmitModal(true);
        setHasPromptedSubmit(true);
      }, 600);
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
      const assessmentResult =
        mode === "PRE" ? await submitPreAssessment(payload) : await submitPostAssessment(payload);
      setResult(assessmentResult);
      if (mode === "POST") {
        const resultsArray = await fetchAssessmentResult(false);
        const sorted = [...resultsArray].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setAllResults(sorted);
      }
      setAttempt(null);
      setHasPromptedSubmit(false);
      setViewState("completed");
    } catch (err: any) {
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

  // ── Shared styles ────────────────────────────────────────────────────────────
  const card = isDark
    ? "rounded-2xl border border-white/10 bg-white/[0.03]"
    : "rounded-2xl border border-gray-200/80 bg-white shadow-sm";

  const mutedText = isDark ? "text-zinc-400" : "text-gray-500";
  const labelClass = `text-[10px] font-semibold uppercase tracking-[0.18em] ${mutedText}`;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className={`mt-6 rounded-3xl border p-10 ${isDark ? "border-white/10 bg-zinc-950/80" : "border-gray-200 bg-white"}`}>
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accentGreen" />
          <p className={`text-sm font-medium ${mutedText}`}>Loading your assessment…</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`relative mt-6 rounded-3xl border ${isDark ? "border-white/10 bg-zinc-950/80" : "border-gray-200/80 bg-gray-50/50"}`}>

      {/* ── PAGE HEADER ───────────────────────────────────────────────────────── */}
      <div className={`rounded-t-3xl border-b px-6 py-6 lg:px-8 lg:py-7 ${isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200/80 bg-white"}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {/* Eyebrow */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                isDark
                  ? "border-accentGreen/30 bg-accentGreen/10 text-accentGreen"
                  : "border-brandGreen/30 bg-brandGreen/10 text-brandGreen"
              }`}>
                <Sparkles className="h-3 w-3" />
                {mode === "PRE" ? "Pre-Assessment" : "Post-Assessment"}
              </span>
              {mode === "POST" && currentLevel && (
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                  isDark ? "border-amber-400/30 bg-amber-400/10 text-amber-300" : "border-amber-500/30 bg-amber-50 text-amber-700"
                }`}>
                  Baseline: {formatProficiencyLevel(currentLevel)}
                </span>
              )}
              {showAdminEdit && (
                <Link
                  href="/admin/pre-assessment"
                  onClick={() => window.scrollTo({ top: 0 })}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition hover:opacity-80 ${
                    isDark ? "border-white/10 bg-white/5 text-zinc-300" : "border-gray-200 bg-white text-gray-600"
                  }`}
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Link>
              )}
            </div>

            {/* Title */}
            <h1 className={`text-2xl font-black tracking-tight lg:text-3xl ${isDark ? "text-white" : "text-[#034440]"}`}>
              {mode === "PRE"
                ? "Measure your digital literacy"
                : "Evaluate your growth"}
            </h1>
            <p className={`mt-1.5 max-w-lg text-sm leading-relaxed ${mutedText}`}>
              {mode === "PRE"
                ? "Rate your confidence for each statement. Your responses set your starting proficiency level."
                : "Complete 70%+ of modules first. This final evaluation is locked after submission."}
            </p>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "Questions", value: totalQuestions || 20 },
              { label: "Categories", value: Object.keys(CATEGORY_LABELS).length },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-xl border px-4 py-3 text-center min-w-[72px] ${
                  isDark ? "border-white/10 bg-white/[0.04]" : "border-gray-200 bg-white"
                }`}
              >
                <p className={labelClass}>{stat.label}</p>
                <p className={`mt-1 text-2xl font-black ${isDark ? "text-white" : "text-[#034440]"}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────────── */}
      <div className="p-6 lg:p-8">

        {/* Error banner */}
        {error && (
          <div className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            isDark ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-red-200 bg-red-50 text-red-700"
          }`}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            IDLE STATE
        ═══════════════════════════════════════════════════════════════════ */}
        {viewState === "idle" && (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">

            {/* Left column */}
            <div className="flex flex-col gap-5">

              {/* What this covers */}
              <div className={card + " p-6"}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`h-1 w-5 rounded-full ${isDark ? "bg-accentGreen" : "bg-brandGreen"}`} />
                  <h2 className={`text-sm font-bold ${isDark ? "text-white" : "text-[#034440]"}`}>
                    What this covers
                  </h2>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <div
                      key={key}
                      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-medium transition-transform hover:-translate-y-0.5 ${
                        isDark
                          ? "border-white/8 bg-white/[0.03] text-zinc-300"
                          : "border-gray-200 bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span className="text-base">{CATEGORY_ICONS[key]}</span>
                      <span className="leading-snug text-[13px]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Post-assessment warning */}
              {mode === "POST" && (
                <div className={`flex items-start gap-3 rounded-xl border px-4 py-4 text-sm leading-relaxed ${
                  isDark
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}>
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <span>
                    <strong>One attempt only.</strong> Make sure you have completed at least 70% of your modules before starting.
                  </span>
                </div>
              )}

              {/* CTA */}
              <button
                type="button"
                onClick={handleStart}
                disabled={starting}
                className={`group inline-flex items-center gap-2.5 self-start rounded-full px-7 py-3.5 text-sm font-bold shadow-md transition hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? "bg-accentGreen text-black shadow-accentGreen/20"
                    : "bg-[#034440] text-white shadow-[#034440]/20"
                }`}
              >
                {starting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
                )}
                {starting ? "Starting…" : `Start ${mode === "PRE" ? "Pre" : "Post"}-Assessment`}
                {!starting && <ChevronRight className="h-4 w-4 opacity-60" />}
              </button>
            </div>

            {/* Right column — rating guide */}
            <div className={`rounded-2xl p-6 ${isDark ? "bg-[#061410] border border-white/8" : "bg-[#034440]"}`}>
              <div className="flex items-center gap-2 mb-5">
                <div className="h-1 w-5 rounded-full bg-white/40" />
                <h2 className="text-sm font-bold text-white">Rating guide</h2>
              </div>
              <div className="space-y-2.5">
                {RATINGS.map((rating) => (
                  <div
                    key={rating.value}
                    className="flex items-center justify-between rounded-xl bg-white/8 px-4 py-2.5"
                  >
                    <span className="text-[13px] font-medium text-white/90">{rating.label}</span>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-black ${
                      isDark ? "bg-accentGreen text-black" : "bg-white/20 text-white"
                    }`}>
                      {rating.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            READY STATE
        ═══════════════════════════════════════════════════════════════════ */}
        {viewState === "ready" && attempt && (
          <div className={`overflow-hidden rounded-2xl border ${isDark ? "border-white/10" : "border-gray-200"}`}>

            {/* Sticky progress header */}
            <div className={`sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b px-5 py-4 backdrop-blur-md ${
              isDark ? "border-white/10 bg-zinc-950/90" : "border-gray-200 bg-white/95"
            }`}>
              {/* Progress */}
              <div className="flex flex-1 items-center gap-3 min-w-0">
                <div className={`h-2 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${isDark ? "bg-accentGreen" : "bg-brandGreen"}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className={`shrink-0 text-xs font-bold tabular-nums ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
                  {answeredQuestions}/{totalQuestions}
                </span>
              </div>

              {/* Submit button */}
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                disabled={!isComplete || submitting}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark
                    ? "bg-accentGreen text-black"
                    : "bg-[#034440] text-white"
                }`}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit
              </button>
            </div>

            {/* Scrollable questions */}
            <div className={`max-h-[65vh] overflow-y-auto p-5 scrollbar-thin scrollbar-track-transparent ${
              isDark ? "scrollbar-thumb-white/15" : "scrollbar-thumb-gray-300"
            }`}>
              <div className="space-y-8">
                {Object.entries(groupedQuestions).map(([category, questions], sectionIdx) => (
                  <div key={category}>

                    {/* Section heading */}
                    <div className={`mb-4 flex items-center gap-3 rounded-xl px-4 py-3 ${
                      isDark ? "bg-white/[0.04] border border-white/8" : "bg-gray-50 border border-gray-200"
                    }`}>
                      <span className="text-lg">{CATEGORY_ICONS[category] ?? "📋"}</span>
                      <div>
                        <p className={labelClass}>Section {sectionIdx + 1} of {Object.keys(groupedQuestions).length}</p>
                        <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-[#034440]"}`}>
                          {CATEGORY_LABELS[category] || category}
                        </h3>
                      </div>
                      <div className="ml-auto">
                        <span className={`text-xs font-semibold ${mutedText}`}>
                          {questions.filter((q) => ratings[q.id] !== undefined).length}/{questions.length} answered
                        </span>
                      </div>
                    </div>

                    {/* Questions */}
                    <div className="space-y-3 pl-1">
                      {questions.map((question) => {
                        const answered = ratings[question.id] !== undefined;
                        return (
                          <div
                            key={question.id}
                            className={`rounded-xl border p-4 transition-colors ${
                              answered
                                ? isDark
                                  ? "border-accentGreen/20 bg-accentGreen/[0.04]"
                                  : "border-brandGreen/25 bg-brandGreen/[0.03]"
                                : isDark
                                  ? "border-white/8 bg-white/[0.02]"
                                  : "border-gray-200 bg-white"
                            }`}
                          >
                            {/* Question text */}
                            <p className={`mb-4 text-sm leading-relaxed font-medium ${isDark ? "text-zinc-200" : "text-gray-800"}`}>
                              <span className={`mr-2 text-xs font-black ${mutedText}`}>{question.order}.</span>
                              {question.question_text}
                            </p>

                            {/* Rating buttons */}
                            <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                              {RATINGS.map((rating) => {
                                const isSelected = ratings[question.id] === rating.value;
                                return (
                                  <button
                                    key={rating.value}
                                    type="button"
                                    onClick={() => handleRate(question.id, rating.value)}
                                    className={`flex flex-col items-center justify-center rounded-xl border py-2.5 transition-all md:py-3 ${
                                      isSelected
                                        ? isDark
                                          ? "scale-105 border-accentGreen bg-accentGreen text-black shadow-md"
                                          : "scale-105 border-brandGreen bg-brandGreen text-white shadow-md"
                                        : isDark
                                          ? "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-accentGreen/40 hover:bg-white/8"
                                          : "border-gray-200 bg-gray-50 text-gray-600 hover:border-brandGreen/40 hover:bg-brandGreen/5"
                                    }`}
                                  >
                                    <span className="text-base font-black md:text-lg">{rating.value}</span>
                                    <span className="mt-1 hidden text-center text-[8px] font-bold uppercase leading-tight tracking-wide opacity-75 md:block">
                                      {rating.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Mobile label endpoints */}
                            <div className={`mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-wide md:hidden ${mutedText}`}>
                              <span>Strongly Disagree</span>
                              <span>Strongly Agree</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            COMPLETED STATE
        ═══════════════════════════════════════════════════════════════════ */}
        {viewState === "completed" && result && (
          <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">

            {/* Score card */}
            <div className={`rounded-2xl p-7 flex flex-col justify-between ${
              isDark ? "bg-[#061410] border border-white/8" : "bg-[#034440]"
            }`}>
              {/* Top */}
              <div>
                <div className="flex items-center gap-2.5 mb-6">
                  <div className={`rounded-xl p-2.5 ${isDark ? "bg-accentGreen/20" : "bg-white/15"}`}>
                    <Trophy className={`h-5 w-5 ${isDark ? "text-accentGreen" : "text-white"}`} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-accentGreen/70" : "text-white/60"}`}>
                      Assessment complete
                    </p>
                    <h2 className="text-lg font-black text-white">Your results</h2>
                  </div>
                </div>

                {/* Score display */}
                <div className="mb-6">
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-zinc-500" : "text-white/50"}`}>
                    Overall score
                  </p>
                  <div className="flex items-end gap-3">
                    <span className="text-7xl font-black text-white leading-none tracking-tighter">
                      {result.overall_score.toFixed(1)}
                    </span>
                    <div className="mb-1.5">
                      <span className={`text-sm font-medium ${isDark ? "text-zinc-400" : "text-white/60"}`}>/ 5.0</span>
                      <div className={`mt-1 rounded-lg px-3 py-1 text-sm font-black ${
                        isDark ? "bg-accentGreen text-black" : "bg-white/20 text-white"
                      }`}>
                        {getScorePercent(result.overall_score)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score bar */}
                <div className={`h-2 w-full overflow-hidden rounded-full mb-6 ${isDark ? "bg-white/10" : "bg-white/20"}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${isDark ? "bg-accentGreen" : "bg-white"}`}
                    style={{ width: `${getScorePercent(result.overall_score)}%` }}
                  />
                </div>

                {/* Proficiency level */}
                <div className={`rounded-xl border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-white/20 bg-white/10"}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-zinc-500" : "text-white/50"}`}>
                    Proficiency level
                  </p>
                  <p className="text-2xl font-black text-white tracking-tight">
                    {formatProficiencyLevel(result?.proficiency_level || currentLevel)}
                  </p>
                </div>
              </div>

              {/* Bottom CTA */}
              <Link
                href="/dashboard"
                onClick={() => window.scrollTo({ top: 0 })}
                className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition hover:scale-[1.02] active:scale-95 ${
                  isDark ? "bg-accentGreen text-black" : "bg-white text-[#034440]"
                }`}
              >
                Back to Dashboard
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Category breakdown */}
            <div className={card + " p-6"}>
              <div className="flex items-center gap-2 mb-6">
                <div className={`h-1 w-5 rounded-full ${isDark ? "bg-accentGreen" : "bg-brandGreen"}`} />
                <h2 className={`text-sm font-bold ${isDark ? "text-white" : "text-[#034440]"}`}>
                  Category breakdown
                </h2>
                <span className={`ml-auto text-xs font-semibold ${mutedText}`}>Score out of 5.0</span>
              </div>

              <div className="space-y-5">
                {CATEGORY_FIELDS.map((item) => {
                  const score = result[item.key];
                  const percent = getScorePercent(score);
                  const categoryKey = Object.keys(CATEGORY_LABELS).find((k) =>
                    CATEGORY_LABELS[k] === item.label
                  );

                  return (
                    <div key={item.key}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{categoryKey ? CATEGORY_ICONS[categoryKey] : "📋"}</span>
                          <span className={`text-[13px] font-semibold ${isDark ? "text-zinc-200" : "text-gray-700"}`}>
                            {item.label}
                          </span>
                        </div>
                        <span className={`text-xs font-black tabular-nums ${isDark ? "text-zinc-300" : "text-gray-700"}`}>
                          {score.toFixed(1)}
                          <span className={`font-normal ${mutedText}`}> /5</span>
                        </span>
                      </div>
                      <div className={`relative h-2.5 w-full overflow-hidden rounded-full ${isDark ? "bg-white/8" : "bg-gray-100"}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            percent >= 70
                              ? "bg-gradient-to-r from-[#7BE88C] to-[#56CFAF]"
                              : percent >= 40
                                ? "bg-gradient-to-r from-[#F5C842] to-[#EF9F27]"
                                : "bg-gradient-to-r from-[#F09595] to-[#E24B4A]"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className={`mt-6 flex flex-wrap gap-4 pt-5 border-t text-[11px] font-semibold ${isDark ? "border-white/8 text-zinc-400" : "border-gray-100 text-gray-500"}`}>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-4 rounded-full bg-gradient-to-r from-[#7BE88C] to-[#56CFAF]" />
                  Strong (70%+)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-4 rounded-full bg-gradient-to-r from-[#F5C842] to-[#EF9F27]" />
                  Developing (40–69%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-4 rounded-full bg-gradient-to-r from-[#F09595] to-[#E24B4A]" />
                  Needs work (&lt;40%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SUBMIT MODAL ──────────────────────────────────────────────────────── */}
      {showSubmitModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm rounded-3xl">
          <div className={`w-full max-w-md rounded-2xl border p-7 shadow-2xl ${
            isDark ? "border-white/10 bg-zinc-900 text-white" : "border-gray-200 bg-white text-[#034440]"
          }`}>
            {/* Icon */}
            <div className={`mb-5 inline-flex rounded-xl p-3 ${isDark ? "bg-accentGreen/15" : "bg-brandGreen/10"}`}>
              <CheckCircle2 className={`h-7 w-7 ${isDark ? "text-accentGreen" : "text-brandGreen"}`} />
            </div>

            <h3 className="text-xl font-black tracking-tight">Ready to submit?</h3>
            <p className={`mt-2.5 text-sm leading-relaxed ${mutedText}`}>
              You've answered all <strong className={isDark ? "text-white" : "text-[#034440]"}>{totalQuestions} statements</strong>. Once submitted your responses are locked and used to calculate your proficiency level.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className={`w-full rounded-full px-5 py-2.5 text-sm font-semibold transition sm:w-auto ${
                  isDark ? "bg-white/8 text-white hover:bg-white/12" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Review answers
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-black transition hover:scale-[1.02] active:scale-95 sm:w-auto ${
                  isDark ? "bg-accentGreen text-black" : "bg-[#034440] text-white"
                }`}
              >
                <Send className="h-4 w-4" />
                Submit assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBMITTING OVERLAY ────────────────────────────────────────────────── */}
      {submitting && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm rounded-3xl">
          <div className={`w-full max-w-sm rounded-2xl border p-8 text-center shadow-2xl ${
            isDark ? "border-white/10 bg-zinc-900 text-white" : "border-gray-200 bg-white text-[#034440]"
          }`}>
            <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
              isDark ? "bg-accentGreen/15" : "bg-brandGreen/10"
            }`}>
              <Loader2 className={`h-8 w-8 animate-spin ${isDark ? "text-accentGreen" : "text-brandGreen"}`} />
            </div>
            <h3 className="text-xl font-black tracking-tight">Calculating results</h3>
            <p className={`mt-2 text-sm leading-relaxed ${mutedText}`}>
              Analysing your responses and building your proficiency profile…
            </p>
          </div>
        </div>
      )}
    </section>
  );
}