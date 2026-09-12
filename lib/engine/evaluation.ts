export type Evaluation =
  | { kind: "cp"; value: number }
  | { kind: "mate"; value: number };

export function evaluationFrom(score: number, mate?: number): Evaluation {
  return mate === undefined ? { kind: "cp", value: score } : { kind: "mate", value: mate };
}

export function formatEvaluation(evaluation: Evaluation) {
  if (evaluation.kind === "mate") return `#${evaluation.value}`;
  return `${evaluation.value >= 0 ? "+" : ""}${evaluation.value.toFixed(2)}`;
}

export function evaluationLabel(evaluation: Evaluation) {
  if (evaluation.kind === "mate") {
    const side = evaluation.value > 0 ? "白方" : "黑方";
    return `${side}将在 ${Math.abs(evaluation.value)} 步内将杀`;
  }
  if (Math.abs(evaluation.value) < 0.15) return "局面接近均势";
  return evaluation.value > 0 ? "白方优势" : "黑方优势";
}
