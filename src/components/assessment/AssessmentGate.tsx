"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, LockKeyhole, Loader2 } from "lucide-react";
import { fetchAssessmentStatus, formatProficiencyLevel } from "@/lib/preAssessment";
import { useTheme } from "@/context/theme";

type Props = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export default function AssessmentGate({ title, description, children }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [proficiencyLevel, setProficiencyLevel] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStatus = async () => {
      try {
        setLoading(true);
        setError("");
        const status = await fetchAssessmentStatus(false);
        setCompleted(Boolean(status.completed));
        setProficiencyLevel(status.proficiency_level);
      } catch (err) {
        console.error(err);
        setError("Unable to verify your pre-assessment status right now.");
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className={`inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-medium ${isDark ? "bg-white/10 text-white" : "bg-white/90 text-[#034440]"}`}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking pre-assessment access...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section className={`mx-auto mt-10 max-w-3xl rounded-[2rem] border p-8 shadow-xl ${isDark ? "border-white/10 bg-zinc-950/85 text-white" : "border-gray-200 bg-white/90 text-[#034440]"}`}>
        <div className="flex items-start gap-4">
          <AlertCircle className="mt-1 h-6 w-6 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className={`mt-3 ${isDark ? "text-zinc-300" : "text-gray-600"}`}>{error}</p>
            <p className={`mt-2 text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>{description}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!completed) {
    return (
      <section className={`mx-auto mt-10 max-w-3xl rounded-[2rem] border p-8 shadow-xl ${isDark ? "border-white/10 bg-zinc-950/85 text-white" : "border-gray-200 bg-white/90 text-[#034440]"}`}>
        <div className="flex items-start gap-4">
          <div className={`rounded-2xl p-3 ${isDark ? "bg-white/10" : "bg-brandGreen/10"}`}>
            <LockKeyhole className="h-7 w-7 text-brandGreen" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className={`mt-3 ${isDark ? "text-zinc-300" : "text-gray-600"}`}>{description}</p>
            <p className={`mt-3 text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
              Complete the pre-assessment to unlock courses and quizzes. Your digital literacy score will be used to set your starting proficiency level.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/assessments"
                className={`rounded-full px-5 py-2.5 text-sm font-semibold ${isDark ? "bg-accentGreen text-black" : "bg-brandGreen text-white"}`}
              >
                Take the Assessment
              </Link>
              <Link
                href="/dashboard"
                className={`rounded-full px-5 py-2.5 text-sm font-semibold ${isDark ? "bg-white/10 text-zinc-200" : "bg-gray-100 text-gray-700"}`}
              >
                Back to Dashboard
              </Link>
              <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm ${isDark ? "bg-white/10 text-zinc-300" : "bg-gray-100 text-gray-600"}`}>
                Status: {formatProficiencyLevel(proficiencyLevel)}
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
