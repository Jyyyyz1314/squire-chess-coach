import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { OPENING_SAMPLES } from "../../lib/chess/opening-samples";
import { OPENING_THEORY_COURSES, openingVariationCount } from "../../lib/chess/opening-variations";
import { applyUciMove, attemptOpeningMove, fixedMoveExplanation, isExpectedOpeningMove, moveKey, openingTrainingLine, openingTrainingLineFromPgn } from "../../lib/chess/opening-trainer";

describe("opening trainer", () => {
  it("provides ten lessons with 8 to 10 complete moves", () => {
    expect(OPENING_SAMPLES).toHaveLength(10);
    for (const sample of OPENING_SAMPLES) {
      const line = openingTrainingLine(sample);
      expect(line.length, sample.name).toBeGreaterThanOrEqual(16);
      expect(line.length, sample.name).toBeLessThanOrEqual(20);
    }
  });

  it("provides at least eleven sourced, legal variations for every opening", () => {
    expect(OPENING_THEORY_COURSES).toHaveLength(OPENING_SAMPLES.length);
    expect(openingVariationCount()).toBeGreaterThanOrEqual(110);
    for (const course of OPENING_THEORY_COURSES) {
      expect(course.variations.length, course.sampleId).toBeGreaterThanOrEqual(11);
      expect(course.sources.length, course.sampleId).toBeGreaterThanOrEqual(2);
      for (const variation of course.variations) {
        expect(openingTrainingLineFromPgn(variation.pgn).length, `${course.sampleId}/${variation.name}`).toBeGreaterThanOrEqual(2);
        expect(variation.focus.length, variation.name).toBeGreaterThan(10);
      }
    }
  });

  it("compares book moves and safely applies an engine UCI move", () => {
    const expected = openingTrainingLine(OPENING_SAMPLES[0])[0];
    expect(moveKey(expected)).toBe("e2e4");
    expect(isExpectedOpeningMove({ from: "e2", to: "e4" }, expected)).toBe(true);
    expect(isExpectedOpeningMove({ from: "d2", to: "d4" }, expected)).toBe(false);
    const game = new Chess();
    expect(applyUciMove(game, "e2e4")?.san).toBe("e4");
    expect(applyUciMove(game, "not-a-move")).toBeNull();
    expect(fixedMoveExplanation(expected, "控制中心")).toContain("本变例的核心");
  });

  it("rejects a wrong training move without changing the position", () => {
    const game = new Chess();
    const expected = openingTrainingLine(OPENING_SAMPLES[0])[0];
    const wrong = attemptOpeningMove(game.fen(), "d2", "d4", expected);
    expect(wrong?.accepted).toBe(false);
    expect(wrong?.fen).toBe(game.fen());
    const correct = attemptOpeningMove(game.fen(), "e2", "e4", expected);
    expect(correct?.accepted).toBe(true);
    expect(correct?.fen).not.toBe(game.fen());
  });
});
