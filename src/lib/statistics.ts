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

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toTopicPerformance(item: any): TopicPerformance {
  return {
    topic: asString(item?.topic, "General"),
    accuracy_percent: asNumber(item?.accuracy_percent),
    total_questions: asNumber(item?.total_questions),
    correct_answers: asNumber(item?.correct_answers),
  };
}

function normalizeGeneralStatisticsReport(raw: any): GeneralStatisticsReport {
  const lesson = raw?.lesson_progress ?? raw?.lessonProgress ?? raw?.lessons ?? {};
  const quiz = raw?.quiz_progress ?? raw?.quizProgress ?? raw?.quizzes ?? {};
  const overall = raw?.overall_report ?? raw?.overallReport ?? raw?.report ?? {};
  const strengths = Array.isArray(raw?.strengths) ? raw.strengths : [];
  const weaknesses = Array.isArray(raw?.weaknesses) ? raw.weaknesses : [];

  return {
    lesson_progress: {
      total_lessons: asNumber(lesson?.total_lessons ?? lesson?.totalLessons),
      completed_lessons: asNumber(lesson?.completed_lessons ?? lesson?.completedLessons),
      completion_rate_percent: asNumber(
        lesson?.completion_rate_percent ?? lesson?.completionRatePercent
      ),
    },
    quiz_progress: {
      total_attempts: asNumber(quiz?.total_attempts ?? quiz?.totalAttempts),
      average_score: asNumber(quiz?.average_score ?? quiz?.averageScore),
      first_score: asNumber(quiz?.first_score ?? quiz?.firstScore),
      latest_score: asNumber(quiz?.latest_score ?? quiz?.latestScore),
      score_growth: asNumber(quiz?.score_growth ?? quiz?.scoreGrowth),
    },
    strengths: strengths.map(toTopicPerformance),
    weaknesses: weaknesses.map(toTopicPerformance),
    overall_report: {
      status:
        overall?.status === "improving" ||
        overall?.status === "steady" ||
        overall?.status === "needs_support"
          ? overall.status
          : "steady",
      insight: asString(overall?.insight, "No report insight available yet."),
    },
  };
}

function toTimelineEntry(item: any): GrowthTimelineEntry {
  return {
    attempt_id: asNumber(item?.attempt_id ?? item?.attemptId),
    quiz_id: asNumber(item?.quiz_id ?? item?.quizId),
    lesson_id: asNumber(item?.lesson_id ?? item?.lessonId),
    lesson_title: asString(item?.lesson_title ?? item?.lessonTitle, "Untitled Lesson"),
    topic: asString(item?.topic, "General"),
    score: asNumber(item?.score),
    correct_count: asNumber(item?.correct_count ?? item?.correctCount),
    total_questions: asNumber(item?.total_questions ?? item?.totalQuestions),
    submitted_at: asString(item?.submitted_at ?? item?.submittedAt, ""),
  };
}

function toTopicGrowth(item: any): TopicGrowth {
  return {
    topic: asString(item?.topic, "General"),
    attempts: asNumber(item?.attempts),
    avg_score: asNumber(item?.avg_score ?? item?.average_score ?? item?.averageScore),
    first_score: asNumber(item?.first_score ?? item?.firstScore),
    best_score: asNumber(item?.best_score ?? item?.bestScore),
  };
}

function normalizeGrowthTimeline(raw: any): GrowthTimelineResponse {
  const timeline = Array.isArray(raw?.timeline) ? raw.timeline : [];
  const topicGrowth = Array.isArray(raw?.topic_growth)
    ? raw.topic_growth
    : Array.isArray(raw?.topicGrowth)
      ? raw.topicGrowth
      : [];

  return {
    timeline: timeline.map(toTimelineEntry),
    topic_growth: topicGrowth.map(toTopicGrowth),
  };
}

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
  const raw = await request<any>("report/");
  return normalizeGeneralStatisticsReport(raw);
}

export async function fetchGrowthTimeline() {
  const raw = await request<any>("growth/");
  return normalizeGrowthTimeline(raw);
}
