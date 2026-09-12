import { beforeEach, describe, expect, it } from 'vitest';
import { checkCoachRateLimit, clearCoachRateLimitsForTests } from '../../lib/coach/rate-limit';

describe('coach rate limit', () => {
  beforeEach(clearCoachRateLimitsForTests);

  it('limits a client per minute and resets at the next window', () => {
    expect(checkCoachRateLimit('client-a', 2, 10, 0)).toMatchObject({ allowed: true, remaining: 1 });
    expect(checkCoachRateLimit('client-a', 2, 10, 1)).toMatchObject({ allowed: true, remaining: 0 });
    expect(checkCoachRateLimit('client-a', 2, 10, 2)).toMatchObject({ allowed: false, retryAfter: 60 });
    expect(checkCoachRateLimit('client-a', 2, 10, 60_000)).toMatchObject({ allowed: true });
  });

  it('keeps clients isolated and enforces the daily cap', () => {
    expect(checkCoachRateLimit('client-a', 10, 1, 0).allowed).toBe(true);
    expect(checkCoachRateLimit('client-b', 10, 1, 1).allowed).toBe(true);
    expect(checkCoachRateLimit('client-a', 10, 1, 60_000)).toMatchObject({ allowed: false, retryAfter: 86_340 });
  });
});
