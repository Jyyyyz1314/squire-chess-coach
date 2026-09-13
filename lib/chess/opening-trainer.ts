import { Chess, Move, Square } from "chess.js";
import type { OpeningSample } from "./opening-samples";

export type TrainingMove = Pick<Move, "from" | "to" | "san" | "color"> & { promotion?: string };

export function openingTrainingLineFromPgn(pgn: string): TrainingMove[] {
  const game = new Chess();
  game.loadPgn(pgn, { strict: false });
  return (game.history({ verbose: true }) as Move[]).map(({ from, to, san, color, promotion }) => ({
    from,
    to,
    san,
    color,
    ...(promotion ? { promotion } : {}),
  }));
}

export function openingTrainingLine(sample: OpeningSample): TrainingMove[] {
  return openingTrainingLineFromPgn(sample.pgn);
}

export function fixedMoveExplanation(move: TrainingMove, variationFocus: string) {
  const san = move.san.replace(/[+#]/g, "");
  let purpose = "这步改善了子力位置，并为下一阶段的布局作准备。";
  if (/^O-O/.test(san)) purpose = "易位先保证王安全，同时让车更快参与中心争夺。";
  else if (/^[a-h](x[a-h])?[1-8]/.test(san)) purpose = "兵的推进改变了中心空间与兵链，之后的攻防方向也会随之变化。";
  else if (/^N/.test(san)) purpose = "马向中心发展，增加对关键中心格的控制。";
  else if (/^B/.test(san)) purpose = "象被放到更有作用的对角线，并影响中心或王翼。";
  else if (/^R/.test(san)) purpose = "车进入更有潜力的线路，为中心开放后的行动作准备。";
  else if (/^Q/.test(san)) purpose = "后承担了具体的保护或施压任务；同时要留意被追赶的节奏。";
  if (san.includes("x")) purpose = `这次交换改变了局面的兵形或线路。${purpose}`;
  return `${move.san}：${purpose} 本变例的核心是：${variationFocus}`;
}

export function moveKey(move: Pick<TrainingMove, "from" | "to" | "promotion">) {
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}

export function isExpectedOpeningMove(actual: Pick<TrainingMove, "from" | "to" | "promotion">, expected?: TrainingMove) {
  return Boolean(expected && moveKey(actual) === moveKey(expected));
}

export function attemptOpeningMove(fen: string, from: Square, to: Square, expected?: TrainingMove) {
  const game = new Chess(fen);
  const originalFen = game.fen();
  const actual = game.move({ from, to, promotion: "q" });
  if (!actual) return null;
  const accepted = isExpectedOpeningMove(actual, expected);
  return { accepted, actual, fen: accepted ? game.fen() : originalFen };
}

export function applyUciMove(game: Chess, uci?: string) {
  if (!uci || !/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(uci)) return null;
  try {
    return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: (uci[4]?.toLowerCase() || "q") as "q" | "r" | "b" | "n" });
  } catch {
    return null;
  }
}
