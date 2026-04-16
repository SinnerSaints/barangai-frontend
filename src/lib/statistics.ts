import { API_BASE_URL } from "@/lib/auth";

export type LessonProgress = {
  total_lessons: number;
  completed_lessons: number;
  completion_rate_percent: number;
};

export type QuizProgress = {
  total_attempts: number;
  average_score: number;
  first_score: number;
  latest_score: number;
  score_growth: number;
};

export type TopicPerformance = {
  topic: string;
  accuracy_percent: number;
  total_questions: number;
  correct_answers: number;
};

export type OverallReport = {
  status: "improving" | "steady" | "needs_support";
  insight: string;
};

export type GeneralStatisticsReport = {
  lesson_progress: LessonProgress;
  quiz_progress: QuizProgress;
  strengths: TopicPerformance[];
  weaknesses: TopicPerformance[];
  overall_report: OverallReport;
};

export type GrowthTimelineEntry = {
  attempt_id: number;
  quiz_id: number;
  lesson_id: number;
  lesson_title: string;
  topic: string;
  score: number;
  correct_count: number;
  total_questions: number;
  submitted_at: string;
};

export type TopicGrowth = {
  topic: string;
  attempts: number;
  avg_score: number;
  first_score: number;
  best_score: number;
};

export type GrowthTimelineResponse = {
  timeline: GrowthTimelineEntry[];
  topic_growth: TopicGrowth[];
};

function apiOriginNoSlash() {
  return API_BASE_URL.replace(/\/$/, "");
}

function getBaseUrl() {
  return API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
}

async function tryRefreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;

  try {
    const response = await fetch(`${apiOriginNoSlash()}/accounts/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    const data = (await response.json().catch(() => null)) as { access?: string } | null;
    if (!response.ok || !data?.access) return null;

    localStorage.setItem("access_token", data.access);
    return data.access;
  } catch {
    return null;
  }
}

async function resolveAccessToken(): Promise<string> {
  const token = localStorage.getItem("access_token");
  if (token) return token;

  const refreshed = await tryRefreshAccessToken();
  if (!refreshed) throw new Error("No access token found. Sign in again.");
  return refreshed;
}

function mergeAuthHeaders(token: string, init?: RequestInit): HeadersInit {
  const out: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const extra = init?.headers;
  if (extra && typeof extra === "object" && !(extra instanceof Headers)) {
    if (Array.isArray(extra)) {
      for (const [key, value] of extra) out[key] = value;
    } else {
      Object.assign(out, extra as Record<string, string>);
    }
  }

  out.Authorization = `Bearer ${token}`;
  return out;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}statistics/${path}`;
  let token = await resolveAccessToken();

  let response = await fetch(url, {
    ...init,
    headers: mergeAuthHeaders(token, init),
  });

  if (response.status === 401) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      token = refreshed;
      response = await fetch(url, {
        ...init,
        headers: mergeAuthHeaders(token, init),
      });
    }
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : `Statistics request failed (${response.status}).`;
    throw new Error(message);
  }

  return data as T;
}

export async function fetchGeneralStatisticsReport() {
  return request<GeneralStatisticsReport>("report/");
}

export async function fetchGrowthTimeline() {
  return request<GrowthTimelineResponse>("growth/");
}
