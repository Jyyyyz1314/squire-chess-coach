import { describe, expect, it } from 'vitest';
import { importErrorText, normalizePgnText, parseStudyText } from '../../lib/chess/study';

const lichessPgn = `[Event "rated rapid game"]
[Site "[https://lichess.org/UYSoinM3](https://lichess.org/UYSoinM3)"]
[Result "0-1"]

1. e4 c6 2. Nc3 d5 { B10 Caro-Kann Defense } 3. g3?! { Inaccuracy. d4 was best. } (3. d4 dxe4 4. Nxe4) 3... d4 4. Nce2 e5 0-1`;

describe('study import', () => {
  it('imports annotated Lichess PGN and ignores side variations in the main line', () => {
    const study = parseStudyText(lichessPgn, new Date('2026-09-11T00:00:00.000Z'));
    expect(study.pgn).toContain('1. e4 c6 2. Nc3 d5');
    expect(study.pgn).toContain('3. g3');
    expect(study.notes).toEqual({});
    expect(study.savedAt).toBe('2026-09-11T00:00:00.000Z');
  });

  it('normalizes Markdown links accidentally pasted inside PGN tags', () => {
    expect(normalizePgnText(lichessPgn)).toContain('[Site "https://lichess.org/UYSoinM3"]');
  });

  it('round-trips Squire notes without model answers', () => {
    const study = parseStudyText(JSON.stringify({ version: 1, pgn: '1. e4 e5 2. Nf3 *', notes: { 3: '先发展再进攻' }, savedAt: '2026-09-11T00:00:00.000Z' }));
    expect(study.notes[3]).toBe('先发展再进攻');
    expect(study).not.toHaveProperty('teacherAnswer');
  });

  it('returns a useful Chinese error for an illegal move', () => {
    let error: unknown;
    try { parseStudyText('1. e4 e5 2. Qh9 *'); } catch (caught) { error = caught; }
    expect(importErrorText(error)).toContain('导入失败');
    expect(importErrorText(error)).toContain('Qh9');
  });
});
