export interface LessonRecord {
  id: number;
  title: string;
  topic: string;
  content: string;
  url?: string;
  created_at: string;
  progress: number;
  completed: boolean;
  score?: number;
  total_lessons: number;
  total_quizzes: number;
  last_accessed?: string;
}

type LessonProgressUpdate = Partial<Pick<LessonRecord, "progress" | "completed" | "score" | "last_accessed">>;

const COURSE_CACHE_KEYS = ["cached_courses", "cached_lessons"] as const;

function clampPercent(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getProgressSource(raw: any) {
  const candidates = [raw?.lesson_progress, raw?.progress_detail, raw?.progress_data, raw?.user_progress];
  return candidates.find((value) => value && typeof value === "object") ?? null;
}

export function extractLessonProgress(raw: any) {
  const progressSource = getProgressSource(raw);
  const directProgress = clampPercent(typeof raw?.progress === "number" ? raw.progress : null);
  const nestedProgress = clampPercent(progressSource?.progress);
  const directScore = clampPercent(typeof raw?.score === "number" ? raw.score : null);
  const nestedScore = clampPercent(progressSource?.score);

  const score = directScore ?? nestedScore ?? undefined;
  let completed = Boolean(raw?.completed ?? progressSource?.completed);
  let progress = directProgress ?? nestedProgress ?? score ?? 0;

  if (completed && progress < 100) {
    progress = 100;
  }

  completed = completed || progress >= 100;

  return {
    progress,
    completed,
    score,
    last_accessed:
      raw?.last_accessed ??
      progressSource?.last_accessed ??
      undefined,
  };
}

export function mapLesson(raw: any, fallbackId: number): LessonRecord {
  const progressState = extractLessonProgress(raw);

  return {
    id: Number(raw?.id ?? fallbackId),
    title: raw?.title ?? raw?.name ?? `Lesson ${fallbackId}`,
    topic: raw?.topic ?? raw?.category ?? "General",
    content: raw?.content ?? raw?.description ?? "",
    url: raw?.url ?? raw?.link ?? undefined,
    created_at: raw?.created_at ?? raw?.created ?? new Date().toISOString(),
    progress: progressState.progress,
    completed: progressState.completed,
    score: progressState.score,
    total_lessons: raw?.total_lessons ?? raw?.lesson_count ?? 1,
    total_quizzes: raw?.total_quizzes ?? raw?.quiz_count ?? 0,
    last_accessed: progressState.last_accessed,
  };
}

function parseCachedLessons(key: (typeof COURSE_CACHE_KEYS)[number]) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item, index) => mapLesson(item, index + 1)) : [];
  } catch {
    return [];
  }
}

export function readCachedLessons() {
  for (const key of COURSE_CACHE_KEYS) {
    const items = parseCachedLessons(key);
    if (items.length > 0) return items;
  }

  return [];
}

export function writeCachedLessons(lessons: LessonRecord[]) {
  for (const key of COURSE_CACHE_KEYS) {
    try {
      localStorage.setItem(key, JSON.stringify(lessons));
    } catch {}
  }
}

export function updateCachedLessonProgress(lessonId: number, update: LessonProgressUpdate) {
  const currentLessons = readCachedLessons();
  if (currentLessons.length === 0) return;

  const nextLessons = currentLessons.map((lesson) => {
    if (Number(lesson.id) !== Number(lessonId)) return lesson;

    const nextProgress = clampPercent(update.progress) ?? clampPercent(update.score) ?? lesson.progress;
    const nextCompleted = update.completed ?? lesson.completed;

    return {
      ...lesson,
      ...update,
      progress: nextCompleted ? 100 : nextProgress,
      completed: nextCompleted || nextProgress >= 100,
    };
  });

  writeCachedLessons(nextLessons);
}
