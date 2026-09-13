import { Chess, Move } from "chess.js";
import type { OpeningSample } from "./opening-samples";

export type TrainingMove = Pick<Move, "from" | "to" | "san" | "color"> & { promotion?: string };

export function openingTrainingLine(sample: OpeningSample): TrainingMove[] {
  const game = new Chess();
  game.loadPgn(sample.pgn, { strict: false });
  return (game.history({ verbose: true }) as Move[]).map(({ from, to, san, color, promotion }) => ({
    from,
    to,
    san,
    color,
    ...(promotion ? { promotion } : {}),
  }));
}

export function moveKey(move: Pick<TrainingMove, "from" | "to" | "promotion">) {
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}

export function isExpectedOpeningMove(actual: Pick<TrainingMove, "from" | "to" | "promotion">, expected?: TrainingMove) {
  return Boolean(expected && moveKey(actual) === moveKey(expected));
}

export function applyUciMove(game: Chess, uci?: string) {
  if (!uci || !/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(uci)) return null;
  try {
    return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: (uci[4]?.toLowerCase() || "q") as "q" | "r" | "b" | "n" });
  } catch {
    return null;
  }
}
