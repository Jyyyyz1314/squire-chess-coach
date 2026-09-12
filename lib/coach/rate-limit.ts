type Bucket = {
  minuteStart: number;
  minuteCount: number;
  dayStart: number;
  dayCount: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;
const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

export function checkCoachRateLimit(clientId: string, perMinute: number, perDay: number, now = Date.now()): RateLimitResult {
  const current = buckets.get(clientId) ?? { minuteStart: now, minuteCount: 0, dayStart: now, dayCount: 0 };
  if (now - current.minuteStart >= MINUTE_MS) { current.minuteStart = now; current.minuteCount = 0; }
  if (now - current.dayStart >= DAY_MS) { current.dayStart = now; current.dayCount = 0; }

  const minuteBlocked = current.minuteCount >= perMinute;
  const dayBlocked = current.dayCount >= perDay;
  if (minuteBlocked || dayBlocked) {
    buckets.set(clientId, current);
    const resetAt = minuteBlocked ? current.minuteStart + MINUTE_MS : current.dayStart + DAY_MS;
    return { allowed: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((resetAt - now) / 1000)) };
  }

  current.minuteCount += 1;
  current.dayCount += 1;
  buckets.delete(clientId);
  buckets.set(clientId, current);
  while (buckets.size > MAX_BUCKETS) buckets.delete(buckets.keys().next().value as string);
  return { allowed: true, remaining: Math.min(perMinute - current.minuteCount, perDay - current.dayCount), retryAfter: 0 };
}

export function clearCoachRateLimitsForTests() {
  buckets.clear();
}
