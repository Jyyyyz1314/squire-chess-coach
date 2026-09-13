"use client";
/* eslint-disable @next/next/no-img-element -- chess-piece SVGs are small local assets rendered on 64 fixed squares */

import { useEffect, useMemo, useState } from "react";
import { Chess, Square } from "chess.js";
import { BookOpenCheck, Bot, ChevronRight, ExternalLink, Lightbulb, ListTree, RotateCcw, Target, Trophy } from "lucide-react";
import { OPENING_SAMPLES } from "@/lib/chess/opening-samples";
import { OPENING_THEORY_BY_SAMPLE } from "@/lib/chess/opening-variations";
import { attemptOpeningMove, fixedMoveExplanation, openingTrainingLineFromPgn } from "@/lib/chess/opening-trainer";

type StudentColor = "w" | "b";
type TrainingMode = "learn" | "test";

function coordinates(color: StudentColor) {
  const files = color === "w" ? "abcdefgh" : "hgfedcba";
  const ranks = color === "w" ? "87654321" : "12345678";
  return [...ranks].flatMap((rank) => [...files].map((file) => `${file}${rank}` as Square));
}

function plyFromFen(position: string) {
  const [, turn, , , , fullMove = "1"] = position.split(" ");
  return (Math.max(1, Number.parseInt(fullMove, 10) || 1) - 1) * 2 + (turn === "b" ? 1 : 0);
}

export function OpeningTrainer({ onReviewLine }: { onReviewLine: (pgn: string) => void }) {
  const [sampleId, setSampleId] = useState(OPENING_SAMPLES[0].id);
  const [variationId, setVariationId] = useState(() => OPENING_THEORY_BY_SAMPLE[OPENING_SAMPLES[0].id].variations[0].id);
  const [studentColor, setStudentColor] = useState<StudentColor>("w");
  const [mode, setMode] = useState<TrainingMode>("learn");
  const [fen, setFen] = useState(() => new Chess().fen());
  const [bookPly, setBookPly] = useState(0);
  const [onBook, setOnBook] = useState(true);
  const [selected, setSelected] = useState<Square | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("请选择棋子，走出你认为正确的开局着法。");
  const [feedbackTone, setFeedbackTone] = useState<"neutral" | "correct" | "error">("neutral");
  const sample = OPENING_SAMPLES.find((item) => item.id === sampleId) ?? OPENING_SAMPLES[0];
  const theory = OPENING_THEORY_BY_SAMPLE[sample.id];
  const variation = theory.variations.find((item) => item.id === variationId) ?? theory.variations[0];
  const line = useMemo(() => openingTrainingLineFromPgn(variation.pgn), [variation.pgn]);
  const game = useMemo(() => new Chess(fen), [fen]);
  const squares = useMemo(() => coordinates(studentColor), [studentColor]);
  const legalTargets = selected ? game.moves({ square: selected, verbose: true }).map((move) => move.to) : [];
  const expected = onBook ? line[bookPly] : undefined;
  const studentTurn = game.turn() === studentColor;
  const lessonMoves = line.filter((move) => move.color === studentColor).length;
  const progress = Math.min(100, Math.round(plyFromFen(fen) / Math.max(line.length, 1) * 100));

  function resetLesson() {
    const fresh = new Chess();
    let nextPly = 0;
    if (studentColor === "b" && line[0]) {
      fresh.move(line[0]);
      nextPly = 1;
    }
    setFen(fresh.fen());
    setBookPly(nextPly);
    setOnBook(true);
    setSelected(null);
    setBusy(false);
    setDone(false);
    setAttempts(0);
    setScore(0);
    setFeedbackTone("neutral");
    setFeedback(mode === "learn" ? "跟随主线理解每一步的目的；需要时可以查看提示。" : "测试已开始：提示默认隐藏，走出你认为正确的着法。");
  }

  useEffect(() => {
    // A configuration change intentionally starts a fresh training session.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetLesson();
    // Resetting is intentionally tied to lesson configuration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sampleId, variationId, studentColor, mode]);

  function changeCourse(nextSampleId: string) {
    setSampleId(nextSampleId);
    setVariationId(OPENING_THEORY_BY_SAMPLE[nextSampleId].variations[0].id);
  }

  function finish(nextGame: Chess, message: string) {
    setFen(nextGame.fen());
    setDone(true);
    setBusy(false);
    setSelected(null);
    setFeedback(message);
  }

  function respondFromPosition(nextGame: Chess, nextBookPly: number, playedSan: string) {
    if (nextGame.isGameOver() || plyFromFen(nextGame.fen()) >= 20) {
      finish(nextGame, `训练结束。你完成了 ${attempts + 1} 次选择，其中 ${score + 1} 次命中主线。`);
      return;
    }
    if (line[nextBookPly] && line[nextBookPly].color !== studentColor) {
      const reply = line[nextBookPly];
      nextGame.move(reply);
      const afterReply = nextBookPly + 1;
      setBookPly(afterReply);
      if (afterReply >= line.length) {
        finish(nextGame, `主线完成！你在 ${lessonMoves} 个训练节点中命中 ${score + 1} 个。现在可以进入复盘，查看整条变化。`);
        return;
      }
      setFen(nextGame.fen());
      setBusy(false);
      setFeedbackTone("correct");
      setFeedback(`正确：${playedSan}。电脑按主线回应。${fixedMoveExplanation(reply, variation.focus)}`);
      return;
    }
    if (nextBookPly >= line.length) {
      finish(nextGame, `主线完成！你在 ${lessonMoves} 个训练节点中命中 ${score + 1} 个。`);
      return;
    }
  }

  function onSquare(square: Square) {
    if (busy || done || !studentTurn) return;
    const piece = game.get(square);
    if (selected && legalTargets.includes(square)) {
      const expectedMove = expected;
      const attempt = attemptOpeningMove(fen, selected, square, expectedMove);
      if (!attempt) return;
      setAttempts((value) => value + 1);
      setSelected(null);
      if (!attempt.accepted) {
        setFeedbackTone("error");
        setFeedback(`走错了：${attempt.actual.san} 不是本课着法。棋盘已回到当前局面，请重新尝试这一手。${mode === "learn" ? ` 本课目标是 ${expectedMove?.san ?? "正确着法"}。` : ""}`);
        return;
      }
      const nextGame = new Chess(attempt.fen);
      const nextBookPly = bookPly + 1;
      setScore((value) => value + 1);
      setBusy(true);
      setFen(attempt.fen);
      setFeedbackTone("correct");
      setFeedback(`正确：${attempt.actual.san}。电脑正在按课程回应…`);
      respondFromPosition(nextGame, nextBookPly, attempt.actual.san);
      return;
    }
    if (piece?.color === studentColor) setSelected(square);
    else setSelected(null);
  }

  return <div className="trainer-layout mx-auto max-w-[1520px] px-4 py-6 xl:px-7">
    <section className="trainer-stage">
      <div className="trainer-heading">
        <div><p>开局训练 · {variation.eco}</p><h1>{variation.name}</h1><span>{sample.name} · {Math.ceil(line.length / 2)} 回合固定课程</span></div>
        <div className="trainer-progress"><span>训练进度</span><strong>{progress}%</strong><div><i style={{ width: `${progress}%` }} /></div></div>
      </div>
      <div className="board-shell"><div className="chessboard" aria-label={`${variation.name}训练棋盘`}>{squares.map((square, index) => {
        const piece = game.get(square);
        const row = Math.floor(index / 8);
        const col = index % 8;
        const dark = (Number(square[1]) + square.charCodeAt(0)) % 2 === 1;
        return <button key={square} onClick={() => onSquare(square)} disabled={busy || done || !studentTurn} aria-label={square} className={`square ${dark ? "dark" : "light"} ${selected === square ? "selected" : ""}`}>
          {col === 0 && <span className="rank">{square[1]}</span>}{row === 7 && <span className="file">{square[0]}</span>}
          {legalTargets.includes(square) && <span className="target" />}{piece && <img aria-hidden="true" draggable={false} className="piece-image" src={`/pieces/cburnett/${piece.color}${piece.type.toUpperCase()}.svg`} alt="" />}
        </button>;
      })}</div></div>
      <div className="trainer-underboard"><span className={studentTurn ? "ready" : ""}>{done ? "本轮已完成" : busy ? "电脑思考中…" : studentTurn ? "轮到你走" : "准备电脑回应"}</span><span>你执{studentColor === "w" ? "白" : "黑"} · {score}/{attempts} 命中</span></div>
    </section>
    <aside className="trainer-sidebar">
      <section className="panel trainer-config"><div className="panel-title"><Target size={17} /><span>训练设置</span></div>
        <label>开局课程<select value={sampleId} onChange={(event) => changeCourse(event.target.value)}>{OPENING_SAMPLES.map((item) => <option key={item.id} value={item.id}>{item.eco} · {item.name}</option>)}</select></label>
        <label>学习变例（{theory.variations.length} 条）<select value={variation.id} onChange={(event) => setVariationId(event.target.value)}>{theory.variations.map((item) => <option key={item.id} value={item.id}>{item.eco} · {item.name}</option>)}</select></label>
        <div className="trainer-options"><div><span>执棋方</span><button className={studentColor === "w" ? "active" : ""} onClick={() => setStudentColor("w")}>白方</button><button className={studentColor === "b" ? "active" : ""} onClick={() => setStudentColor("b")}>黑方</button></div><div><span>模式</span><button className={mode === "learn" ? "active" : ""} onClick={() => setMode("learn")}>教学</button><button className={mode === "test" ? "active" : ""} onClick={() => setMode("test")}>测试</button></div></div>
      </section>
      <section className="panel trainer-lesson"><div className="panel-title"><BookOpenCheck size={17} /><span>固定理论讲解</span></div><p>{theory.introduction}</p><div className="variation-focus"><ListTree size={15} /><div><small>{variation.eco} · {variation.name}</small><strong>{variation.focus}</strong></div></div><ul className="theory-plans">{theory.plans.map((plan) => <li key={plan}>{plan}</li>)}</ul><div className="lesson-focus"><small>{onBook ? `第 ${Math.floor(bookPly / 2) + 1} 回合` : "自由变化"}</small><strong>{mode === "learn" && expected?.color === studentColor ? `尝试走：${expected.san}` : mode === "test" ? "找出最符合本课思路的走法" : "观察电脑回应"}</strong></div>
        <button className="hint-button" disabled={!expected || expected.color !== studentColor || done} onClick={() => expected && setFeedback(`固定课程提示：${fixedMoveExplanation(expected, variation.focus)}`)}><Lightbulb size={15} />查看本步意图</button>
        <div className="theory-sources"><span>资料来源</span>{theory.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}<ExternalLink size={12} /></a>)}</div>
      </section>
      <section className={`panel trainer-feedback ${feedbackTone}`}><div className="panel-title"><Bot size={17} /><span>陪练反馈</span></div><p aria-live="assertive">{feedback}</p>{done && <div className="trainer-result"><Trophy size={22} /><div><strong>{attempts ? Math.round(score / attempts * 100) : 0} 分</strong><span>主线命中率</span></div></div>}</section>
      <div className="trainer-actions"><button onClick={resetLesson}><RotateCcw size={16} />重新训练</button><button className="primary" onClick={() => onReviewLine(variation.pgn)}>进入完整复盘<ChevronRight size={16} /></button></div>
      <p className="trainer-privacy">答错后保留当前局面并重新尝试；课程训练、本步提示和电脑应手均来自本地固定课程，不调用大模型。</p>
    </aside>
  </div>;
}
