import { Chess } from 'chess.js';

export type SavedStudy = {
  version: 1;
  pgn: string;
  notes: Record<number, string>;
  savedAt: string;
};

export function normalizePgnText(text: string) {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\[(https?:\/\/[^\]]+)\]\(\1\)/g, '$1')
    .trim();
}

export function parseStudyText(text: string, now = new Date()): SavedStudy {
  if (text.length > 1_000_000) throw new Error('棋谱超过 1 MB 限制');
  const normalized = normalizePgnText(text);
  if (!normalized) throw new Error('棋谱文件为空');

  let input: unknown = { version: 1, pgn: normalized, notes: {}, savedAt: now.toISOString() };
  if (normalized.startsWith('{')) {
    try {
      input = JSON.parse(normalized);
    } catch {
      // PGN comments are also allowed to begin with a brace.
    }
  }
  if (!input || typeof input !== 'object') throw new Error('棋谱结构无效');
  const data = input as Partial<SavedStudy>;
  if (
    data.version !== 1 ||
    typeof data.pgn !== 'string' ||
    typeof data.savedAt !== 'string' ||
    !data.notes ||
    typeof data.notes !== 'object' ||
    Array.isArray(data.notes)
  ) throw new Error('棋谱版本或字段无效');

  const checker = new Chess();
  const pgn = normalizePgnText(data.pgn);
  try {
    checker.loadPgn(pgn, { strict: false });
  } catch (error) {
    const offset = (error as { location?: { start?: { offset?: number } } }).location?.start?.offset;
    if (typeof offset === 'number') {
      const start = Math.max(0, pgn.slice(0, offset + 1).search(/[^\s{}()]+$/));
      const token = pgn.slice(start).match(/^[^\s{}()]+/)?.[0];
      if (token) throw new Error(`Invalid move in PGN: ${token}`, { cause: error });
    }
    throw error;
  }
  const notes: Record<number, string> = {};
  for (const [key, value] of Object.entries(data.notes)) {
    const ply = Number(key);
    if (!Number.isInteger(ply) || ply < 0 || ply > 10_000 || typeof value !== 'string' || value.length > 10_000) {
      throw new Error('棋谱笔记无效');
    }
    notes[ply] = value;
  }
  return { version: 1, pgn: checker.pgn({ newline: '\n', maxWidth: 0 }), notes, savedAt: data.savedAt };
}

export function importErrorText(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (/^[\u3400-\u9fff]/.test(message)) return `导入失败：${message}`;
  const invalidMove = message.match(/Invalid move in PGN:\s*(.+)/i);
  if (invalidMove) return `导入失败：棋谱中包含无法识别的招法“${invalidMove[1]}”。请检查该步及其前一着。`;
  return '导入失败：PGN 格式不正确。请检查标签、回合编号和招法是否完整。';
}
