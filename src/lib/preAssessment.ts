"use client";

import { API_BASE_URL } from "@/lib/auth";

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

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("No access token found.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function formatRequestError(data: unknown): string {
  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const first = detail[0];
      if (first && typeof first === "object" && "message" in first) {
        return String((first as { message: unknown }).message);
      }
      return JSON.stringify(detail);
    }
  }
  return "Pre-assessment request failed.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getBaseUrl()}${PRE_ASSESSMENT_PATH}${path}`, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init?.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(formatRequestError(data));
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

/**
 * Admin: GET assessments/list-assessment/ — returns all assessments with nested questions.
 * Uses the first assessment (same as user flow: single global pre-assessment).
 */
export async function fetchPrimaryAdminAssessment(): Promise<AdminAssessment> {
  const list = await request<AdminAssessment[]>("list-assessment/");
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("No assessment found. Create one via POST assessments/create/ first.");
  }
  const assessment = list[0];
  const questions = [...(assessment.questions ?? [])].sort(
    (a, b) => a.order - b.order || a.id - b.id
  );
  return { ...assessment, questions };
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
