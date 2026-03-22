"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import {
  type AssessmentCategory,
  type AssessmentQuestion,
  fetchPrimaryAdminAssessment,
  patchAdminAssessment,
} from "@/lib/preAssessment";

const CATEGORY_OPTIONS: { value: AssessmentCategory; label: string }[] = [
  { value: "basic_computer", label: "Basic Computer Skills" },
  { value: "document_processing", label: "Document Processing" },
  { value: "spreadsheet", label: "Spreadsheet Skills" },
  { value: "email_communication", label: "Email and Communication" },
  { value: "internet_platforms", label: "Internet and Online Platforms" },
];

export default function PreAssessmentEditor() {
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const assessment = await fetchPrimaryAdminAssessment();
      setAssessmentId(assessment.id);
      setQuestions(assessment.questions);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not load questions.");
      setAssessmentId(null);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateLocal = (id: number, patch: Partial<AssessmentQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const handleSave = async (q: AssessmentQuestion) => {
    if (assessmentId == null) return;
    try {
      setSavingId(q.id);
      setError("");
      // Django admin serializer replaces questions from this array — send every row.
      const updated = await patchAdminAssessment(assessmentId, {
        questions: questions.map((row) => ({
          id: row.id,
          question_text: row.question_text,
          category: row.category,
          order: row.order,
        })),
      });
      setAssessmentId(updated.id);
      setQuestions(updated.questions);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] p-6 text-white md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/assessments"
              className="mb-3 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to pre-assessment
            </Link>
            <h1 className="text-2xl font-bold md:text-3xl">Edit pre-assessment questions</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Saves use PATCH{" "}
              <code className="rounded bg-white/10 px-1 py-0.5 text-xs">
                assessments/list-assessment/&lt;id&gt;/
              </code>{" "}
              with the full question list (required by the admin serializer).
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading questions…
          </div>
        ) : questions.length === 0 ? (
          <p className="text-zinc-400">No questions returned. Confirm the admin list endpoint and permissions.</p>
        ) : (
          <ul className="space-y-6">
            {questions.map((q) => (
              <li
                key={q.id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Question #{q.id}
                  </span>
                  <button
                    type="button"
                    disabled={savingId === q.id || assessmentId == null}
                    onClick={() => void handleSave(q)}
                    className="inline-flex items-center gap-2 rounded-full bg-accentGreen px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                  >
                    {savingId === q.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </button>
                </div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500">Statement</label>
                <textarea
                  value={q.question_text}
                  onChange={(e) => updateLocal(q.id, { question_text: e.target.value })}
                  rows={3}
                  className="mt-1 w-full resize-y rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-accentGreen/50 focus:outline-none"
                />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500">Category</label>
                    <select
                      value={q.category}
                      onChange={(e) =>
                        updateLocal(q.id, { category: e.target.value as AssessmentCategory })
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accentGreen/50 focus:outline-none"
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500">Order</label>
                    <input
                      type="number"
                      min={1}
                      value={q.order}
                      onChange={(e) => updateLocal(q.id, { order: Number(e.target.value) || 0 })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accentGreen/50 focus:outline-none"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
