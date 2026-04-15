"use client";

import { API_BASE_URL } from "@/lib/auth";

/** Data for a single skill domain (e.g. "Basic Computer Skills") */
export interface DomainStats {
  pre_mean: number;
  post_mean: number;
  pre_std_dev: number;
  post_std_dev: number;
  pre_proficiency: string;
  post_proficiency: string;
}

/** The structure returned by your Django AssessmentStatisticsView */
export interface AssessmentStatistics {
  domains: Record<string, DomainStats>;
  t_test_results: Record<string, number | null>;
  sus_score: number;
}

export type AssessmentCategory =
  | "basic_computer"
  | "document_processing"
  | "spreadsheet"
  | "email_communication"
  | "internet_platforms";

export interface AssessmentQuestion {
  id: number;
  question_text: string;
  category: AssessmentCategory;
  order: number;
}

export interface AssessmentResult {
  id: number;
  total_questions: number;
  overall_score: number;
  basic_computer_score: number;
  document_processing_score: number;
  spreadsheet_score: number;
  email_communication_score: number;
  internet_platforms_score: number;
  proficiency_level: string;
  created_at: string;
}

export interface AssessmentAttempt {
  id: number;
  assessment: number;
  status: "in_progress" | "completed";
  started_at: string;
  completed_at: string | null;
  questions: AssessmentQuestion[];
  result?: AssessmentResult | null;
}

export interface AssessmentStatus {
  completed: boolean;
  proficiency_level: string | null;
}

/** Admin list/detail payload — matches Django `AdminAssessmentSerializer`. */
export interface AdminAssessment {
  id: number;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  created_at: string;
}

const PRE_ASSESSMENT_PATH = "assessments/";
const STATUS_CACHE_KEY = "pre_assessment_status";
const RESULT_CACHE_KEY = "pre_assessment_result";

function getUserScopedCacheKey(baseKey: string) {
  const userId = localStorage.getItem("user_id");
  return userId ? `${baseKey}:${userId}` : baseKey;
}

function readCache<T>(baseKey: string) {
  const cached = localStorage.getItem(getUserScopedCacheKey(baseKey));
  return cached ? (JSON.parse(cached) as T) : null;
}

function writeCache(baseKey: string, value: unknown) {
  localStorage.setItem(getUserScopedCacheKey(baseKey), JSON.stringify(value));
}

function removeCache(baseKey: string) {
  localStorage.removeItem(getUserScopedCacheKey(baseKey));
}

function getBaseUrl() {
  return API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
}

function apiOriginNoSlash() {
  return API_BASE_URL.replace(/\/$/, "");
}

/** Same refresh flow as AdminDashboard — POST accounts/token/ with { refresh }. */
async function tryRefreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;
  try {
    const res = await fetch(`${apiOriginNoSlash()}/accounts/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    const data = (await res.json().catch(() => null)) as { access?: string; detail?: unknown } | null;
    if (!res.ok || !data?.access) return null;
    localStorage.setItem("access_token", data.access);
    return data.access;
  } catch {
    return null;
  }
}

async function resolveAccessToken(): Promise<string> {
  const access = localStorage.getItem("access_token");
  if (access) return access;
  const next = await tryRefreshAccessToken();
  if (!next) {
    throw new Error("No access token found. Sign in again.");
  }
  return next;
}

function mergeAuthHeaders(token: string, init?: RequestInit): HeadersInit {
  const extra = init?.headers;
  const out: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  if (extra && typeof extra === "object" && !(extra instanceof Headers)) {
    if (Array.isArray(extra)) {
      for (const [k, v] of extra) out[k] = v;
    } else {
      Object.assign(out, extra as Record<string, string>);
    }
  }
  out.Authorization = `Bearer ${token}`;
  return out;
}

function formatRequestError(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if ("detail" in o) {
      const detail = o.detail;
      if (typeof detail === "string") {
        if (status === 403 && /permission/i.test(detail)) {
          return `${detail} (Django IsAdminUser requires is_staff=True on the user unless your view uses a custom permission.)`;
        }
        return detail;
      }
      if (Array.isArray(detail)) {
        const first = detail[0];
        if (first && typeof first === "object" && "message" in first) {
          return String((first as { message: unknown }).message);
        }
        return JSON.stringify(detail);
      }
    }
    const keys = Object.keys(o);
    if (keys.length > 0) {
      const first = keys[0];
      const val = o[first];
      if (Array.isArray(val) && val.length > 0) {
        return String(val[0]);
      }
    }
  }
  if (status === 401) return "Unauthorized. Your session may have expired — try signing in again.";
  if (status === 403) {
    return "Forbidden (403). You may be signed in as a non-admin user, or the backend requires staff/superuser for this endpoint.";
  }
  return `Pre-assessment request failed (${status}).`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${PRE_ASSESSMENT_PATH}${path}`;

  let token = await resolveAccessToken();
  let response = await fetch(url, {
    ...init,
    headers: mergeAuthHeaders(token, init),
  });

  if (response.status === 401) {
    const next = await tryRefreshAccessToken();
    if (next) {
      token = next;
      response = await fetch(url, {
        ...init,
        headers: mergeAuthHeaders(token, init),
      });
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(formatRequestError(data, response.status));
  }

  return data as T;
}

export async function fetchAssessmentStatus(useCache = true): Promise<AssessmentStatus> {
  if (useCache) {
    const cached = readCache<AssessmentStatus>(STATUS_CACHE_KEY);
    if (cached) return cached;
  }

  const data = await request<AssessmentStatus>("status/");
  writeCache(STATUS_CACHE_KEY, data);
  return data;
}

export async function startPreAssessment(): Promise<AssessmentAttempt> {
  const data = await request<AssessmentAttempt>("start/", { method: "POST" });
  clearAssessmentCache();
  return data;
}

export async function submitPreAssessment(
  answers: Array<{ question_id: number; rating: number }>
): Promise<AssessmentResult> {
  const data = await request<AssessmentResult>("submit/", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });

  localStorage.setItem(
    getUserScopedCacheKey(STATUS_CACHE_KEY),
    JSON.stringify({
      completed: true,
      proficiency_level: data.proficiency_level,
    } satisfies AssessmentStatus)
  );
  writeCache(RESULT_CACHE_KEY, data);

  return data;
}

export async function fetchAssessmentResult(useCache = true): Promise<AssessmentResult> {
  if (useCache) {
    const cached = readCache<AssessmentResult>(RESULT_CACHE_KEY);
    if (cached) return cached;
  }

  const data = await request<AssessmentResult>("result/");
  writeCache(RESULT_CACHE_KEY, data);
  return data;
}

/** Admin: GET assessments/statistics/ */
export async function fetchAssessmentStatistics(): Promise<AssessmentStatistics> {
  const data = await request<AssessmentStatistics>("statistics/");
  return data;
}

function sortQuestions(questions: AssessmentQuestion[] | undefined) {
  return [...(questions ?? [])].sort((a, b) => a.order - b.order || a.id - b.id);
}

/** Admin: GET assessments/list-assessment/ — all assessments with nested questions. */
export async function fetchAdminAssessments(): Promise<AdminAssessment[]> {
  const list = await request<AdminAssessment[]>("list-assessment/");
  if (!Array.isArray(list)) return [];
  return list.map((a) => ({ ...a, questions: sortQuestions(a.questions) }));
}

/** Admin: GET assessments/list-assessment/<id>/ */
export async function fetchAdminAssessmentById(id: number): Promise<AdminAssessment> {
  const assessment = await request<AdminAssessment>(`list-assessment/${id}/`);
  return { ...assessment, questions: sortQuestions(assessment.questions) };
}

/** Admin: POST assessments/create/ */
export async function createAdminAssessment(body: {
  title: string;
  description?: string;
}): Promise<AdminAssessment> {
  const created = await request<AdminAssessment>("create/", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return { ...created, questions: sortQuestions(created.questions) };
}

/**
 * Admin: PATCH assessments/list-assessment/<id>/
 * Backend replaces the question set from `questions`; always send the full list so rows are not deleted.
 */
export async function patchAdminAssessment(
  assessmentId: number,
  body: {
    title?: string;
    description?: string;
    questions: Array<Pick<AssessmentQuestion, "id" | "question_text" | "category" | "order">>;
  }
): Promise<AdminAssessment> {
  const updated = await request<AdminAssessment>(`list-assessment/${assessmentId}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const questions = [...(updated.questions ?? [])].sort(
    (a, b) => a.order - b.order || a.id - b.id
  );
  return { ...updated, questions };
}

export function clearAssessmentCache() {
  removeCache(STATUS_CACHE_KEY);
  removeCache(RESULT_CACHE_KEY);
}

export function formatProficiencyLevel(level?: string | null) {
  if (!level) return "Not started";
  return level
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getScorePercent(score?: number) {
  if (typeof score !== "number" || Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round((score / 5) * 100)));
}
