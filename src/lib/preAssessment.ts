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
    throw new Error(data?.detail || "Pre-assessment request failed.");
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
