"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Save } from "lucide-react";
import {
  type AdminAssessment,
  type AssessmentCategory,
  type AssessmentQuestion,
  createAdminAssessment,
  fetchAdminAssessmentById,
  fetchAdminAssessments,
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [assessmentList, setAssessmentList] = useState<AdminAssessment[]>([]);
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const loadList = useCallback(async () => {
    try {
      setListLoading(true);
      setError("");
      const list = await fetchAdminAssessments();
      setAssessmentList(list);
      return list;
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not load assessments.");
      setAssessmentList([]);
      return [];
    } finally {
      setListLoading(false);
    }
  }, []);

  const selectAssessmentId = useCallback(
    (id: number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id == null) {
        params.delete("id");
      } else {
        params.set("id", String(id));
      }
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const loadDetail = useCallback(async (id: number) => {
    try {
      setDetailLoading(true);
      setError("");
      const assessment = await fetchAdminAssessmentById(id);
      setAssessmentId(assessment.id);
      setTitle(assessment.title);
      setDescription(assessment.description ?? "");
      setQuestions(assessment.questions);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not load assessment.");
      setAssessmentId(null);
      setTitle("");
      setDescription("");
      setQuestions([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (listLoading) return;

    const paramId = searchParams.get("id");
    const parsed = paramId ? Number(paramId) : NaN;
    const validInList =
      Number.isFinite(parsed) && assessmentList.some((a) => a.id === parsed);

    if (validInList) {
      void loadDetail(parsed);
      return;
    }

    if (paramId && !validInList) {
      selectAssessmentId(null);
    }

    if (assessmentList.length > 0 && !paramId) {
      selectAssessmentId(assessmentList[0].id);
      return;
    }

    setAssessmentId(null);
    setTitle("");
    setDescription("");
    setQuestions([]);
  }, [listLoading, searchParams, assessmentList, loadDetail, selectAssessmentId]);

  const updateLocal = (id: number, patch: Partial<AssessmentQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const handleSaveAssessment = async () => {
    if (assessmentId == null) return;
    try {
      setSaving(true);
      setError("");
      const updated = await patchAdminAssessment(assessmentId, {
        title,
        description,
        questions: questions.map((row) => ({
          id: row.id,
          question_text: row.question_text,
          category: row.category,
          order: row.order,
        })),
      });
      setAssessmentId(updated.id);
      setTitle(updated.title);
      setDescription(updated.description ?? "");
      setQuestions(updated.questions);
      const list = await fetchAdminAssessments();
      setAssessmentList(list);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    const t = createTitle.trim();
    if (!t) {
      setError("Title is required.");
      return;
    }
    try {
      setCreating(true);
      setError("");
      const created = await createAdminAssessment({
        title: t,
        description: createDescription.trim() || undefined,
      });
      const list = await fetchAdminAssessments();
      setAssessmentList(list);
      setShowCreate(false);
      setCreateTitle("");
      setCreateDescription("");
      selectAssessmentId(created.id);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not create assessment.");
    } finally {
      setCreating(false);
    }
  };

  const selectedIdFromUrl = searchParams.get("id");
  const selectedNumeric = selectedIdFromUrl ? Number(selectedIdFromUrl) : NaN;

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
            <h1 className="text-2xl font-bold md:text-3xl">Edit pre-assessments</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Choose an assessment or create one. Saves use PATCH{" "}
              <code className="rounded bg-white/10 px-1 py-0.5 text-xs">
                assessments/list-assessment/&lt;id&gt;/
              </code>{" "}
              with title, description, and the full question list.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="min-w-[200px] flex-1">
            <label className="block text-xs uppercase tracking-widest text-zinc-500">Assessment</label>
            <select
              value={Number.isFinite(selectedNumeric) ? selectedNumeric : ""}
              onChange={(e) => {
                const v = e.target.value;
                selectAssessmentId(v ? Number(v) : null);
              }}
              disabled={listLoading || assessmentList.length === 0}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accentGreen/50 focus:outline-none disabled:opacity-50"
            >
              {assessmentList.length === 0 ? (
                <option value="">No assessments</option>
              ) : (
                assessmentList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} (#{a.id})
                  </option>
                ))
              )}
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowCreate(true);
              setError("");
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Plus className="h-4 w-4" />
            Add assessment
          </button>
        </div>

        {showCreate && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-assessment-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-xl">
              <h2 id="create-assessment-title" className="text-lg font-semibold">
                New assessment
              </h2>
              <p className="mt-1 text-sm text-zinc-400">POST to assessments/create/</p>
              <label className="mt-4 block text-xs uppercase tracking-widest text-zinc-500">Title</label>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accentGreen/50 focus:outline-none"
                placeholder="e.g. Spring 2025 intake"
              />
              <label className="mt-4 block text-xs uppercase tracking-widest text-zinc-500">Description</label>
              <textarea
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full resize-y rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accentGreen/50 focus:outline-none"
                placeholder="Optional"
              />
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => {
                    setShowCreate(false);
                    setCreateTitle("");
                    setCreateDescription("");
                  }}
                  className="rounded-full px-4 py-2 text-sm text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => void handleCreate()}
                  className="inline-flex items-center gap-2 rounded-full bg-accentGreen px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {listLoading ? (
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading assessments…
          </div>
        ) : assessmentList.length === 0 ? (
          <p className="text-zinc-400">
            No assessments yet. Use <span className="text-zinc-300">Add assessment</span> to create one via POST{" "}
            <code className="rounded bg-white/10 px-1 py-0.5 text-xs">assessments/create/</code>.
          </p>
        ) : detailLoading ? (
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading selected assessment…
          </div>
        ) : assessmentId == null ? (
          <p className="text-zinc-400">Select an assessment above.</p>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Assessment #{assessmentId}
                </span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSaveAssessment()}
                  className="inline-flex items-center gap-2 rounded-full bg-accentGreen px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save assessment
                </button>
              </div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accentGreen/50 focus:outline-none"
              />
              <label className="mt-4 block text-xs uppercase tracking-widest text-zinc-500">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full resize-y rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accentGreen/50 focus:outline-none"
              />
            </div>

            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">Questions</h2>
            {questions.length === 0 ? (
              <p className="text-zinc-400">This assessment has no questions yet.</p>
            ) : (
              <ul className="space-y-6">
                {questions.map((q) => (
                  <li
                    key={q.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg"
                  >
                    <div className="mb-3">
                      <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        Question #{q.id}
                      </span>
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
                          onChange={(e) =>
                            updateLocal(q.id, { order: Number(e.target.value) || 0 })
                          }
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accentGreen/50 focus:outline-none"
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
