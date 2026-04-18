"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  BookOpen,
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

          {/* WIDENED THE SIDEBAR HERE */}
          <div className="mt-3 grid min-h-0 flex-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
            
            {/* SIDEBAR */}
            <section className={`flex min-h-0 flex-col rounded-xl border p-3 ${isDark ? "border-zinc-800 bg-zinc-900/80" : "border-zinc-200 bg-white/90"}`}>
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  {selectedLessonTopic && (
                    <button 
                      onClick={() => selectLesson(null)} 
                      className={`p-1.5 rounded-md transition ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}
                  <h2 className="text-lg font-bold">
                    {selectedLessonTopic ? "Quizzes" : "Lessons"}
                  </h2>
                </div>
                <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}>
                  {selectedLessonTopic ? `${displayedAssessments.length}` : `${lessonOptions.length}`}
                </span>
              </div>

              {quizError && (
                <div className={`mb-3 flex items-start gap-2 rounded-lg px-2.5 py-2 text-xs ${isDark ? "bg-red-500/10 text-red-200" : "bg-red-50 text-red-700"}`}>
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{quizError}</span>
                </div>
              )}

              {selectedLessonTopic && (
                <div className="mb-3 space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    {["all", "pending", "completed"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setQuizCompletionFilter(f as QuizCompletionFilter)}
                        className={`rounded-md py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
                          quizCompletionFilter === f
                            ? isDark ? "bg-[#8CD559] text-black" : "bg-brandGreen text-white"
                            : isDark ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                {loading ? (
                  <div className={`rounded-lg border px-3 py-3 text-xs ${isDark ? "border-zinc-800 bg-zinc-900 text-zinc-300" : "border-zinc-200 bg-zinc-50 text-zinc-600"}`}>
                    Loading...
                  </div>
                ) : !selectedLessonTopic ? (
                  <div className="space-y-3">
                    {lessonOptions.length === 0 ? (
                      <div className={`rounded-lg border px-3 py-3 text-xs ${isDark ? "border-zinc-800 bg-zinc-900 text-zinc-300" : "border-zinc-200 bg-zinc-50 text-zinc-600"}`}>
                        No lessons found.
                      </div>
                    ) : (
                      lessonOptions.map((lesson) => (
                        <button
                          key={lesson.topic}
                          onClick={() => selectLesson(lesson.topic)}
                          className={`w-full group relative rounded-2xl border p-4 text-left transition-all duration-300 overflow-hidden ${
                            isDark 
                              ? "border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/80 hover:border-[#8CD559]/40 hover:shadow-[0_4px_20px_rgba(140,213,89,0.05)] backdrop-blur-md" 
                              : "border-zinc-200/80 bg-white/60 hover:bg-white hover:border-brandGreen/40 hover:shadow-md backdrop-blur-md"
                          }`}
                        >
                          <div className="relative z-10 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                                isDark 
                                  ? "bg-zinc-800 group-hover:bg-[#8CD559]/20 text-zinc-400 group-hover:text-[#8CD559]" 
                                  : "bg-zinc-100 group-hover:bg-brandGreen/10 text-zinc-500 group-hover:text-brandGreen"
                              }`}>
                                <BookOpen size={20} />
                              </div>
                              <div className="min-w-0 pr-2">
                                {/* Text truncation is much less likely to happen now with the wider sidebar */}
                                <h3 className="truncate text-base font-bold">{lesson.topic}</h3>
                                <p className={`mt-0.5 text-xs font-medium ${isDark ? "text-zinc-500 group-hover:text-zinc-400 transition-colors" : "text-zinc-500"}`}>
                                  {lesson.quizCount} {lesson.quizCount === 1 ? 'Quiz' : 'Quizzes'}
                                </p>
                              </div>
                            </div>
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                              isDark 
                                ? "bg-zinc-800/50 text-zinc-500 group-hover:bg-[#8CD559]/20 group-hover:text-[#8CD559] group-hover:translate-x-1" 
                                : "bg-zinc-100 text-zinc-400 group-hover:bg-brandGreen/10 group-hover:text-brandGreen group-hover:translate-x-1"
                            }`}>
                              <ChevronRight size={16} />
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {displayedAssessments.length === 0 ? (
                      <div className={`rounded-lg border px-3 py-3 text-xs ${isDark ? "border-zinc-800 bg-zinc-900 text-zinc-300" : "border-zinc-200 bg-zinc-50 text-zinc-600"}`}>
                        No quizzes for this filter.
                      </div>
                    ) : (
                      displayedAssessments.map((assessment) => {
                        const isSelected = selectedQuiz?.id === assessment.id;
                        const isCompleted = Boolean(progressByQuizId[assessment.id]?.completed);
                        return (
                          <button
                            key={assessment.id}
                            onClick={() => openQuiz(assessment)}
                            className={`w-full group rounded-xl border p-4 text-left transition-all duration-300 ${
                              isSelected
                                ? isDark ? "border-[#8CD559] bg-[#8CD559]/10 shadow-[0_0_15px_rgba(140,213,89,0.1)]" : "border-brandGreen bg-brandGreen/5"
                                : isDark ? "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/80 backdrop-blur-sm" : "border-zinc-200 bg-white/60 hover:bg-white backdrop-blur-sm"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate leading-tight">{assessment.title}</p>
                                <div className="flex items-center gap-3 mt-2 opacity-60 text-[11px] font-medium">
                                  <span className="flex items-center gap-1.5"><ClipboardList size={14}/> {assessment.total_questions} Qs</span>
                                  <span className="flex items-center gap-1.5"><Clock3 size={14}/> {assessment.time_limit || "∞"}</span>
                                </div>
                              </div>
                              {loadingQuizId === assessment.id ? (
                                <Loader2 size={18} className="animate-spin shrink-0" />
                              ) : isCompleted ? (
                                <CheckCircle2 size={18} className="text-[#9DE16A] shrink-0" />
                              ) : null}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* MAIN QUIZ AREA */}
            <section className={`min-h-0 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-900/80" : "border-zinc-200 bg-white/90"}`}>
              {!selectedQuiz ? (
                <div className="flex h-full items-center justify-center p-8">
                  <div className="text-center opacity-80">
                    <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${isDark ? "bg-zinc-800/50" : "bg-zinc-100"}`}>
                      <ClipboardList size={32} className={isDark ? "text-[#8CD559]" : "text-brandGreen"} />
                    </div>
                    <h3 className="mt-4 text-lg font-bold">No Quiz Selected</h3>
                    <p className={`mt-1 text-sm font-medium ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                      Select a lesson and quiz from the left panel to begin.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-0 flex-col">
                  <div className={`border-b px-5 py-4 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-[#8CD559]" : "text-brandGreen"}`}>{selectedQuiz.topic}</p>
                        <h3 className="truncate text-xl font-bold mt-1">{selectedQuiz.title}</h3>
                        <p className={`mt-1 text-xs font-medium ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                          {answeredCount}/{selectedQuiz.total_questions} answered • {progressByQuizId[selectedQuiz.id]?.completed ? "Completed" : "In progress"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-md px-2.5 py-1.5 text-xs font-bold ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-700"}`}>
                          Try {progressByQuizId[selectedQuiz.id]?.attempts ?? selectedQuiz.total_attempts}
                        </span>
                        <span className={`rounded-md px-2.5 py-1.5 text-xs font-bold ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-700"}`}>
                          {completionPercent}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid min-h-0 flex-1 lg:grid-cols-[140px_minmax(0,1fr)]">
                    <aside className={`border-b p-3 lg:border-b-0 lg:border-r ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                      <div className="grid grid-cols-5 gap-1.5 lg:grid-cols-3">
                        {selectedQuiz.questions.map((question, index) => {
                          const answered = Boolean(answers[question.id]);
                          const active = index === currentQuestionIndex;
                          return (
                            <button
                              key={question.id}
                              type="button"
                              onClick={() => setCurrentQuestionIndex(index)}
                              className={`h-9 rounded-md border text-sm font-bold ${
                                active
                                  ? isDark
                                    ? "border-[#8CD559]/70 bg-[#8CD559]/15 text-white"
                                    : "border-brandGreen bg-brandGreen/10 text-brandGreen"
                                  : answered
                                    ? isDark
                                      ? "border-zinc-700 bg-zinc-800 text-zinc-300"
                                      : "border-zinc-200 bg-green-50 text-green-700"
                                    : isDark
                                      ? "border-zinc-800 bg-zinc-900 text-zinc-500 hover:bg-zinc-800"
                                      : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
                              }`}
                            >
                              {index + 1}
                            </button>
                          );
                        })}
                      </div>
                    </aside>

                    <div className="flex min-h-0 flex-col">
                      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 lg:px-8">
                        {currentQuestion ? (
                          <div className="mx-auto max-w-2xl">
                            <div className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}>
                              {answers[currentQuestion.id] ? <CheckCircle2 size={14} className="text-[#9DE16A]" /> : <Circle size={14} />}
                              Question {currentQuestionIndex + 1}
                            </div>

                            <h4 className="mt-4 text-xl font-semibold leading-relaxed">{currentQuestion.question_text}</h4>

                            <div className="mt-6 space-y-3">
                              {getChoices(currentQuestion).map((choice) => {
                                const selected = answers[currentQuestion.id] === choice.key;
                                return (
                                  <button
                                    key={choice.key}
                                    type="button"
                                    onClick={() => selectAnswer(currentQuestion.id, choice.key)}
                                    className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-colors duration-200 ${
                                      selected
                                        ? isDark
                                          ? "border-[#8CD559] bg-[#8CD559]/10"
                                          : "border-brandGreen bg-brandGreen/5"
                                        : isDark
                                          ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800/80"
                                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                                    }`}
                                  >
                                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                                      selected
                                        ? isDark
                                          ? "border-[#8CD559] bg-[#8CD559] text-black"
                                          : "border-brandGreen bg-brandGreen text-white"
                                        : isDark
                                          ? "border-zinc-700 text-zinc-400"
                                          : "border-zinc-300 text-zinc-500"
                                    }`}>
                                      {choice.key}
                                    </span>
                                    <span className="flex-1 text-base font-medium">{choice.text}</span>
                                    {selected ? (
                                      <CheckCircle2 size={20} className="text-[#9DE16A] shrink-0" />
                                    ) : (
                                      <Dot size={24} className={`shrink-0 ${isDark ? "text-zinc-600" : "text-zinc-300"}`} />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <p className={`text-sm font-medium ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>No questions found for this quiz.</p>
                        )}
                      </div>

                      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 ${isDark ? "border-zinc-800 bg-zinc-900/90" : "border-zinc-200 bg-white/90"}`}>
                        <p className={`text-sm font-bold ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>{completionPercent}% complete</p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
                            disabled={currentQuestionIndex === 0}
                            className={`inline-flex items-center gap-1 rounded-md px-4 py-2 text-sm font-bold disabled:opacity-50 transition-colors ${isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"}`}
                          >
                            <ChevronLeft size={16} />
                            Prev
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentQuestionIndex((index) => Math.min(selectedQuiz.questions.length - 1, index + 1))}
                            disabled={currentQuestionIndex >= selectedQuiz.questions.length - 1}
                            className={`inline-flex items-center gap-1 rounded-md px-4 py-2 text-sm font-bold disabled:opacity-50 transition-colors ${isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"}`}
                          >
                            Next
                            <ChevronRight size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={submitQuiz}
                            disabled={submitting || selectedQuiz.questions.length === 0}
                            className={`inline-flex items-center gap-2 rounded-md px-5 py-2 text-sm font-bold disabled:opacity-50 transition-colors ${
                              isDark ? "bg-[#8CD559] text-black hover:bg-[#7bc04e]" : "bg-brandGreen text-white hover:bg-brandGreen/90"
                            }`}
                          >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {submitting ? "Submitting..." : "Submit"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {result && (
                    <div className={`mx-5 mb-5 rounded-lg border px-4 py-3 text-sm ${isDark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-50"}`}>
                      <p className="font-bold">Submission recorded</p>
                      <p className={`mt-1 font-medium ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
                        Answered {result.answered_count}/{result.total_questions}
                        {typeof result.correct_count === "number" ? ` • Correct ${result.correct_count}` : ""}
                        {typeof result.score_percent === "number" ? ` • Score ${result.score_percent}%` : ""}
                      </p>
                      {result.submitted_offline && (
                        <p className="mt-1 text-yellow-500 font-medium">Answers captured locally (backend unavailable).</p>
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