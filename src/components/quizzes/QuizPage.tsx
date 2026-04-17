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

  useEffect(() => {
    if (!selectedLessonTopic) return;
    const exists = lessonOptions.some((l) => l.topic === selectedLessonTopic);
    if (!exists) setSelectedLessonTopic(null);
  }, [lessonOptions, selectedLessonTopic]);

  const answeredCount = useMemo(() => {
    if (!selectedQuiz) return 0;
    return selectedQuiz.questions.filter((question) => Boolean(answers[question.id])).length;
  }, [answers, selectedQuiz]);

  const currentQuestion = selectedQuiz?.questions[currentQuestionIndex] ?? null;

  const resetQuizState = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResult(null);
    setQuizError("");
  };

  const selectLesson = (topic: string | null) => {
    setSelectedLessonTopic(topic);
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
    <div className="h-screen flex overflow-hidden">
      <main className={`flex-1 flex flex-col p-4 lg:p-6 relative overflow-hidden ${isDark ? "text-white" : "text-black"}`}>
        <div className="absolute inset-0 z-0">
          <Image
            src={isDark ? chatBgDark : chatBgLight}
            alt="background"
            fill
            className="object-cover opacity-95"
          />
        </div>

        <div className="relative z-10 flex flex-col h-full min-h-0">
          <TopBar searchValue={query} onSearch={setQuery} />

          <div className="mt-4 flex-1 min-h-0 flex flex-col gap-4 xl:grid xl:grid-cols-[340px_minmax(0,1fr)]">
            {/* LEFT SIDEBAR: ASSESSMENTS LIST */}
            <section className={`flex flex-col min-h-0 rounded-[2rem] border p-5 shadow-xl ${isDark ? "border-white/10 bg-zinc-950/85" : "border-gray-200 bg-white/90"}`}>
              <div className="flex items-start justify-between gap-4 shrink-0">
                <div>
                  <h1 className="text-xl font-bold">Assessments</h1>
                  <p className={`mt-1 text-xs ${isDark ? "text-zinc-400" : "text-gray-600"}`}>
                    Pick a lesson first, then a quiz.
                  </p>
                </div>
                <div className={`rounded-full px-3 py-1.5 text-xs font-semibold bg-textGreen/60 text-white ${isDark ? "bg-white/10 text-zinc-200" : "bg-brandGreen/10 text-brandGreen"}`}>
                  {selectedLessonTopic ? `${filteredAssessments.length} quizzes` : `${lessonOptions.length} lessons`}
                </div>
              </div>

              {quizError && (
                <div className={`mt-4 flex items-start gap-2 rounded-xl px-3 py-2 text-xs shrink-0 ${isDark ? "bg-red-500/10 text-red-200" : "bg-red-50 text-red-700"}`}>
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{quizError}</span>
                </div>
              )}

              <div className="mt-5 flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin">
                <div>
                  <div className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                    Lessons
                  </div>

                  {loading ? (
                    <div className={`rounded-xl border px-3 py-4 text-xs ${isDark ? "border-white/10 bg-white/5 text-zinc-300" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                      Loading lessons...
                    </div>
                  ) : lessonOptions.length === 0 ? (
                    <div className={`rounded-xl border px-3 py-4 text-xs ${isDark ? "border-white/10 bg-white/5 text-zinc-300" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                      No lessons found.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {lessonOptions.map((lesson) => {
                        const active = selectedLessonTopic === lesson.topic;
                        return (
                          <button
                            key={lesson.topic}
                            type="button"
                            onClick={() => selectLesson(lesson.topic)}
                            className={`rounded-xl border p-3 text-left transition ${
                              active
                                ? isDark
                                  ? "border-accentGreen bg-[#123428] text-white"
                                  : "border-brandGreen bg-brandGreen text-white"
                                : isDark
                                  ? "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                            title={`${lesson.quizCount} quiz(es)`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-xs font-semibold leading-tight">{lesson.topic}</div>
                              <div className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? (isDark ? "bg-accentGreen/20 text-white" : "bg-brandGreen/20 text-white") : isDark ? "bg-white/10 text-zinc-200" : "bg-gray-100 text-gray-700"}`}>
                                {lesson.quizCount}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedLessonTopic && (
                  loading ? null : filteredAssessments.length === 0 ? (
                    <div className={`rounded-xl border px-3 py-4 text-xs ${isDark ? "border-white/10 bg-white/5 text-zinc-300" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                      No quizzes found.
                    </div>
                  ) : (
                    <div className="pb-4">
                      <div className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                        Quizzes
                      </div>
                      <div className="space-y-2">
                        {filteredAssessments.map((assessment) => {
                          const isSelected = selectedQuiz?.id === assessment.id;
                          const progress = progressByQuizId[assessment.id];
                          const isCompleted = Boolean(progress?.completed);

                          return (
                            <button
                              key={assessment.id}
                              type="button"
                              onClick={() => openQuiz(assessment)}
                              className={`w-full rounded-2xl border p-4 text-left transition ${
                                isSelected
                                  ? isDark
                                    ? "border-accentGreen bg-[#123428]"
                                    : "border-brandGreen bg-brandGreen/5"
                                  : isDark
                                    ? "border-white/10 bg-white/5 hover:bg-white/10"
                                    : "border-gray-200 bg-white hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold">{assessment.title}</div>
                                  <div className={`mt-0.5 text-xs ${isDark ? "text-zinc-400" : "text-gray-500"}`}>{assessment.topic}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isCompleted && (
                                    <div className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isDark ? "bg-accentGreen/20 text-accentGreen" : "bg-green-100 text-green-700"}`}>
                                      Completed
                                    </div>
                                  )}
                                  <div className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${assessment.status.toLowerCase().includes("draft") ? "bg-yellow-100 text-yellow-800" : isDark ? "bg-white/10 text-zinc-200" : "bg-blue-100 text-blue-800"}`}>
                                    {assessment.status}
                                  </div>
                                </div>
                              </div>

                              <div className={`mt-3 flex items-center gap-4 text-xs ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                                <div className="flex items-center gap-1.5">
                                  <ClipboardList size={14} className="text-[#9DE16A]" />
                                  <span>{assessment.total_questions} Qs</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock3 size={14} className="text-[#9DE16A]" />
                                  <span>{assessment.time_limit ? `${assessment.time_limit}m` : "No limit"}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 size={14} className={isCompleted ? "text-[#9DE16A]" : "text-zinc-400"} />
                                  <span>{isCompleted ? "Completed" : "Not completed"}</span>
                                </div>
                              </div>

                              <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold ${isDark ? "text-accentGreen" : "text-brandGreen"}`}>
                                {loadingQuizId === assessment.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                {loadingQuizId === assessment.id ? "Opening..." : isSelected ? "Open now" : "Open quiz"}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* RIGHT SIDEBAR: QUIZ AREA */}
            <section className={`flex flex-col min-h-0 rounded-[2rem] border shadow-xl ${isDark ? "border-white/10 bg-zinc-950/90" : "border-gray-200 bg-white/90"}`}>
              {!selectedQuiz ? (
                <div className="flex h-full items-center justify-center p-8">
                  <div className="max-w-sm text-center">
                    <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${isDark ? "bg-white/10" : "bg-textGreen/10"}`}>
                      <ClipboardList size={24} className={isDark ? "text-accentGreen" : "text-textGreen"} />
                    </div>
                    <h2 className="text-xl font-bold">Choose a quiz to begin</h2>
                    <p className={`mt-2 text-sm ${isDark ? "text-zinc-400" : "text-gray-600"}`}>
                      {selectedLessonTopic ? `Pick a quiz under "${selectedLessonTopic}" to start.` : "Pick a lesson on the left to unlock quizzes."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col min-h-0">
                  {/* HEADER */}
                  <div className={`shrink-0 border-b px-5 py-4 lg:px-6 ${isDark ? "border-white/10" : "border-gray-200"}`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className={`mb-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${isDark ? "bg-white/10 text-zinc-200" : "bg-brandGreen/10 text-brandGreen"}`}>
                          {selectedQuiz.topic}
                        </div>
                        <h2 className="text-2xl font-bold">{selectedQuiz.title}</h2>
                        <p className={`mt-1 text-xs ${isDark ? "text-zinc-400" : "text-gray-600"}`}>
                          {answeredCount} of {selectedQuiz.total_questions} questions answered
                        </p>
                        <p className={`mt-1 text-xs font-semibold ${progressByQuizId[selectedQuiz.id]?.completed ? (isDark ? "text-accentGreen" : "text-green-700") : isDark ? "text-zinc-400" : "text-gray-600"}`}>
                          {progressByQuizId[selectedQuiz.id]?.completed ? "Status: Completed" : "Status: Not completed"}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className={`rounded-xl px-3 py-2 text-center ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                          <div className={`text-[10px] uppercase tracking-[0.2em] ${isDark ? "text-zinc-500" : "text-gray-400"}`}>Qs</div>
                          <div className="mt-1 text-lg font-bold">{selectedQuiz.total_questions}</div>
                        </div>
                        <div className={`rounded-xl px-3 py-2 text-center ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                          <div className={`text-[10px] uppercase tracking-[0.2em] ${isDark ? "text-zinc-500" : "text-gray-400"}`}>Ans</div>
                          <div className="mt-1 text-lg font-bold">{answeredCount}</div>
                        </div>
                        <div className={`rounded-xl px-3 py-2 text-center ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                          <div className={`text-[10px] uppercase tracking-[0.2em] ${isDark ? "text-zinc-500" : "text-gray-400"}`}>Try</div>
                          <div className="mt-1 text-lg font-bold">{progressByQuizId[selectedQuiz.id]?.attempts ?? selectedQuiz.total_attempts}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MAIN QUIZ CONTENT */}
                  <div className="flex-1 flex min-h-0 flex-col lg:flex-row">
                    {/* QUESTION NAV SIDEBAR */}
                    <aside className={`shrink-0 border-b p-4 lg:w-48 lg:border-b-0 lg:border-r lg:overflow-y-auto ${isDark ? "border-white/10" : "border-gray-200"}`}>
                      <div className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                        Questions
                      </div>
                      <div className="grid grid-cols-5 gap-2 lg:grid-cols-3">
                        {selectedQuiz.questions.map((question, index) => {
                          const answered = Boolean(answers[question.id]);
                          const active = index === currentQuestionIndex;

                          return (
                            <button
                              key={question.id}
                              type="button"
                              onClick={() => setCurrentQuestionIndex(index)}
                              className={`flex h-10 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                                active
                                  ? isDark
                                    ? "border-accentGreen bg-[#123428] text-white"
                                    : "border-brandGreen bg-brandGreen text-white"
                                  : answered
                                    ? isDark
                                      ? "border-white/10 bg-white/10 text-zinc-100"
                                      : "border-gray-200 bg-green-50 text-green-700"
                                    : isDark
                                      ? "border-white/10 bg-transparent text-zinc-400"
                                      : "border-gray-200 bg-transparent text-gray-500"
                              }`}
                            >
                              {index + 1}
                            </button>
                          );
                        })}
                      </div>
                    </aside>

                    {/* QUESTION DISPLAY & FOOTER */}
                    <div className="flex-1 flex flex-col min-h-0 relative">
                      {/* SCROLLABLE QUESTION AREA */}
                      <div className="flex-1 overflow-y-auto px-5 py-5 lg:px-8">
                        {currentQuestion ? (
                          <div className="max-w-3xl mx-auto">
                            <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${isDark ? "bg-white/10 text-zinc-300" : "bg-gray-100 text-gray-600"}`}>
                              {answers[currentQuestion.id] ? <CheckCircle2 size={14} className="text-[#9DE16A]" /> : <Circle size={14} />}
                              Question {currentQuestionIndex + 1}
                            </div>

                            <h3 className="text-xl font-bold leading-relaxed">{currentQuestion.question_text}</h3>

                            <div className="mt-6 space-y-3">
                              {getChoices(currentQuestion).map((choice) => {
                                const selected = answers[currentQuestion.id] === choice.key;

                                return (
                                  <button
                                    key={choice.key}
                                    type="button"
                                    onClick={() => selectAnswer(currentQuestion.id, choice.key)}
                                    className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                                      selected
                                        ? isDark
                                          ? "border-accentGreen bg-[#123428]"
                                          : "border-brandGreen bg-brandGreen/5"
                                        : isDark
                                          ? "border-white/10 bg-white/5 hover:bg-white/10"
                                          : "border-gray-200 bg-white hover:bg-gray-50"
                                    }`}
                                  >
                                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                                      selected
                                        ? isDark
                                          ? "border-accentGreen bg-accentGreen text-black"
                                          : "border-brandGreen bg-brandGreen text-white"
                                        : isDark
                                          ? "border-white/15 text-zinc-400"
                                          : "border-gray-300 text-gray-500"
                                    }`}>
                                      {choice.key}
                                    </div>
                                    <div className="flex-1 text-sm leading-snug">{choice.text}</div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className={`text-sm ${isDark ? "text-zinc-400" : "text-gray-600"}`}>No questions found for this quiz.</div>
                        )}
                      </div>

                      {/* PINNED FOOTER CONTROLS */}
                      <div className={`shrink-0 flex flex-col gap-3 border-t px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8 ${isDark ? "border-white/10 bg-zinc-950" : "border-gray-200 bg-white"}`}>
                        <div className={`text-xs ${isDark ? "text-zinc-400" : "text-gray-600"}`}>
                          Review every question before submitting.
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
                            disabled={currentQuestionIndex === 0}
                            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                          >
                            <ChevronLeft size={16} />
                            Previous
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setCurrentQuestionIndex((index) =>
                                Math.min(selectedQuiz.questions.length - 1, index + 1)
                              )
                            }
                            disabled={currentQuestionIndex >= selectedQuiz.questions.length - 1}
                            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                          >
                            Next
                            <ChevronRight size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={submitQuiz}
                            disabled={submitting || selectedQuiz.questions.length === 0}
                            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              isDark ? "bg-accentGreen text-black hover:bg-[#8CD559]" : "bg-brandGreen text-white hover:bg-brandGreen/90"
                            }`}
                          >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {submitting ? "Submitting..." : "Submit Quiz"}
                          </button>
                        </div>
                      </div>

                      {/* RESULT NOTIFICATION (Overlays on bottom if present) */}
                      {result && (
                        <div className={`absolute bottom-20 left-6 right-6 lg:left-8 lg:right-8 rounded-2xl border p-4 shadow-2xl ${isDark ? "border-white/10 bg-zinc-900" : "border-gray-200 bg-white"}`}>
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 text-[#9DE16A]" size={18} />
                            <div>
                              <h4 className="text-base font-bold">Submission recorded</h4>
                              <div className={`mt-1 text-xs leading-relaxed ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                                <div>Answered: {result.answered_count} of {result.total_questions}</div>
                                {typeof result.correct_count === "number" && <div>Correct: {result.correct_count}</div>}
                                {typeof result.score_percent === "number" && <div>Score: {result.score_percent}%</div>}
                                {result.submitted_offline && (
                                  <div className="mt-1 text-yellow-500">Answers captured locally (backend unavailable).</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}