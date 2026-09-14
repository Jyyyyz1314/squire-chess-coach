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
  let purpose = "协调尚未充分发挥的子力，为下一阶段的中心争夺准备更多选择。";
  let followUp = "下一步先检查对方的中心反击，再决定突破或继续发展。";
  let checkpoint = "不要只记格子，要记住这步改善了哪枚最差的棋子。";
  if (/^O-O/.test(san)) { purpose = "一次完成王安全与车的发展，让中心即使打开也不容易暴露王。"; followUp = "随后通常把车放到将要开放的中心线，并确认王前兵没有被轻率推进。"; checkpoint = "中心可能打开时，先比较双方王的安全。"; }
  else if (/^[a-h](x[a-h])?[1-8]/.test(san)) { purpose = "用兵改变中心空间、兵链支点和棋子的通路；兵不能后退，因此这是一项结构承诺。"; followUp = "观察这步留下的弱格、打开的线路，以及对方能否立即反击兵链根部。"; checkpoint = "推兵前问：我获得什么空间，又永久放弃了哪个格子？"; }
  else if (/^N/.test(san)) { purpose = "发展马并争夺中心关键格，让它同时承担进攻与防守任务。"; followUp = "接着发展另一枚轻子或完成易位，避免同一枚马在开局反复移动丢失节奏。"; checkpoint = "马优先寻找既控制中心、又不易被兵赶走的格子。"; }
  else if (/^B/.test(san)) { purpose = "把象放到有实际目标的对角线，影响中心、王翼或限制对方发展。"; followUp = "判断中心将开放还是封闭，再决定保留象、交换关键防守子或后撤。"; checkpoint = "象的价值来自对角线；先看兵链朝向，再选好象与坏象。"; }
  else if (/^R/.test(san)) { purpose = "让车占据开放或可能开放的线路，并与另一辆车建立协调。"; followUp = "先完成重子连接，再寻找沿线侵入或支持中心突破的机会。"; checkpoint = "车需要线路，不要让自己的兵长期堵住它。"; }
  else if (/^Q/.test(san)) { purpose = "后承担具体的保护、施压或连接任务，但也可能成为被追赶的目标。"; followUp = "确认对方不能用发展棋子的同时攻击后，避免为撤后连续丢失节奏。"; checkpoint = "后早出必须有具体理由，而且不能妨碍轻子发展。"; }
  if (san.includes("x")) purpose = `这次交换会改变材料、兵形或线路。${purpose}`;
  if (move.san.includes("+")) followUp = `将军迫使对方先回应，但仍要检查将军结束后自己的子力是否协调。${followUp}`;
  return `${move.san}｜作用：${purpose}\n后续：${followUp}\n记忆：${checkpoint}\n本变例的核心：${variationFocus}`;
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
