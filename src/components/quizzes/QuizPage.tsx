"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardList,
  Clock3,
  Dot,
  Loader2,
  Send,
} from "lucide-react";
import TopBar from "@/components/dashboard/TopBar";
import { API_BASE_URL } from "@/lib/auth";
import chatBgLight from "@/assets/img/chatBotBg-white.png";
import chatBgDark from "@/assets/img/chatBotBg-black.png";
import { useTheme } from "@/context/theme";

interface Question {
  id: number;
  question_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
}

interface Assessment {
  id: number;
  title: string;
  topic: string;
  questions: Question[];
  total_questions: number;
  created_at: string;
  total_attempts: number;
  time_limit?: number | null;
  status: string;
}

interface QuizResult {
  total_questions: number;
  answered_count: number;
  correct_count?: number | null;
  score_percent?: number | null;
  submitted_offline?: boolean;
}

type ChoiceKey = "A" | "B" | "C" | "D";
type QuizCompletionFilter = "all" | "pending" | "completed";
type QuizProgressState = {
  completed: boolean;
  score?: number | null;
  attempts: number;
  last_accessed?: string;
};

function mapAssessment(item: any, idx: number): Assessment {
  const questions = Array.isArray(item?.questions) ? item.questions : [];

  return {
    id: item?.id ?? idx,
    title: item?.title ?? `Assessment ${idx + 1}`,
    topic: item?.lesson?.title ?? item?.topic ?? "General",
    questions,
    total_questions: questions.length || item?.total_questions || 0,
    created_at: item?.created_at ?? item?.updated_at ?? new Date().toISOString(),
    total_attempts: item?.total_attempts ?? 0,
    time_limit: item?.time_limit ?? null,
    status: item?.status ?? "Published",
  };
}

function getChoices(question: Question) {
  return [
    { key: "A" as const, text: question.choice_a },
    { key: "B" as const, text: question.choice_b },
    { key: "C" as const, text: question.choice_c },
    { key: "D" as const, text: question.choice_d },
  ].filter((choice) => choice.text);
}

export default function QuizPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [query, setQuery] = useState("");
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuizId, setLoadingQuizId] = useState<number | null>(null);
  const [quizError, setQuizError] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState<Assessment | null>(null);
  const [selectedLessonTopic, setSelectedLessonTopic] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, ChoiceKey>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progressByQuizId, setProgressByQuizId] = useState<Record<number, QuizProgressState>>({});
  const [quizCompletionFilter, setQuizCompletionFilter] = useState<QuizCompletionFilter>("all");

  const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        setQuizError("");

        const token = localStorage.getItem("access_token");
        if (!token) throw new Error("No access token found.");

        const res = await fetch(`${baseUrl}quizzes/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to load quizzes.");

        const data = await res.json();
        const items = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
        const mappedAssessments: Assessment[] = items.map((item: any, idx: number) =>
          mapAssessment(item, idx)
        );
        setAssessments(mappedAssessments);

        const progressEntries = await Promise.all(
          mappedAssessments.map(async (assessment) => {
            try {
              const progressRes = await fetch(`${baseUrl}quizzes/${assessment.id}/progress/`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              });

              if (!progressRes.ok) return null;

              const progress = await progressRes.json();
              return [
                assessment.id,
                {
                  completed: Boolean(progress?.completed),
                  score: typeof progress?.score === "number" ? progress.score : null,
                  attempts: Number(progress?.attempts ?? 0),
                  last_accessed: progress?.last_accessed,
                } satisfies QuizProgressState,
              ] as const;
            } catch {
              return null;
            }
          })
        );

        const nextProgress: Record<number, QuizProgressState> = {};
        for (const entry of progressEntries) {
          if (!entry) continue;
          const [quizId, progress] = entry;
          nextProgress[quizId] = progress;
        }
        setProgressByQuizId(nextProgress);
      } catch (err) {
        console.error(err);
        setQuizError("Failed to load quizzes. Check your token or backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [baseUrl]);

  const matchingAssessments = useMemo(() => {
    const search = query.trim().toLowerCase();
    return assessments.filter((assessment) =>
      [assessment.title, assessment.topic, assessment.status].join(" ").toLowerCase().includes(search)
    );
  }, [assessments, query]);

  const lessonOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const assessment of matchingAssessments) {
      const topic = (assessment.topic ?? "").trim() || "General";
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([topic, quizCount]) => ({ topic, quizCount }))
      .sort((a, b) => a.topic.localeCompare(b.topic));
  }, [matchingAssessments]);

  const filteredAssessments = useMemo(() => {
    if (!selectedLessonTopic) return [];
    return matchingAssessments.filter((assessment) => assessment.topic === selectedLessonTopic);
  }, [matchingAssessments, selectedLessonTopic]);

  const displayedAssessments = useMemo(() => {
    if (quizCompletionFilter === "all") return filteredAssessments;
    return filteredAssessments.filter((assessment) => {
      const isCompleted = Boolean(progressByQuizId[assessment.id]?.completed);
      return quizCompletionFilter === "completed" ? isCompleted : !isCompleted;
    });
  }, [filteredAssessments, progressByQuizId, quizCompletionFilter]);

  const completedCount = useMemo(
    () => filteredAssessments.filter((assessment) => Boolean(progressByQuizId[assessment.id]?.completed)).length,
    [filteredAssessments, progressByQuizId]
  );

  useEffect(() => {
    if (!selectedLessonTopic) return;
    const exists = lessonOptions.some((l) => l.topic === selectedLessonTopic);
    if (!exists) setSelectedLessonTopic(null);
  }, [lessonOptions, selectedLessonTopic]);

  const answeredCount = useMemo(() => {
    if (!selectedQuiz) return 0;
    return selectedQuiz.questions.filter((question) => Boolean(answers[question.id])).length;
  }, [answers, selectedQuiz]);
  const completionPercent = selectedQuiz?.total_questions
    ? Math.round((answeredCount / selectedQuiz.total_questions) * 100)
    : 0;

  const currentQuestion = selectedQuiz?.questions[currentQuestionIndex] ?? null;

  const resetQuizState = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResult(null);
    setQuizError("");
  };

  const selectLesson = (topic: string | null) => {
    setSelectedLessonTopic(topic);
    setQuizCompletionFilter("all");
    setSelectedQuiz(null);
    resetQuizState();
  };

  const openQuiz = async (assessment: Assessment) => {
    setLoadingQuizId(assessment.id);
    setQuizError("");
    resetQuizState();

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found.");

      const res = await fetch(`${baseUrl}quizzes/${assessment.id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`Failed to load quiz ${assessment.id}.`);

      const data = await res.json();
      setSelectedQuiz(mapAssessment(data, assessment.id));
    } catch (err) {
      console.error(err);

      if (assessment.questions.length > 0) {
        setSelectedQuiz(assessment);
        setQuizError("Loaded quiz summary from the list because the detail endpoint is unavailable.");
      } else {
        setQuizError("Unable to open this quiz right now.");
      }
    } finally {
      setLoadingQuizId(null);
    }
  };

  const selectAnswer = (questionId: number, answer: ChoiceKey) => {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  };

  const submitQuiz = async () => {
    if (!selectedQuiz) return;

    setSubmitting(true);
    setQuizError("");

    const formattedAnswers = Object.fromEntries(
      Object.entries(answers).map(([questionId, answer]) => [
        questionId,
        answer,
      ])
    );
    const answeredCount = Object.keys(formattedAnswers).length;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found.");

      const res = await fetch(`${baseUrl}quizzes/${selectedQuiz.id}/submit/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      if (!res.ok) {
        throw new Error("Submit endpoint unavailable.");
      }

      const data = await res.json();
      const scorePercent =
        typeof data.score_percent === "number"
          ? data.score_percent
          : typeof data.score === "number"
            ? data.score
            : null;

      setResult({
        total_questions: data.total_questions ?? data.total_count ?? selectedQuiz.total_questions,
        answered_count: answeredCount,
        correct_count: data.correct_count ?? null,
        score_percent: scorePercent,
      });
      setProgressByQuizId((current) => ({
        ...current,
        [selectedQuiz.id]: {
          completed: true,
          score: scorePercent,
          attempts: Number(data.attempts ?? current[selectedQuiz.id]?.attempts ?? 0),
          last_accessed: current[selectedQuiz.id]?.last_accessed,
        },
      }));
    } catch (err) {
      console.error(err);
      setResult({
        total_questions: selectedQuiz.total_questions,
        answered_count: answeredCount,
        submitted_offline: true,
      });
      setQuizError("Answers were captured locally, but the backend submit endpoint is unavailable.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden">
      <main className={`relative flex h-full flex-col p-4 lg:p-5 ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
        <div className="absolute inset-0 z-0">
          <Image src={isDark ? chatBgDark : chatBgLight} alt="background" fill className="object-cover opacity-60" />
        </div>

        <div className="relative z-10 flex h-full min-h-0 flex-col">
          <TopBar searchValue={query} onSearch={setQuery} />

          <div className="mt-3 grid min-h-0 flex-1 gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
            <section className={`flex min-h-0 flex-col rounded-xl border p-3 ${isDark ? "border-zinc-800 bg-zinc-900/80" : "border-zinc-200 bg-white/90"}`}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-semibold">Quizzes</h2>
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}>
                  {selectedLessonTopic ? `${displayedAssessments.length}/${filteredAssessments.length}` : `${lessonOptions.length} lessons`}
                </span>
              </div>

              {quizError && (
                <div className={`mb-2 flex items-start gap-2 rounded-lg px-2.5 py-2 text-xs ${isDark ? "bg-red-500/10 text-red-200" : "bg-red-50 text-red-700"}`}>
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{quizError}</span>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto space-y-3 pr-1">
                <div>
                  <p className={`mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                    Lessons
                  </p>
                  {loading ? (
                    <div className={`rounded-lg border px-3 py-3 text-xs ${isDark ? "border-zinc-800 bg-zinc-900 text-zinc-300" : "border-zinc-200 bg-zinc-50 text-zinc-600"}`}>
                      Loading lessons...
                    </div>
                  ) : lessonOptions.length === 0 ? (
                    <div className={`rounded-lg border px-3 py-3 text-xs ${isDark ? "border-zinc-800 bg-zinc-900 text-zinc-300" : "border-zinc-200 bg-zinc-50 text-zinc-600"}`}>
                      No lessons found.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {lessonOptions.map((lesson) => {
                        const active = selectedLessonTopic === lesson.topic;
                        return (
                          <button
                            key={lesson.topic}
                            type="button"
                            onClick={() => selectLesson(lesson.topic)}
                            className={`w-full rounded-lg border px-3 py-2 text-left text-xs font-semibold transition ${
                              active
                                ? isDark
                                  ? "border-accentGreen/60 bg-accentGreen/15"
                                  : "border-brandGreen bg-brandGreen/10"
                                : isDark
                                  ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800/80"
                                  : "border-zinc-200 bg-white hover:bg-zinc-50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{lesson.topic}</span>
                              <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}>
                                {lesson.quizCount}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedLessonTopic && !loading && (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                        Quiz List
                      </p>
                      <span className={`text-[11px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{completedCount} completed</span>
                    </div>

                    <div className="mb-2 grid grid-cols-3 gap-1">
                      {[
                        { key: "all", label: "All" },
                        { key: "pending", label: "Pending" },
                        { key: "completed", label: "Done" },
                      ].map((filter) => (
                        <button
                          key={filter.key}
                          type="button"
                          onClick={() => setQuizCompletionFilter(filter.key as QuizCompletionFilter)}
                          className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                            quizCompletionFilter === filter.key
                              ? isDark
                                ? "bg-accentGreen text-black"
                                : "bg-brandGreen text-white"
                              : isDark
                                ? "bg-zinc-800 text-zinc-300"
                                : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>

                    {displayedAssessments.length === 0 ? (
                      <div className={`rounded-lg border px-3 py-3 text-xs ${isDark ? "border-zinc-800 bg-zinc-900 text-zinc-300" : "border-zinc-200 bg-zinc-50 text-zinc-600"}`}>
                        No quizzes for this filter.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {displayedAssessments.map((assessment) => {
                          const isSelected = selectedQuiz?.id === assessment.id;
                          const isCompleted = Boolean(progressByQuizId[assessment.id]?.completed);
                          return (
                            <button
                              key={assessment.id}
                              type="button"
                              onClick={() => openQuiz(assessment)}
                              className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                                isSelected
                                  ? isDark
                                    ? "border-accentGreen/60 bg-accentGreen/15"
                                    : "border-brandGreen bg-brandGreen/10"
                                  : isDark
                                    ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800/80"
                                    : "border-zinc-200 bg-white hover:bg-zinc-50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold">{assessment.title}</p>
                                  <p className={`mt-0.5 text-[11px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                                    {assessment.total_questions} questions • {assessment.time_limit ? `${assessment.time_limit}m` : "No limit"}
                                  </p>
                                </div>
                                {loadingQuizId === assessment.id ? (
                                  <Loader2 size={14} className="mt-0.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 size={14} className={`mt-0.5 ${isCompleted ? "text-[#9DE16A]" : isDark ? "text-zinc-500" : "text-zinc-300"}`} />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className={`min-h-0 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-900/80" : "border-zinc-200 bg-white/90"}`}>
              {!selectedQuiz ? (
                <div className="flex h-full items-center justify-center p-8">
                  <div className="text-center">
                    <ClipboardList size={24} className={`mx-auto ${isDark ? "text-accentGreen" : "text-brandGreen"}`} />
                    <p className={`mt-3 text-sm ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>Select a quiz from the left panel.</p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-0 flex-col">
                  <div className={`border-b px-4 py-3 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-[11px] font-semibold uppercase tracking-wide ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{selectedQuiz.topic}</p>
                        <h3 className="truncate text-lg font-bold">{selectedQuiz.title}</h3>
                        <p className={`mt-0.5 text-xs ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                          {answeredCount}/{selectedQuiz.total_questions} answered • {progressByQuizId[selectedQuiz.id]?.completed ? "Completed" : "In progress"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-700"}`}>
                          Try {progressByQuizId[selectedQuiz.id]?.attempts ?? selectedQuiz.total_attempts}
                        </span>
                        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-700"}`}>
                          {completionPercent}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid min-h-0 flex-1 lg:grid-cols-[140px_minmax(0,1fr)]">
                    <aside className={`border-b p-3 lg:border-b-0 lg:border-r ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                      <div className="grid grid-cols-5 gap-1 lg:grid-cols-3">
                        {selectedQuiz.questions.map((question, index) => {
                          const answered = Boolean(answers[question.id]);
                          const active = index === currentQuestionIndex;
                          return (
                            <button
                              key={question.id}
                              type="button"
                              onClick={() => setCurrentQuestionIndex(index)}
                              className={`h-8 rounded-md border text-xs font-semibold ${
                                active
                                  ? isDark
                                    ? "border-accentGreen/70 bg-accentGreen/15"
                                    : "border-brandGreen bg-brandGreen/10"
                                  : answered
                                    ? isDark
                                      ? "border-zinc-700 bg-zinc-800"
                                      : "border-zinc-200 bg-green-50 text-green-700"
                                    : isDark
                                      ? "border-zinc-800 bg-zinc-900 text-zinc-400"
                                      : "border-zinc-200 bg-white text-zinc-500"
                              }`}
                            >
                              {index + 1}
                            </button>
                          );
                        })}
                      </div>
                    </aside>

                    <div className="flex min-h-0 flex-col">
                      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-6">
                        {currentQuestion ? (
                          <div className="mx-auto max-w-2xl">
                            <div className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}>
                              {answers[currentQuestion.id] ? <CheckCircle2 size={12} className="text-[#9DE16A]" /> : <Circle size={12} />}
                              Question {currentQuestionIndex + 1}
                            </div>

                            <h4 className="mt-3 text-lg font-semibold leading-relaxed">{currentQuestion.question_text}</h4>

                            <div className="mt-4 space-y-2">
                              {getChoices(currentQuestion).map((choice) => {
                                const selected = answers[currentQuestion.id] === choice.key;
                                return (
                                  <button
                                    key={choice.key}
                                    type="button"
                                    onClick={() => selectAnswer(currentQuestion.id, choice.key)}
                                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left ${
                                      selected
                                        ? isDark
                                          ? "border-accentGreen/70 bg-accentGreen/15"
                                          : "border-brandGreen bg-brandGreen/10"
                                        : isDark
                                          ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800/80"
                                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                                    }`}
                                  >
                                    <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                                      selected
                                        ? isDark
                                          ? "border-accentGreen bg-accentGreen text-black"
                                          : "border-brandGreen bg-brandGreen text-white"
                                        : isDark
                                          ? "border-zinc-700 text-zinc-400"
                                          : "border-zinc-300 text-zinc-500"
                                    }`}>
                                      {choice.key}
                                    </span>
                                    <span className="flex-1 text-sm">{choice.text}</span>
                                    {selected ? (
                                      <CheckCircle2 size={15} className="text-[#9DE16A]" />
                                    ) : (
                                      <Dot size={18} className={isDark ? "text-zinc-500" : "text-zinc-300"} />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <p className={`text-sm ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>No questions found for this quiz.</p>
                        )}
                      </div>

                      <div className={`flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 ${isDark ? "border-zinc-800 bg-zinc-900/90" : "border-zinc-200 bg-white/90"}`}>
                        <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>{completionPercent}% complete</p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
                            disabled={currentQuestionIndex === 0}
                            className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${isDark ? "bg-zinc-800 hover:bg-zinc-700" : "bg-zinc-100 hover:bg-zinc-200"}`}
                          >
                            <ChevronLeft size={14} />
                            Prev
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentQuestionIndex((index) => Math.min(selectedQuiz.questions.length - 1, index + 1))}
                            disabled={currentQuestionIndex >= selectedQuiz.questions.length - 1}
                            className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${isDark ? "bg-zinc-800 hover:bg-zinc-700" : "bg-zinc-100 hover:bg-zinc-200"}`}
                          >
                            Next
                            <ChevronRight size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={submitQuiz}
                            disabled={submitting || selectedQuiz.questions.length === 0}
                            className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                              isDark ? "bg-accentGreen text-black hover:bg-[#8CD559]" : "bg-brandGreen text-white hover:bg-brandGreen/90"
                            }`}
                          >
                            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            {submitting ? "Submitting..." : "Submit"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {result && (
                    <div className={`mx-4 mb-4 rounded-lg border px-3 py-2 text-xs ${isDark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-50"}`}>
                      <p className="font-semibold">Submission recorded</p>
                      <p className={`mt-1 ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
                        Answered {result.answered_count}/{result.total_questions}
                        {typeof result.correct_count === "number" ? ` • Correct ${result.correct_count}` : ""}
                        {typeof result.score_percent === "number" ? ` • Score ${result.score_percent}%` : ""}
                      </p>
                      {result.submitted_offline && (
                        <p className="mt-1 text-yellow-500">Answers captured locally (backend unavailable).</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}