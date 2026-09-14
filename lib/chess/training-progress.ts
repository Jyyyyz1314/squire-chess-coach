export type TrainingRecord = {
  completedAt: string;
  lastPracticedAt: string;
  nextReviewAt: string;
  intervalDays: number;
  bestAccuracy: number;
  repetitions: number;
};

export type DailyActivity = { newLessons: string[]; reviews: string[]; xp: number };
export type DailyPlan = { newLessons: number; reviews: number };
export type TrainingProgressState = {
  version: 2;
  records: Record<string, TrainingRecord>;
  daily: Record<string, DailyActivity>;
  plan: DailyPlan;
};

export const EMPTY_TRAINING_PROGRESS: TrainingProgressState = {
  version: 2,
  records: {},
  daily: {},
  plan: { newLessons: 2, reviews: 3 },
};

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function futureIso(now: Date, days: number) {
  const next = new Date(now);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

export function parseTrainingProgress(raw: string | null): TrainingProgressState {
  if (!raw) return structuredClone(EMPTY_TRAINING_PROGRESS);
  try {
    const value = JSON.parse(raw) as Partial<TrainingProgressState> | Record<string, Partial<TrainingRecord>>;
    if (value && "version" in value && value.version === 2 && "records" in value) {
      const state = value as TrainingProgressState;
      return {
        version: 2,
        records: state.records ?? {},
        daily: state.daily ?? {},
        plan: { newLessons: Math.max(1, Math.min(10, state.plan?.newLessons ?? 2)), reviews: Math.max(1, Math.min(20, state.plan?.reviews ?? 3)) },
      };
    }
    const records: Record<string, TrainingRecord> = {};
    for (const [key, legacy] of Object.entries(value ?? {})) {
      if (!legacy?.completedAt) continue;
      records[key] = {
        completedAt: legacy.completedAt,
        lastPracticedAt: legacy.completedAt,
        nextReviewAt: futureIso(new Date(legacy.completedAt), 1),
        intervalDays: 1,
        bestAccuracy: legacy.bestAccuracy ?? 0,
        repetitions: 1,
      };
    }
    return { ...structuredClone(EMPTY_TRAINING_PROGRESS), records };
  } catch { return structuredClone(EMPTY_TRAINING_PROGRESS); }
}

export function recordTrainingCompletion(state: TrainingProgressState, key: string, accuracy: number, now = new Date()) {
  const existing = state.records[key];
  const day = localDateKey(now);
  const activity = state.daily[day] ?? { newLessons: [], reviews: [], xp: 0 };
  const isReview = Boolean(existing);
  const alreadyCounted = activity.newLessons.includes(key) || activity.reviews.includes(key);
  const boundedAccuracy = Math.max(0, Math.min(100, Math.round(accuracy)));
  const previousInterval = existing?.intervalDays ?? 1;
  const intervalDays = !existing || boundedAccuracy < 70 ? 1 : boundedAccuracy < 90 ? previousInterval : Math.min(30, Math.max(2, Math.round(previousInterval * 2)));
  const xp = alreadyCounted ? 0 : isReview ? 35 : 60;
  const nextActivity: DailyActivity = {
    newLessons: isReview || alreadyCounted ? activity.newLessons : [...activity.newLessons, key],
    reviews: !isReview || alreadyCounted ? activity.reviews : [...activity.reviews, key],
    xp: activity.xp + xp,
  };
  const next: TrainingProgressState = {
    ...state,
    records: {
      ...state.records,
      [key]: {
        completedAt: existing?.completedAt ?? now.toISOString(),
        lastPracticedAt: now.toISOString(),
        nextReviewAt: futureIso(now, intervalDays),
        intervalDays,
        bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, boundedAccuracy),
        repetitions: (existing?.repetitions ?? 0) + 1,
      },
    },
    daily: { ...state.daily, [day]: nextActivity },
  };
  return { state: next, kind: isReview ? "review" as const : "new" as const, xp };
}

export function dueReviewKeys(state: TrainingProgressState, now = new Date()) {
  return Object.entries(state.records)
    .filter(([, record]) => new Date(record.nextReviewAt).getTime() <= now.getTime())
    .sort(([, a], [, b]) => a.nextReviewAt.localeCompare(b.nextReviewAt))
    .map(([key]) => key);
}

export function totalXp(state: TrainingProgressState) {
  return Object.values(state.daily).reduce((sum, activity) => sum + activity.xp, 0);
}

export function learningLevel(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 120)) + 1;
  const levelStart = 120 * (level - 1) ** 2;
  const levelEnd = 120 * level ** 2;
  return { level, current: xp - levelStart, required: levelEnd - levelStart };
}

export function learningStreak(state: TrainingProgressState, now = new Date()) {
  let streak = 0;
  const cursor = new Date(now);
  const todayActivity = state.daily[localDateKey(cursor)];
  if (!todayActivity || todayActivity.newLessons.length + todayActivity.reviews.length === 0) cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const activity = state.daily[localDateKey(cursor)];
    if (!activity || activity.newLessons.length + activity.reviews.length === 0) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
