"use client";

import Image from "next/image";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { useState, useEffect } from "react";
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
  correct_choice?: string;
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
  per_question?: Record<number, boolean>;
}

export default function AssessmentsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loadingQuizId, setLoadingQuizId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("/api/assessments/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        let data: Assessment[] = [];
        if (res.ok) data = await res.json();
        if (!data.length) {
          data = [
            { id: 1, title: "Community Needs Assessment", due: "2026-03-10", status: "Open", quizId: 1 },
            { id: 2, title: "Volunteer Skills Check", due: "2026-04-01", status: "Draft", quizId: 2 },
          ];
        }
        setAssessments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, []);

  const fetchQuizById = async (quizId?: number) => {
    if (!quizId) return;
    setLoadingQuizId(quizId);
    setQuizError(null);
    setResult(null);
    setAnswers({});
    setCurrentIndex(0);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/quizzes/${quizId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch quiz ${quizId}`);
      const data = await res.json();
      setQuiz(data);
    } catch (err: any) {
      setQuizError(err.message || "Failed to load quiz.");
    } finally {
      setLoadingQuizId(null);
    }
  };

  const handleSelectAnswer = (choice: string, questionId: number) => {
    setAnswers({ ...answers, [questionId]: choice });
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    setSubmitting(true);
    setQuizError(null);

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: Number(questionId),
        answer,
      }));

      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/progress/submit/${quiz.id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      if (!res.ok) throw new Error("Failed to submit quiz.");
      const data: QuizResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setQuizError(err.message || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-brandGreen font-bold text-center">Loading Assessments...</div>;

  const currentQuestion = quiz?.questions?.[currentIndex];

  const getChoiceStyle = (q: Question, choice: string) => {
    if (result && result.per_question) {
      const correct = q.correct_choice;
      const userAnswer = answers[q.id];
      if (userAnswer === choice) {
        if (userAnswer === correct) return "bg-green-600 text-white border-green-600";
        return "bg-red-600 text-white border-red-600";
      }
      if (choice === correct) return "bg-green-400 text-white border-green-400";
    }
    return "";
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className={`flex-1 p-6 relative overflow-hidden ${isDark ? "text-white" : "text-black"}`}>
        <div className="absolute inset-0 z-0">
          <Image
            src={isDark ? chatBgDark : chatBgLight}
            alt="background"
            fill
            className="object-cover opacity-90"
          />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <TopBar />
          <h1 className="text-3xl font-extrabold mt-6 mb-4 text-transparent bg-clip-text bg-gradient-to-r from-brandGreen to-accentGreen">
            Assessments
          </h1>

          {/* Assessments List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            {assessments.map((a) => (
              <div
                key={a.id}
                className={`rounded-3xl p-6 shadow-lg transform transition hover:scale-105 hover:shadow-2xl ${
                  isDark ? "bg-zinc-900 border border-white/10" : "bg-white border border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="font-bold text-lg">{a.title}</h2>
                    <p className="text-sm text-gray-400">Due: {a.due}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${a.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{a.status}</span>
                    {a.quizId && (
                      <button
                        onClick={() => fetchQuizById(a.quizId)}
                        className="px-3 py-1 rounded-full bg-brandGreen text-white font-semibold hover:bg-green-700 transition"
                      >
                        Open
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quiz Card */}
          {quiz && currentQuestion && (
            <div
              className={`p-6 rounded-3xl shadow-2xl backdrop-blur-md ${
                isDark ? "bg-zinc-900 border border-white/10" : "bg-white border border-gray-200"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{quiz.title}</h2>
                <span className="text-sm text-gray-400">
                  {currentIndex + 1}/{quiz.questions?.length}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-300 rounded-full mb-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brandGreen to-accentGreen transition-all duration-500"
                  style={{ width: `${((currentIndex + 1) / (quiz.questions?.length || 1)) * 100}%` }}
                />
              </div>

              {/* Question */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-4">{currentQuestion.question_text}</h3>
                <div className="grid grid-cols-1 gap-4">
                  {(["A","B","C","D"] as const).map((choice) => {
                    const text =
                      choice === "A" ? currentQuestion.choice_a :
                      choice === "B" ? currentQuestion.choice_b :
                      choice === "C" ? currentQuestion.choice_c :
                      currentQuestion.choice_d;

                    const selected = answers[currentQuestion.id] === choice;
                    const choiceClasses = getChoiceStyle(currentQuestion, choice);

                    return (
                      <button
                        key={choice}
                        onClick={() => !result && handleSelectAnswer(choice, currentQuestion.id)}
                        className={`w-full text-left p-4 rounded-xl border shadow-sm transition transform hover:scale-105 font-medium ${
                          choiceClasses || (selected ? "border-brandGreen" : isDark ? "bg-zinc-800 text-white border-white/10" : "bg-white text-black border-gray-300")
                        }`}
                      >
                        {choice}. {text}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                  disabled={currentIndex === 0}
                  className="px-5 py-2 rounded-xl bg-gray-300 hover:bg-gray-400 disabled:opacity-50 transition"
                >
                  Previous
                </button>

                {currentIndex < (quiz.questions!.length - 1) ? (
                  <button
                    onClick={() => setCurrentIndex((i) => i + 1)}
                    disabled={!answers[currentQuestion.id]}
                    className="px-5 py-2 rounded-xl bg-brandGreen text-white hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={submitQuiz}
                    disabled={submitting || !answers[currentQuestion.id]}
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {submitting ? "Submitting…" : "Submit Quiz"}
                  </button>
                )}
              </div>

              {quizError && <div className="mt-4 text-red-500">{quizError}</div>}
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div
              className={`p-6 mt-6 rounded-3xl shadow-2xl backdrop-blur-md text-center ${
                isDark ? "bg-zinc-900 border border-white/10" : "bg-white border border-gray-200"
              }`}
            >
              <h2 className="text-2xl font-bold mb-4">Quiz Result</h2>
              <div className="text-lg mb-2">Score: <span className="font-extrabold">{result.score_percent}%</span></div>
              <div className="mb-4">Correct: {result.correct_count} / {result.total_questions}</div>
              <button
                className="mt-4 px-6 py-2 rounded-xl bg-brandGreen text-white font-semibold hover:bg-green-700 transition"
                onClick={() => { setQuiz(null); setResult(null); setAnswers({}); setCurrentIndex(0); }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}