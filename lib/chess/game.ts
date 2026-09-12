import { Chess } from 'chess.js';
import { DEFAULT_OPENING_SAMPLE } from './opening-samples';
export const SAMPLE = DEFAULT_OPENING_SAMPLE.pgn;
export function parseGame(pgn: string) {
  if (pgn.length > 1_000_000) throw new Error('棋谱超过 1 MB 限制');
  const game = new Chess();
  game.loadPgn(pgn, { strict: true });
  return game;
}
export function positionAt(pgn: string, ply: number) {
  const source = parseGame(pgn);
  const game = new Chess(source.getHeaders().FEN);
  for (const move of source.history().slice(0, ply)) game.move(move);
  return game;
}
export function saveNote(pgn: string, ply: number, text: string) {
  const source = parseGame(pgn);
  const moves = source.history();
  const comments = new Map(source.getComments().map(c => [c.fen, c.comment]));
  const game = new Chess(source.getHeaders().FEN);
  for (const [key, value] of Object.entries(source.getHeaders())) game.setHeader(key, value);
  const target = positionAt(pgn, ply).fen();
  const attach = () => {
    const comment = game.fen() === target ? text : comments.get(game.fen());
    if (comment) game.setComment(comment);
  };
  attach();
  for (const move of moves) { game.move(move); attach(); }
  return game.pgn();
}
export function opening(moves: string[]) {
  const line = moves.join(' ');
  if (line.startsWith('e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3')) return 'C54 · 意大利开局 / 慢攻体系';
  if (line.startsWith('e4 e5 Nf3 Nc6 Bc4')) return 'C50 · 意大利开局';
  if (line.startsWith('e4 e5 Nf3 Nc6 Bb5')) return 'C60 · 西班牙开局';
  if (line.startsWith('e4 c5')) return 'B20 · 西西里防御';
  if (line.startsWith('d4 d5 c4')) return 'D06 · 后翼弃兵';
  return moves.length ? '未匹配内置开局库' : '初始局面';
}
