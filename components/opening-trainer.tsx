"use client";
/* eslint-disable @next/next/no-img-element -- chess-piece SVGs are small local assets rendered on 64 fixed squares */

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, Square } from "chess.js";
import { BookOpenCheck, Bot, CalendarCheck, Check, ChevronRight, Clock3, ExternalLink, Flame, Lightbulb, ListTree, Medal, RotateCcw, Sparkles, Star, Target, Trophy } from "lucide-react";
import { OPENING_SAMPLES } from "@/lib/chess/opening-samples";
import { OPENING_THEORY_BY_SAMPLE } from "@/lib/chess/opening-variations";
import { attemptOpeningMove, fixedMoveExplanation, openingTrainingLineFromPgn } from "@/lib/chess/opening-trainer";
import { CoachConfig } from "@/lib/coach/config";
import { dueReviewKeys, learningLevel, learningStreak, localDateKey, parseTrainingProgress, recordTrainingCompletion, totalXp, TrainingProgressState } from "@/lib/chess/training-progress";

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

const PROGRESS_KEY = "squire-opening-progress-v1";

export function OpeningTrainer({ onReviewLine, coachConfig, onOpenCoachSettings }: { onReviewLine: (pgn: string) => void; coachConfig: CoachConfig | null; onOpenCoachSettings: () => void }) {
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
  const [savedProgress, setSavedProgress] = useState<TrainingProgressState>(() => parseTrainingProgress(null));
  const [lastReward, setLastReward] = useState<{ kind: "new" | "review"; xp: number } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const feedbackRequest = useRef(0);
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
  const totalGoals = Object.values(OPENING_THEORY_BY_SAMPLE).reduce((total, course) => total + course.variations.length * 2, 0);
  const completedGoals = Object.keys(savedProgress.records).length;
  const courseGoalPrefix = `${sample.id}/`;
  const courseCompleted = Object.keys(savedProgress.records).filter((key) => key.startsWith(courseGoalPrefix)).length;
  const today = localDateKey();
  const todayActivity = savedProgress.daily[today] ?? { newLessons: [], reviews: [], xp: 0 };
  const xp = totalXp(savedProgress);
  const level = learningLevel(xp);
  const streak = learningStreak(savedProgress);
  const dueReviews = dueReviewKeys(savedProgress);
  const reviewTarget = Math.min(savedProgress.plan.reviews, todayActivity.reviews.length + dueReviews.length);
  const currentGoalKey = `${sample.id}/${variation.id}/${studentColor}`;
  const currentRecord = savedProgress.records[currentGoalKey];

  useEffect(() => {
    // Progress is browser-local and can only be restored after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedProgress(parseTrainingProgress(localStorage.getItem(PROGRESS_KEY)));
  }, []);

  function markCompleted() {
    const accuracy = attempts + 1 ? Math.round((score + 1) / (attempts + 1) * 100) : 100;
    const result = recordTrainingCompletion(savedProgress, currentGoalKey, accuracy);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(result.state));
    setSavedProgress(result.state);
    setLastReward({ kind: result.kind, xp: result.xp });
  }

  function adjustPlan(field: "newLessons" | "reviews", delta: number) {
    const maximum = field === "newLessons" ? 10 : 20;
    const next: TrainingProgressState = { ...savedProgress, plan: { ...savedProgress.plan, [field]: Math.max(1, Math.min(maximum, savedProgress.plan[field] + delta)) } };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    setSavedProgress(next);
  }

  function startNextReview() {
    const [nextSample, nextVariation, nextColor] = dueReviews[0]?.split("/") ?? [];
    if (!nextSample || !nextVariation || (nextColor !== "w" && nextColor !== "b")) return;
    setSampleId(nextSample);
    setVariationId(nextVariation);
    setStudentColor(nextColor);
    setMode("test");
  }

  async function requestTrainingFeedback(positionFen: string, actualSan: string, expectedSan: string, correct: boolean, immediate: string, replySan?: string) {
    if (!coachConfig) { setFeedback(`${immediate}\n\n想获得针对本步的五段式 AI 深入讲解，请先在顶部“AI 设置”中填写自己的 API。`); return; }
    const requestId = ++feedbackRequest.current;
    setAiBusy(true);
    setFeedback(`${immediate}\n\nAI 老师正在核对局面并补充本步讲解…`);
    try {
      const position = new Chess(positionFen);
      const response = await fetch("/api/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "training", fen: positionFen, sideToMove: position.turn() === "w" ? "白方" : "黑方", question: `学员${correct ? "正确走出" : "尝试了"} ${actualSan}；课程预期 ${expectedSan}。${replySan ? `课程回应为 ${replySan}。` : ""}请全面解释预期着的局面作用、实际选择的取舍、双方后续计划与记忆方法。`, opening: `${variation.eco} · ${variation.name}；课程主题：${variation.focus}`, lines: [], config: coachConfig }) });
      const result = await response.json() as { answer?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "AI 服务返回错误");
      if (requestId === feedbackRequest.current) setFeedback(result.answer ?? immediate);
    } catch (error) {
      if (requestId === feedbackRequest.current) setFeedback(`${immediate}\n\nAI 深入讲解暂不可用：${error instanceof Error ? error.message : "请稍后重试"}`);
    } finally { if (requestId === feedbackRequest.current) setAiBusy(false); }
  }

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
    setAiBusy(false);
    feedbackRequest.current += 1;
    setDone(false);
    setLastReward(null);
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
    markCompleted();
    setFen(nextGame.fen());
    setDone(true);
    setBusy(false);
    setSelected(null);
    setFeedback(message);
  }

  function respondFromPosition(nextGame: Chess, nextBookPly: number, playedSan: string, expectedMove: NonNullable<typeof expected>) {
    if (nextGame.isGameOver()) {
      finish(nextGame, `训练结束。你完成了 ${attempts + 1} 次选择，其中 ${score + 1} 次命中主线。`);
      return;
    }
    if (line[nextBookPly] && line[nextBookPly].color !== studentColor) {
      const reply = line[nextBookPly];
      nextGame.move(reply);
      const afterReply = nextBookPly + 1;
      setBookPly(afterReply);
      if (afterReply >= line.length) {
        const message = `主线完成！你在 ${lessonMoves} 个训练节点中命中 ${score + 1} 个。现在可以进入复盘，查看整条变化。`;
        finish(nextGame, message);
        void requestTrainingFeedback(nextGame.fen(), playedSan, expectedMove.san, true, `${message}\n\n${fixedMoveExplanation(expectedMove, variation.focus)}`, reply.san);
        return;
      }
      setFen(nextGame.fen());
      setBusy(false);
      setFeedbackTone("correct");
      const message = `正确：${playedSan}。${fixedMoveExplanation(expectedMove, variation.focus)}\n\n对手回应 ${reply.san}：${fixedMoveExplanation(reply, variation.focus)}`;
      setFeedback(message);
      void requestTrainingFeedback(nextGame.fen(), playedSan, expectedMove.san, true, message, reply.san);
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
        const message = `走错了：${attempt.actual.san} 不是本课要求的 ${expectedMove?.san ?? "主线着法"}，棋盘已回到当前局面，请重新尝试。\n\n课程思路：${expectedMove ? fixedMoveExplanation(expectedMove, variation.focus) : variation.focus}`;
        setFeedback(message);
        if (expectedMove) void requestTrainingFeedback(fen, attempt.actual.san, expectedMove.san, false, message);
        return;
      }
      const nextGame = new Chess(attempt.fen);
      const nextBookPly = bookPly + 1;
      setScore((value) => value + 1);
      setBusy(true);
      setFen(attempt.fen);
      setFeedbackTone("correct");
      setFeedback(`正确：${attempt.actual.san}。电脑正在按课程回应…`);
      respondFromPosition(nextGame, nextBookPly, attempt.actual.san, expectedMove!);
      return;
    }
    if (piece?.color === studentColor) setSelected(square);
    else setSelected(null);
  }

  return <div className="trainer-hub mx-auto max-w-[1520px] px-4 py-6 xl:px-7">
    <section className="learning-dashboard">
      <div className="level-card"><div className="level-emblem"><Medal size={24} /><strong>Lv.{level.level}</strong></div><div><span>开局探索者</span><div className="level-track"><i style={{ width: `${Math.round(level.current / level.required * 100)}%` }} /></div><small>{level.current}/{level.required} XP · 累计 {xp} XP</small></div></div>
      <div className="daily-quests"><div className="quest-heading"><CalendarCheck size={18} /><div><strong>今日任务</strong><small>{todayActivity.newLessons.length >= savedProgress.plan.newLessons && todayActivity.reviews.length >= reviewTarget ? "今日目标全部完成！" : "完成新课，也别忘了巩固旧知识"}</small></div><span><Flame size={15} />连续 {streak} 天</span></div><div className="quest-row"><span>新关卡</span><div><i style={{ width: `${Math.min(100, todayActivity.newLessons.length / savedProgress.plan.newLessons * 100)}%` }} /></div><b>{todayActivity.newLessons.length}/{savedProgress.plan.newLessons}</b><button aria-label="减少每日新关卡" onClick={() => adjustPlan("newLessons", -1)}>−</button><button aria-label="增加每日新关卡" onClick={() => adjustPlan("newLessons", 1)}>＋</button></div><div className="quest-row"><span>复习</span><div><i style={{ width: `${reviewTarget ? Math.min(100, todayActivity.reviews.length / reviewTarget * 100) : 100}%` }} /></div><b>{todayActivity.reviews.length}/{reviewTarget}</b><button aria-label="减少每日复习上限" onClick={() => adjustPlan("reviews", -1)}>−</button><button aria-label="增加每日复习上限" onClick={() => adjustPlan("reviews", 1)}>＋</button></div></div>
      <div className="review-card"><Clock3 size={20} /><div><span>复习队列</span><strong>{dueReviews.length ? `${dueReviews.length} 关今天到期` : "今天没有到期内容"}</strong><small>{currentRecord ? `本关最佳 ${currentRecord.bestAccuracy}% · ${new Date(currentRecord.nextReviewAt).toLocaleDateString("zh-CN")} 再复习` : "首次通关后自动安排 1、2、4…天复习"}</small></div>{dueReviews.length > 0 && <button onClick={startNextReview}>开始复习<ChevronRight size={14} /></button>}</div>
    </section>
    <section className="challenge-map"><div className="challenge-map-title"><div><Sparkles size={17} /><span>{sample.name} · 闯关地图</span></div><small>选择关卡 · 当前执{studentColor === "w" ? "白" : "黑"}</small></div><div className="challenge-path">{theory.variations.map((item, index) => { const key = `${sample.id}/${item.id}/${studentColor}`; const record = savedProgress.records[key]; const due = dueReviews.includes(key); const active = item.id === variation.id; return <button key={item.id} className={`challenge-node ${record ? "passed" : ""} ${due ? "due" : ""} ${active ? "active" : ""}`} onClick={() => setVariationId(item.id)}><span>{record ? due ? <Clock3 size={17} /> : <Check size={17} /> : <Star size={16} />}</span><b>第 {index + 1} 关</b><small>{item.name}</small>{record && <em>{due ? "待复习" : `${record.bestAccuracy}%`}</em>}</button>; })}</div></section>
    {lastReward && done && <div className="reward-toast"><Trophy size={22} /><div><strong>{lastReward.xp ? `+${lastReward.xp} XP` : "今日已计分"}</strong><span>{lastReward.kind === "new" ? "新关卡通关！已加入复习计划" : "复习完成！记忆间隔已延长"}</span></div></div>}
    <div className="trainer-layout">
    <section className="trainer-stage">
      <div className="trainer-heading">
        <div><p>开局训练 · {variation.eco}</p><h1>{variation.name}</h1><span>{sample.name} · {Math.ceil(line.length / 2)} 回合固定课程</span></div>
        <div className="trainer-progress"><span>当前变例</span><strong>{progress}%</strong><div><i style={{ width: `${progress}%` }} /></div><small>总完成 {completedGoals}/{totalGoals} · 本课程 {courseCompleted}/{theory.variations.length * 2}</small></div>
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
        <label>学习变例（{theory.variations.length} 条 · 每条 12 回合）<select value={variation.id} onChange={(event) => setVariationId(event.target.value)}>{theory.variations.map((item) => <option key={item.id} value={item.id}>{item.eco} · {item.name}</option>)}</select></label>
        <div className="trainer-options"><div><span>执棋方</span><button className={studentColor === "w" ? "active" : ""} onClick={() => setStudentColor("w")}>白方</button><button className={studentColor === "b" ? "active" : ""} onClick={() => setStudentColor("b")}>黑方</button></div><div><span>模式</span><button className={mode === "learn" ? "active" : ""} onClick={() => setMode("learn")}>教学</button><button className={mode === "test" ? "active" : ""} onClick={() => setMode("test")}>测试</button></div></div>
      </section>
      <section className="panel trainer-lesson"><div className="panel-title"><BookOpenCheck size={17} /><span>固定理论讲解</span></div><p>{theory.introduction}</p><div className="variation-focus"><ListTree size={15} /><div><small>{variation.eco} · {variation.name}</small><strong>{variation.focus}</strong></div></div><ul className="theory-plans">{theory.plans.map((plan) => <li key={plan}>{plan}</li>)}</ul><div className="lesson-focus"><small>{onBook ? `第 ${Math.floor(bookPly / 2) + 1} 回合` : "自由变化"}</small><strong>{mode === "learn" && expected?.color === studentColor ? `尝试走：${expected.san}` : mode === "test" ? "找出最符合本课思路的走法" : "观察电脑回应"}</strong></div>
        <button className="hint-button" disabled={!expected || expected.color !== studentColor || done} onClick={() => expected && setFeedback(`固定课程提示：${fixedMoveExplanation(expected, variation.focus)}`)}><Lightbulb size={15} />查看本步意图</button>
        <div className="theory-sources"><span>资料来源</span>{theory.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}<ExternalLink size={12} /></a>)}</div>
      </section>
      <section className={`panel trainer-feedback ${feedbackTone}`}><div className="panel-title"><Bot size={17} /><span>陪练反馈</span><span className="feedback-source">{aiBusy ? "AI 讲解中…" : coachConfig ? "固定理论 + AI" : "固定理论"}</span></div><p aria-live="assertive">{feedback}</p>{!coachConfig && <button className="hint-button" onClick={onOpenCoachSettings}><Bot size={14} />连接 AI 深入讲每一步</button>}{done && <div className="trainer-result"><Trophy size={22} /><div><strong>{attempts ? Math.round(score / attempts * 100) : 0} 分</strong><span>主线命中率 · 已计入总进度</span></div></div>}</section>
      <div className="trainer-actions"><button onClick={resetLesson}><RotateCcw size={16} />重新训练</button><button className="primary" onClick={() => onReviewLine(variation.pgn)}>进入完整复盘<ChevronRight size={16} /></button></div>
      <p className="trainer-privacy">课程着序与基础讲解来自固定资料库；连接个人 API 后，每次选择都会额外生成并校验本步 AI 讲解。进度与配置只保存在当前浏览器。</p>
    </aside>
    </div>
  </div>;
}
