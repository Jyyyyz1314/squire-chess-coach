import { describe, expect, it } from "vitest";
import { dueReviewKeys, learningLevel, learningStreak, localDateKey, parseTrainingProgress, recordTrainingCompletion } from "../../lib/chess/training-progress";

describe("opening training progress", () => {
  const firstDay = new Date(2026, 8, 14, 10);

  it("records a new lesson, awards XP, and schedules review", () => {
    const result = recordTrainingCompletion(parseTrainingProgress(null), "course/line/w", 92, firstDay);
    expect(result.kind).toBe("new");
    expect(result.xp).toBe(60);
    expect(result.state.daily[localDateKey(firstDay)].newLessons).toEqual(["course/line/w"]);
    expect(result.state.records["course/line/w"].intervalDays).toBe(1);
  });

  it("turns the next completion into a review without same-day XP farming", () => {
    const first = recordTrainingCompletion(parseTrainingProgress(null), "course/line/w", 90, firstDay).state;
    const repeated = recordTrainingCompletion(first, "course/line/w", 100, firstDay);
    expect(repeated.kind).toBe("review");
    expect(repeated.xp).toBe(0);
    const nextDay = new Date(2026, 8, 15, 10);
    expect(dueReviewKeys(first, nextDay)).toContain("course/line/w");
    const reviewed = recordTrainingCompletion(first, "course/line/w", 95, nextDay);
    expect(reviewed.xp).toBe(35);
    expect(reviewed.state.records["course/line/w"].intervalDays).toBe(2);
  });

  it("migrates old progress and derives level and streak", () => {
    const state = parseTrainingProgress(JSON.stringify({ "course/line/w": { completedAt: firstDay.toISOString(), bestAccuracy: 88 } }));
    expect(state.records["course/line/w"].repetitions).toBe(1);
    const active = recordTrainingCompletion(parseTrainingProgress(null), "a", 90, firstDay).state;
    expect(learningLevel(480).level).toBe(3);
    expect(learningStreak(active, firstDay)).toBe(1);
    expect(learningStreak(active, new Date(2026, 8, 15, 8))).toBe(1);
  });
});
