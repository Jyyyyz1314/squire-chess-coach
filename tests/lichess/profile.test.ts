import { describe, expect, it } from "vitest";
import { buildPlayerProfile } from "../../lib/lichess/profile";
import type { LichessGame } from "../../lib/lichess/types";

function game(index: number, winner: "white" | "black" | undefined, accuracy: number, blunders = 0): LichessGame {
  const moves = "e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4 g8f6 e1g1 f8e7 f1e1 b7b5 a4b3 d7d6 c2c3 e8g8 h2h3";
  return {
    id: `game-${index}`,
    createdAt: Date.UTC(2026, 0, index + 1),
    variant: "standard",
    winner,
    players: { white: { userId: "CoachStudent" }, black: { userId: "opponent" } },
    moves,
    pgn: "1. e4 e5 2. Nf3 Nc6 *",
    accuracy: { white: accuracy, black: 80 },
    opening: { name: index % 2 ? "Ruy Lopez" : "Italian Game" },
    analysis: moves.split(" ").map((_, ply) => ({ judgment: ply % 2 === 0 && ply < blunders * 2 ? { name: "Blunder" } : undefined })),
  };
}

describe("Lichess player profile", () => {
  it("separates style, quality and progress from recent games", () => {
    const games = [
      game(0, "black", 62, 2), game(1, "white", 67, 1), game(2, undefined, 70, 1),
      game(3, "white", 82), game(4, "white", 88), game(5, "white", 91),
    ];
    const profile = buildPlayerProfile(games, "coachstudent");
    expect(profile.sampleSize).toBe(6);
    expect(profile.analysedGames).toBe(6);
    expect(profile.wins).toBe(4);
    expect(profile.draws).toBe(1);
    expect(profile.progress).toBeGreaterThan(10);
    expect(profile.progressLabel).toBe("近期明显进步");
    expect(profile.openings).toHaveLength(2);
  });

  it("does not invent a quality score when Lichess has no analysis", () => {
    const unanalysed = game(0, "white", 80);
    delete unanalysed.accuracy;
    delete unanalysed.analysis;
    const profile = buildPlayerProfile([unanalysed], "CoachStudent");
    expect(profile.averageAccuracy).toBeNull();
    expect(profile.blundersPerGame).toBeNull();
    expect(profile.progress).toBeNull();
    expect(profile.priorities.join(" ")).toContain("云分析");
  });

  it("supports the current Lichess NDJSON shape and SAN move list", () => {
    const officialShape: LichessGame = {
      id: "official-shape",
      createdAt: Date.UTC(2026, 8, 12),
      variant: "standard",
      winner: "white",
      players: {
        white: { user: { id: "coachstudent", name: "CoachStudent" }, analysis: { inaccuracy: 1, mistake: 0, blunder: 0, accuracy: 94 } },
        black: { user: { id: "opponent", name: "Opponent" }, analysis: { inaccuracy: 2, mistake: 1, blunder: 1, accuracy: 78 } },
      },
      moves: "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3",
      opening: { eco: "C78", name: "Ruy Lopez" },
    };
    const profile = buildPlayerProfile([officialShape], "coachstudent");
    expect(profile.sampleSize).toBe(1);
    expect(profile.averageAccuracy).toBe(94);
    expect(profile.blundersPerGame).toBe(0);
    expect(profile.strengths).toContain("王的安全意识稳定");
  });
});
