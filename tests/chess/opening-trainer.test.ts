import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { OPENING_SAMPLES } from "../../lib/chess/opening-samples";
import { applyUciMove, isExpectedOpeningMove, moveKey, openingTrainingLine } from "../../lib/chess/opening-trainer";

describe("opening trainer", () => {
  it("provides ten lessons with 8 to 10 complete moves", () => {
    expect(OPENING_SAMPLES).toHaveLength(10);
    for (const sample of OPENING_SAMPLES) {
      const line = openingTrainingLine(sample);
      expect(line.length, sample.name).toBeGreaterThanOrEqual(16);
      expect(line.length, sample.name).toBeLessThanOrEqual(20);
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
  });
});
