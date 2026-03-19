"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Loader2,
  PlayCircle,
  Send,
  Sparkles,
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
} from "@/lib/preAssessment";
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
  const isDark = theme === "dark";

  const [viewState, setViewState] = useState<ViewState>("idle");
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAssessment = async () => {
      try {
        setLoading(true);
        setError("");

        const status = await fetchAssessmentStatus(false);

        if (status.completed) {
          const assessmentResult = await fetchAssessmentResult(false);
          setResult(assessmentResult);
          setViewState("completed");
          return;
        }

        setViewState("idle");
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Unable to load your pre-assessment.");
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

  const handleStart = async () => {
    try {
      setStarting(true);
      setError("");
      const assessmentAttempt = await startPreAssessment();

      setAttempt(assessmentAttempt);
      setRatings({});
      setViewState("ready");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to start the pre-assessment.");
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

      const assessmentResult = await submitPreAssessment(payload);
      setResult(assessmentResult);
      setAttempt(null);
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

  if (loading) {
    return (
      <section className={`mt-6 rounded-[2rem] border p-8 shadow-xl ${isDark ? "border-white/10 bg-zinc-950/85 text-white" : "border-gray-200 bg-white/90 text-[#034440]"}`}>
        <div className="flex items-center gap-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading pre-assessment...
        </div>
      </section>
    );
  }

  return (
    <section className={`mt-6 rounded-[2rem] border p-6 shadow-xl lg:p-8 ${isDark ? "border-white/10 bg-zinc-950/85 text-white" : "border-gray-200 bg-white/90 text-[#034440]"}`}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? "bg-white/10 text-zinc-200" : "bg-brandGreen/10 text-brandGreen"}`}>
            <Sparkles className="h-3.5 w-3.5" />
            Pre-Assessment
          </div>
          <h2 className="mt-4 text-2xl font-bold lg:text-3xl">Measure digital literacy before coursework begins.</h2>
          <p className={`mt-3 max-w-xl text-sm leading-7 ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
            Answer each statement based on your current confidence. Your score will determine your initial proficiency level and unlock the learning modules.
          </p>
        </div>

        <div className={`grid min-w-full gap-3 sm:grid-cols-3 lg:min-w-[340px] ${isDark ? "text-zinc-200" : "text-gray-700"}`}>
          <div className={`rounded-2xl p-4 ${isDark ? "bg-white/5" : "bg-[#f5faf7]"}`}>
            <p className="text-xs uppercase tracking-[0.2em] opacity-70">Questions</p>
            <p className="mt-2 text-2xl font-bold">{totalQuestions || 20}</p>
          </div>
          <div className={`rounded-2xl p-4 ${isDark ? "bg-white/5" : "bg-[#f5faf7]"}`}>
            <p className="text-xs uppercase tracking-[0.2em] opacity-70">Answered</p>
            <p className="mt-2 text-2xl font-bold">{viewState === "completed" ? result?.total_questions ?? 0 : answeredQuestions}</p>
          </div>
          <div className={`rounded-2xl p-4 ${isDark ? "bg-white/5" : "bg-[#f5faf7]"}`}>
            <p className="text-xs uppercase tracking-[0.2em] opacity-70">Level</p>
            <p className="mt-2 text-2xl font-bold">{formatProficiencyLevel(result?.proficiency_level)}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className={`mt-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-red-200 bg-red-50 text-red-700"}`}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {viewState === "idle" && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className={`rounded-[1.75rem] p-6 ${isDark ? "bg-white/5" : "bg-[#f6fbf7]"}`}>
            <h3 className="text-xl font-semibold">What this covers</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Object.values(CATEGORY_LABELS).map((label) => (
                <div key={label} className={`rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-white/10 bg-black/10 text-zinc-300" : "border-white bg-white text-gray-700"}`}>
                  {label}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleStart}
              disabled={starting}
              className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${isDark ? "bg-accentGreen text-black disabled:bg-zinc-700 disabled:text-zinc-300" : "bg-brandGreen text-white disabled:bg-gray-300"}`}
            >
              {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
              {starting ? "Starting..." : "Start Pre-Assessment"}
            </button>
          </div>

          <div className={`rounded-[1.75rem] p-6 ${isDark ? "bg-[#0f1f18]" : "bg-[#034440] text-white"}`}>
            <h3 className="text-xl font-semibold">Rating guide</h3>
            <div className="mt-5 space-y-3 text-sm">
              {RATINGS.map((rating) => (
                <div key={rating.value} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span>{rating.label}</span>
                  <span className="text-lg font-bold">{rating.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewState === "ready" && attempt && (
        <div className="mt-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${isDark ? "bg-white/10 text-zinc-200" : "bg-brandGreen/10 text-brandGreen"}`}>
              <BarChart3 className="h-4 w-4" />
              {answeredQuestions} of {totalQuestions} statements answered
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isComplete || submitting}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${isDark ? "bg-accentGreen text-black disabled:bg-zinc-700 disabled:text-zinc-300" : "bg-brandGreen text-white disabled:bg-gray-300"}`}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? "Submitting..." : "Submit Assessment"}
            </button>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedQuestions).map(([category, questions]) => (
              <div key={category} className={`rounded-[1.75rem] border p-5 ${isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-[#fbfdfb]"}`}>
                <h3 className="text-lg font-semibold">{CATEGORY_LABELS[category] || category}</h3>
                <div className="mt-5 space-y-4">
                  {questions.map((question) => (
                    <div key={question.id} className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-black/10" : "border-white bg-white"}`}>
                      <p className="text-sm font-medium leading-7">{question.order}. {question.question_text}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {RATINGS.map((rating) => {
                          const active = ratings[question.id] === rating.value;
                          return (
                            <button
                              key={rating.value}
                              type="button"
                              onClick={() => handleRate(question.id, rating.value)}
                              className={`rounded-full px-4 py-2 text-sm transition ${
                                active
                                  ? isDark
                                    ? "bg-accentGreen text-black"
                                    : "bg-brandGreen text-white"
                                  : isDark
                                    ? "bg-white/10 text-zinc-300 hover:bg-white/15"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {rating.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewState === "completed" && result && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className={`rounded-[1.75rem] p-6 ${isDark ? "bg-[#0f1f18]" : "bg-[#034440] text-white"}`}>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-accentGreen" />
              <h3 className="text-xl font-semibold">Assessment complete</h3>
            </div>

            <div className="mt-8 flex items-end gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-white/70">Overall score</p>
                <p className="mt-2 text-5xl font-bold">{result.overall_score.toFixed(1)}</p>
                <p className="mt-2 text-sm text-white/80">out of 5.0</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
                {getScorePercent(result.overall_score)}%
              </div>
            </div>

            <div className="mt-8 rounded-[1.5rem] bg-white/10 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Proficiency level</p>
              <p className="mt-3 text-2xl font-bold">{formatProficiencyLevel(result.proficiency_level)}</p>
            </div>
          </div>

          <div className={`rounded-[1.75rem] p-6 ${isDark ? "bg-white/5" : "bg-[#f6fbf7]"}`}>
            <h3 className="text-xl font-semibold">Category breakdown</h3>
            <div className="mt-5 space-y-4">
              {CATEGORY_FIELDS.map((item) => {
                const score = result[item.key];
                const percent = getScorePercent(score);

                return (
                  <div key={item.key}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span>{item.label}</span>
                      <span className="font-semibold">{score.toFixed(1)} / 5.0</span>
                    </div>
                    <div className={`h-3 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-white"}`}>
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
    </section>
  );
}
