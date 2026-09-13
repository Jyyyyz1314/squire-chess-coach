import { Chess } from "chess.js";
import type { LichessGame } from "./types";

export type PlayerProfile = {
  sampleSize: number;
  analysedGames: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  averageAccuracy: number | null;
  qualityScore: number | null;
  blundersPerGame: number | null;
  style: "主动进攻型" | "稳健防守型" | "均衡型" | "战术实战型";
  aggression: number;
  solidity: number;
  dimensions: Array<{ key: string; label: string; value: number; note: string }>;
  progress: number | null;
  progressLabel: string;
  strengths: string[];
  priorities: string[];
  openings: Array<{ name: string; games: number; score: number }>;
};

type GameMetrics = {
  date: number;
  result: number;
  quality: number | null;
  blunders: number | null;
  captures: number;
  checks: number;
  playerMoves: number;
  castled: boolean;
  earlyQueenMoves: number;
  opening: string;
};

const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

function playerColor(game: LichessGame, username: string) {
  const normalized = username.toLowerCase();
  if ((game.players.white.user?.id ?? game.players.white.user?.name ?? game.players.white.userId ?? game.players.white.name ?? "").toLowerCase() === normalized) return "white" as const;
  if ((game.players.black.user?.id ?? game.players.black.user?.name ?? game.players.black.userId ?? game.players.black.name ?? "").toLowerCase() === normalized) return "black" as const;
  return null;
}

function metricsForGame(game: LichessGame, username: string): GameMetrics | null {
  const color = playerColor(game, username);
  if (!color || !game.moves || (game.variant && game.variant !== "standard" && game.variant !== "fromPosition")) return null;
  const playerIsWhite = color === "white";
  const won = game.winner === color;
  const result = game.winner ? (won ? 1 : 0) : 0.5;
  let captures = 0;
  let checks = 0;
  let playerMoves = 0;
  let castled = false;
  let earlyQueenMoves = 0;
  const chess = new Chess();
  for (const [ply, notation] of game.moves.trim().split(/\s+/).entries()) {
    if (!notation) continue;
    try {
      const move = /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(notation)
        ? chess.move({ from: notation.slice(0, 2), to: notation.slice(2, 4), promotion: (notation[4] || "q") as "q" })
        : chess.move(notation);
      const isPlayerMove = ply % 2 === (playerIsWhite ? 0 : 1);
      if (!isPlayerMove) continue;
      playerMoves += 1;
      if (move.captured) captures += 1;
      if (move.san.includes("+") || move.san.includes("#")) checks += 1;
      if (move.san.startsWith("O-O")) castled = true;
      if (move.piece === "q" && ply < 20) earlyQueenMoves += 1;
    } catch {
      break;
    }
  }
  const analysis = game.analysis ?? [];
  const summary = game.players[color].analysis;
  let inaccuracies = summary?.inaccuracy ?? 0;
  let mistakes = summary?.mistake ?? 0;
  let blunders = summary?.blunder ?? 0;
  if (!summary) {
    for (const [ply, item] of analysis.entries()) {
      if (ply % 2 !== (playerIsWhite ? 0 : 1)) continue;
      const name = item.judgment?.name?.toLowerCase();
      if (name === "inaccuracy") inaccuracies += 1;
      if (name === "mistake") mistakes += 1;
      if (name === "blunder") blunders += 1;
    }
  }
  const officialAccuracy = summary?.accuracy ?? game.accuracy?.[color];
  const hasAnalysis = Boolean(summary) || analysis.length > 0;
  const quality = typeof officialAccuracy === "number"
    ? officialAccuracy
    : hasAnalysis
      ? clamp(100 - inaccuracies * 2 - mistakes * 6 - blunders * 12, 25, 100)
      : null;
  return {
    date: game.createdAt,
    result,
    quality,
    blunders: hasAnalysis ? blunders : null,
    captures,
    checks,
    playerMoves,
    castled,
    earlyQueenMoves,
    opening: game.opening?.name || "未分类开局",
  };
}

export function buildPlayerProfile(games: LichessGame[], username: string): PlayerProfile {
  const metrics = games.map((game) => metricsForGame(game, username)).filter((item): item is GameMetrics => Boolean(item));
  const totalMoves = metrics.reduce((sum, item) => sum + item.playerMoves, 0) || 1;
  const captureRate = metrics.reduce((sum, item) => sum + item.captures, 0) / totalMoves;
  const checkRate = metrics.reduce((sum, item) => sum + item.checks, 0) / totalMoves;
  const castleRate = metrics.length ? metrics.filter((item) => item.castled).length / metrics.length : 0;
  const earlyQueenRate = metrics.length ? metrics.reduce((sum, item) => sum + item.earlyQueenMoves, 0) / metrics.length : 0;
  const aggression = Math.round(clamp(30 + captureRate * 170 + checkRate * 300 + earlyQueenRate * 12));
  const solidity = Math.round(clamp(32 + castleRate * 52 - earlyQueenRate * 10 + (1 - captureRate) * 18));
  const style = aggression >= 66
    ? (solidity < 46 ? "战术实战型" : "主动进攻型")
    : aggression <= 48 && solidity >= 65
      ? "稳健防守型"
      : "均衡型";
  const qualities = metrics.map((item) => item.quality).filter((value): value is number => value !== null);
  const blunderValues = metrics.map((item) => item.blunders).filter((value): value is number => value !== null);
  const chronological = metrics.filter((item) => item.quality !== null).sort((a, b) => a.date - b.date);
  const middle = Math.floor(chronological.length / 2);
  const older = chronological.slice(0, middle).map((item) => item.quality as number);
  const recent = chronological.slice(middle).map((item) => item.quality as number);
  const oldQuality = average(older);
  const recentQuality = average(recent);
  const progress = oldQuality !== null && recentQuality !== null && chronological.length >= 6 ? recentQuality - oldQuality : null;
  const openingMap = new Map<string, { games: number; points: number }>();
  for (const item of metrics) {
    const current = openingMap.get(item.opening) ?? { games: 0, points: 0 };
    current.games += 1;
    current.points += item.result;
    openingMap.set(item.opening, current);
  }
  const openings = [...openingMap.entries()]
    .map(([name, value]) => ({ name, games: value.games, score: Math.round(value.points / value.games * 100) }))
    .sort((a, b) => b.games - a.games || b.score - a.score)
    .slice(0, 4);
  const wins = metrics.filter((item) => item.result === 1).length;
  const draws = metrics.filter((item) => item.result === 0.5).length;
  const losses = metrics.length - wins - draws;
  const averageAccuracy = average(qualities);
  const blundersPerGame = average(blunderValues);
  const scoreRate = metrics.length ? (wins + draws * 0.5) / metrics.length : 0;
  const longGameRate = metrics.length ? metrics.filter((item) => item.playerMoves >= 30).length / metrics.length : 0;
  const tacticalActivity = Math.round(clamp(26 + captureRate * 185 + checkRate * 330));
  const kingSafety = Math.round(clamp(25 + castleRate * 68 - earlyQueenRate * 8));
  const openingDiscipline = Math.round(clamp(58 + castleRate * 28 - earlyQueenRate * 34));
  const consistency = Math.round(clamp(averageAccuracy ?? (52 + scoreRate * 24 - (blundersPerGame ?? 0) * 9)));
  const endgameExperience = Math.round(clamp(24 + longGameRate * 68 + scoreRate * 8));
  const dimensions = [
    { key: "initiative", label: "主动性", value: aggression, note: "根据吃子、将军与早期主动行动估算" },
    { key: "tactics", label: "战术活跃", value: tacticalActivity, note: "根据战术接触与将军频率估算" },
    { key: "king-safety", label: "王的安全", value: kingSafety, note: "根据易位习惯与开局节奏估算" },
    { key: "opening", label: "开局纪律", value: openingDiscipline, note: "根据发展顺序、易位与过早出后估算" },
    { key: "consistency", label: "行棋稳定", value: consistency, note: averageAccuracy === null ? "暂无云分析，以实战表现建立临时基线" : "优先采用 Lichess 行棋质量数据" },
    { key: "endgame", label: "残局经验", value: endgameExperience, note: "根据进入长局的频率与实战得分估算" },
  ];
  const strengths: string[] = [];
  if (castleRate >= 0.72) strengths.push("王的安全意识稳定");
  if (averageAccuracy !== null && averageAccuracy >= 82) strengths.push("行棋质量较稳定");
  if (aggression >= 62) strengths.push("善于制造主动机会");
  if (metrics.length && (wins + draws * 0.5) / metrics.length >= 0.58) strengths.push("近期实战得分良好");
  if (!strengths.length) strengths.push("样本正在积累，已有可追踪基线");
  const priorities: string[] = [];
  if (blundersPerGame !== null && blundersPerGame >= 0.75) priorities.push("优先减少一着失误：落子前固定做将军、吃子、威胁扫描");
  if (castleRate < 0.55) priorities.push("提高王的安全：尽量在开局阶段完成易位");
  if (earlyQueenRate >= 0.45) priorities.push("减少过早出后，先完成轻子发展与中心控制");
  const weakOpening = openings.filter((item) => item.games >= 3).sort((a, b) => a.score - b.score)[0];
  if (weakOpening && weakOpening.score < 42) priorities.push(`复盘“${weakOpening.name}”：${weakOpening.games} 盘仅取得 ${weakOpening.score}% 得分率`);
  if (qualities.length < Math.max(3, metrics.length / 3)) priorities.push("更多棋局需要 Lichess 云分析，才能提高质量趋势的可信度");
  if (!priorities.length) priorities.push("保持当前节奏，重点复盘胜负转折点并形成可复用笔记");
  return {
    sampleSize: metrics.length,
    analysedGames: qualities.length,
    wins,
    draws,
    losses,
    winRate: metrics.length ? Math.round((wins + draws * 0.5) / metrics.length * 100) : 0,
    averageAccuracy: averageAccuracy === null ? null : Math.round(averageAccuracy * 10) / 10,
    qualityScore: averageAccuracy === null ? null : Math.round(averageAccuracy),
    blundersPerGame: blundersPerGame === null ? null : Math.round(blundersPerGame * 100) / 100,
    style,
    aggression,
    solidity,
    dimensions,
    progress: progress === null ? null : Math.round(progress * 10) / 10,
    progressLabel: progress === null ? "分析样本不足" : progress >= 3 ? "近期明显进步" : progress <= -3 ? "近期状态回落" : "近期表现稳定",
    strengths: strengths.slice(0, 3),
    priorities: priorities.slice(0, 3),
    openings,
  };
}
