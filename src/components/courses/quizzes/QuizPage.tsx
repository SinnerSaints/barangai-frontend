"use client";

import Image from "next/image";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { useState } from "react";
import chatBgLight from "@/assets/img/chatBotBg-white.png";
import chatBgDark from "@/assets/img/chatBotBg-black.png";
import { useTheme } from "@/context/theme";

interface Assessment {
  id: number;
  title: string;
  due: string;
  status: string;
  quizId?: number;
}

interface Question {
  id: number;
  question_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
}

interface Quiz {
  id: number;
  title: string;
  questions?: Question[];
}

interface QuizResult {
  total_questions: number;
  correct_count: number;
  score_percent: number;
}

export default function QuizPage() {
  const [assessments] = useState<Assessment[]>([
    { id: 1, title: "Community Needs Assessment", due: "2026-03-10", status: "Open", quizId: 1 },
    { id: 2, title: "Volunteer Skills Check", due: "2026-04-01", status: "Draft", quizId: 2 },
  ]);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [loadingQuizId, setLoadingQuizId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Fetch quiz
  const fetchQuizById = async (quizId?: number) => {
    if (!quizId) return;
    setLoadingQuizId(quizId);
    setQuizError(null);
    setResult(null);
    setAnswers({});

    try {
      const res = await fetch(`/api/quizzes/${quizId}/`);
      if (!res.ok) throw new Error(`Failed to fetch quiz ${quizId}`);
      const data = await res.json();
      setQuiz(data);
    } catch (err: any) {
      setQuizError(err.message || "Failed to load quiz.");
    } finally {
      setLoadingQuizId(null);
    }
  };

  // Submit quiz
  const submitQuiz = async () => {
    if (!quiz) return;
    setSubmitting(true);
    setQuizError(null);

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: Number(questionId),
        answer,
      }));

      const res = await fetch(`/api/progress/submit/${quiz.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      if (!res.ok) throw new Error("Failed to submit quiz.");

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setQuizError(err.message || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  // Render single question
  const renderQuestion = (q: Question) => (
    <div key={q.id} className="p-4 border rounded mb-4">
      <div className="font-semibold mb-2">{q.question_text}</div>

      <div className="flex flex-col gap-2 mt-2">
        {(["A", "B", "C", "D"] as const).map((choice) => (
          <label key={choice} className="flex items-center gap-2">
            <input
              type="radio"
              name={`q-${q.id}`}
              value={choice}
              checked={answers[q.id] === choice}
              onChange={() => setAnswers({ ...answers, [q.id]: choice })}
            />
            {choice === "A" && q.choice_a}
            {choice === "B" && q.choice_b}
            {choice === "C" && q.choice_c}
            {choice === "D" && q.choice_d}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className={`flex-1 p-6 relative overflow-hidden ${isDark ? "text-white" : "text-black"}`}>
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src={isDark ? chatBgDark : chatBgLight}
            alt="background"
            fill
            className="object-cover opacity-95"
          />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <TopBar />
          <h1 className="text-2xl font-bold mt-6">Assessments</h1>

          {/* Assessments List */}
          <div className="mt-4 grid gap-4">
            {assessments.map((a) => (
              <div
                key={a.id}
                className={`rounded p-4 flex justify-between items-center ${
                  isDark ? "bg-white/5" : "bg-white/90"
                } shadow-md`}
              >
                <div>
                  <div className={isDark ? "font-semibold text-white" : "font-semibold text-gray-900"}>
                    {a.title}
                  </div>
                  <div className={isDark ? "text-sm text-gray-400" : "text-sm text-gray-700"}>
                    Due: {a.due}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`${
                      isDark
                        ? "text-sm px-3 py-1 rounded bg-white/10"
                        : "text-sm px-3 py-1 rounded bg-gray-100 text-gray-800"
                    }`}
                  >
                    {a.status}
                  </div>
                  {a.quizId && (
                    <button
                      onClick={() => fetchQuizById(a.quizId)}
                      className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                      disabled={loadingQuizId === a.quizId}
                    >
                      {loadingQuizId === a.quizId ? "Loading…" : "Open"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quiz Panel */}
          {quiz && (
            <div className={`mt-6 p-6 rounded shadow-md ${isDark ? "bg-white/10" : "bg-white/95"}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">{quiz.title}</h2>
                  <div className="text-sm text-gray-400">Questions: {quiz.questions?.length ?? 0}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setQuiz(null);
                      setAnswers({});
                      setResult(null);
                      setQuizError(null);
                    }}
                    className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    Close
                  </button>
                  <button
                    onClick={submitQuiz}
                    disabled={submitting}
                    className="text-sm px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                  >
                    {submitting ? "Submitting…" : "Submit"}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                {quiz.questions?.length === 0 && <div>No questions found for this quiz.</div>}
                {quiz.questions?.map(renderQuestion)}
              </div>

              {quizError && <div className="mt-4 text-red-500">Error: {quizError}</div>}

              {result && (
                <div className="mt-4 p-4 rounded border bg-gray-50 text-gray-900">
                  <div className="text-lg font-semibold">Result</div>
                  <div>Total questions: {result.total_questions}</div>
                  <div>Correct: {result.correct_count}</div>
                  <div>Score: {result.score_percent}%</div>
                </div>
              )}
            </div>
          )}

          {/* Global Quiz Error */}
          {quizError && !quiz && (
            <div className="mt-6 p-4 rounded bg-red-50 text-red-700">{quizError}</div>
          )}
        </div>
      </main>
    </div>
  );
}