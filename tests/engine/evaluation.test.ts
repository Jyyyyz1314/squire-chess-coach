import { describe, expect, it } from 'vitest';
import { evaluationFrom, evaluationLabel, formatEvaluation } from '../../lib/engine/evaluation';

describe('engine evaluation', () => {
  it('formats centipawn scores from White perspective', () => {
    expect(formatEvaluation(evaluationFrom(0.42))).toBe('+0.42');
    expect(formatEvaluation(evaluationFrom(-1.25))).toBe('-1.25');
    expect(evaluationLabel(evaluationFrom(0.05))).toBe('局面接近均势');
    expect(evaluationLabel(evaluationFrom(-0.3))).toBe('黑方优势');
  });

  it('preserves mate direction instead of converting it to a score', () => {
    expect(formatEvaluation(evaluationFrom(0, 3))).toBe('#3');
    expect(formatEvaluation(evaluationFrom(0, -2))).toBe('#-2');
    expect(evaluationLabel(evaluationFrom(0, 3))).toBe('白方将在 3 步内将杀');
    expect(evaluationLabel(evaluationFrom(0, -2))).toBe('黑方将在 2 步内将杀');
  });
});
