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
        setAssessments(items.map(mapAssessment));
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
    // Quizzes remain hidden until the user picks a lesson tile.
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

      const res = await fetch(`${baseUrl}/quizzes/${selectedQuiz.id}/submit/`, {
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
    <div className="min-h-screen flex">
      <main className={`flex-1 p-6 lg:p-10 relative overflow-hidden ${isDark ? "text-white" : "text-black"}`}>
        <div className="absolute inset-0 z-0">
          <Image
            src={isDark ? chatBgDark : chatBgLight}
            alt="background"
            fill
            className="object-cover opacity-95"
          />
        </div>

        <div className="relative z-10">
          <TopBar searchValue={query} onSearch={setQuery} />

          <div className="mt-6 flex flex-col gap-6 xl:grid xl:grid-cols-[380px_minmax(0,1fr)]">
            <section className={`rounded-[2rem] border p-6 shadow-xl ${isDark ? "border-white/10 bg-zinc-950/85" : "border-gray-200 bg-white/90"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Assessments</h1>
                  <p className={`mt-2 text-sm ${isDark ? "text-zinc-400" : "text-gray-600"}`}>
                    Pick a lesson first, then choose a quiz to start.
                  </p>
                </div>
                <div className={`rounded-full px-4 py-2 text-sm font-semibold bg-textGreen/60 text-white ${isDark ? "bg-white/10 text-zinc-200" : "bg-brandGreen/10 text-brandGreen"}`}>
                  {selectedLessonTopic ? `${filteredAssessments.length} quizzes` : `${lessonOptions.length} lessons`}
                </div>
              </div>

              {quizError && (
                <div className={`mt-5 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${isDark ? "bg-red-500/10 text-red-200" : "bg-red-50 text-red-700"}`}>
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{quizError}</span>
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div>
                  <div className={`mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                    Lessons
                  </div>

                  {loading ? (
                    <div className={`rounded-2xl border px-4 py-6 text-sm ${isDark ? "border-white/10 bg-white/5 text-zinc-300" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                      Loading lessons and quizzes...
                    </div>
                  ) : lessonOptions.length === 0 ? (
                    <div className={`rounded-2xl border px-4 py-6 text-sm ${isDark ? "border-white/10 bg-white/5 text-zinc-300" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                      No lessons found.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {lessonOptions.map((lesson) => {
                        const active = selectedLessonTopic === lesson.topic;
                        return (
                          <button
                            key={lesson.topic}
                            type="button"
                            onClick={() => selectLesson(lesson.topic)}
                            className={`rounded-2xl border p-4 text-left transition ${
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
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-sm font-semibold leading-5">{lesson.topic}</div>
                              <div className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? (isDark ? "bg-accentGreen/20 text-white" : "bg-brandGreen/20 text-white") : isDark ? "bg-white/10 text-zinc-200" : "bg-gray-100 text-gray-700"}`}>
                                {lesson.quizCount}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedLessonTopic ? (
                  loading ? null : filteredAssessments.length === 0 ? (
                    <div className={`rounded-2xl border px-4 py-6 text-sm ${isDark ? "border-white/10 bg-white/5 text-zinc-300" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                      No quizzes found for this lesson.
                    </div>
                  ) : (
                    <>
                      <div className={`mb-1 text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                        Quizzes
                      </div>
                      {filteredAssessments.map((assessment) => {
                        const isSelected = selectedQuiz?.id === assessment.id;

                        return (
                          <button
                            key={assessment.id}
                            type="button"
                            onClick={() => openQuiz(assessment)}
                            className={`w-full rounded-3xl border p-5 text-left transition ${
                              isSelected
                                ? isDark
                                  ? "border-accentGreen bg-[#123428]"
                                  : "border-brandGreen bg-brandGreen/5"
                                : isDark
                                  ? "border-white/10 bg-white/5 hover:bg-white/10"
                                  : "border-gray-200 bg-white hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-lg font-semibold">{assessment.title}</div>
                                <div className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>{assessment.topic}</div>
                              </div>
                              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${assessment.status.toLowerCase().includes("draft") ? "bg-yellow-100 text-yellow-800" : isDark ? "bg-white/10 text-zinc-200" : "bg-blue-100 text-blue-800"}`}>
                                {assessment.status}
                              </div>
                            </div>

                            <div className={`mt-4 grid grid-cols-2 gap-3 text-sm ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                              <div className="flex items-center gap-2">
                                <ClipboardList size={16} className="text-[#9DE16A]" />
                                <span>{assessment.total_questions} Questions</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock3 size={16} className="text-[#9DE16A]" />
                                <span>{assessment.time_limit ? `${assessment.time_limit} mins` : "No limit"}</span>
                              </div>
                            </div>

                            <div className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold ${isDark ? "text-accentGreen" : "text-brandGreen"}`}>
                              {loadingQuizId === assessment.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                              {loadingQuizId === assessment.id ? "Opening..." : isSelected ? "Open now" : "Open quiz"}
                            </div>
                          </button>
                        );
                      })}
                    </>
                  )
                ) : (
                  <div className={`rounded-2xl border px-4 py-6 text-sm ${isDark ? "border-white/10 bg-white/5 text-zinc-300" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                    Select a lesson tile to see the quizzes.
                  </div>
                )}
              </div>
            </section>

            <section className={`min-h-[720px] rounded-[2rem] border shadow-xl ${isDark ? "border-white/10 bg-zinc-950/90" : "border-gray-200 bg-white/90"}`}>
              {!selectedQuiz ? (
                <div className="flex h-full min-h-[720px] items-center justify-center p-10">
                  <div className="max-w-md text-center">
                    <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${isDark ? "bg-white/10" : "bg-textGreen/10"}`}>
                      <ClipboardList size={28} className={isDark ? "text-accentGreen" : "text-textGreen"} />
                    </div>
                    <h2 className="text-2xl font-bold">Choose a quiz to begin</h2>
                    <p className={`mt-3 text-sm leading-7 ${isDark ? "text-zinc-400" : "text-gray-600"}`}>
                      {selectedLessonTopic ? `Pick a quiz under "${selectedLessonTopic}" to start.` : "Pick a lesson on the left to unlock quizzes."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[720px] flex-col">
                  <div className={`border-b px-6 py-6 lg:px-8 ${isDark ? "border-white/10" : "border-gray-200"}`}>
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${isDark ? "bg-white/10 text-zinc-200" : "bg-brandGreen/10 text-brandGreen"}`}>
                          {selectedQuiz.topic}
                        </div>
                        <h2 className="text-3xl font-bold">{selectedQuiz.title}</h2>
                        <p className={`mt-3 text-sm ${isDark ? "text-zinc-400" : "text-gray-600"}`}>
                          {answeredCount} of {selectedQuiz.total_questions} questions answered
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className={`rounded-2xl px-4 py-3 text-center ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                          <div className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-zinc-500" : "text-gray-400"}`}>Questions</div>
                          <div className="mt-2 text-xl font-bold">{selectedQuiz.total_questions}</div>
                        </div>
                        <div className={`rounded-2xl px-4 py-3 text-center ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                          <div className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-zinc-500" : "text-gray-400"}`}>Answered</div>
                          <div className="mt-2 text-xl font-bold">{answeredCount}</div>
                        </div>
                        <div className={`rounded-2xl px-4 py-3 text-center ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                          <div className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-zinc-500" : "text-gray-400"}`}>Attempts</div>
                          <div className="mt-2 text-xl font-bold">{selectedQuiz.total_attempts}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid min-h-0 flex-1 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <aside className={`border-b p-5 lg:border-b-0 lg:border-r ${isDark ? "border-white/10" : "border-gray-200"}`}>
                      <div className={`mb-4 text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
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
                              className={`flex h-12 items-center justify-center rounded-2xl border text-sm font-semibold transition ${
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

                    <div className="min-h-0 flex flex-col">
                      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 lg:px-8">
                        {currentQuestion ? (
                          <div className="max-w-3xl">
                            <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${isDark ? "bg-white/10 text-zinc-300" : "bg-gray-100 text-gray-600"}`}>
                              {answers[currentQuestion.id] ? <CheckCircle2 size={16} className="text-[#9DE16A]" /> : <Circle size={16} />}
                              Question {currentQuestionIndex + 1}
                            </div>

                            <h3 className="text-2xl font-bold leading-relaxed">{currentQuestion.question_text}</h3>

                            <div className="mt-8 space-y-4">
                              {getChoices(currentQuestion).map((choice) => {
                                const selected = answers[currentQuestion.id] === choice.key;

                                return (
                                  <button
                                    key={choice.key}
                                    type="button"
                                    onClick={() => selectAnswer(currentQuestion.id, choice.key)}
                                    className={`flex w-full items-start gap-4 rounded-3xl border p-5 text-left transition ${
                                      selected
                                        ? isDark
                                          ? "border-accentGreen bg-[#123428]"
                                          : "border-brandGreen bg-brandGreen/5"
                                        : isDark
                                          ? "border-white/10 bg-white/5 hover:bg-white/10"
                                          : "border-gray-200 bg-white hover:bg-gray-50"
                                    }`}
                                  >
                                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
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
                                    <div className="flex-1 text-base leading-7">{choice.text}</div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className={`text-sm ${isDark ? "text-zinc-400" : "text-gray-600"}`}>No questions found for this quiz.</div>
                        )}
                      </div>

                      <div className={`flex flex-col gap-4 border-t px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8 ${isDark ? "border-white/10" : "border-gray-200"}`}>
                        <div className={`text-sm ${isDark ? "text-zinc-400" : "text-gray-600"}`}>
                          Review every question before submitting.
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
                            disabled={currentQuestionIndex === 0}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-700"}`}
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
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-700"}`}
                          >
                            Next
                            <ChevronRight size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={submitQuiz}
                            disabled={submitting || selectedQuiz.questions.length === 0}
                            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                              isDark ? "bg-accentGreen text-black" : "bg-brandGreen text-white"
                            }`}
                          >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {submitting ? "Submitting..." : "Submit Quiz"}
                          </button>
                        </div>
                      </div>

                      {result && (
                        <div className={`m-6 mt-0 rounded-3xl border p-5 lg:mx-8 ${isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-1 text-[#9DE16A]" size={20} />
                            <div>
                              <h4 className="text-lg font-bold">Submission recorded</h4>
                              <div className={`mt-2 text-sm leading-7 ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                                <div>Answered: {result.answered_count} of {result.total_questions}</div>
                                {typeof result.correct_count === "number" && <div>Correct: {result.correct_count}</div>}
                                {typeof result.score_percent === "number" && <div>Score: {result.score_percent}%</div>}
                                {result.submitted_offline && (
                                  <div>The frontend captured your answers, but the backend did not confirm the submission.</div>
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
