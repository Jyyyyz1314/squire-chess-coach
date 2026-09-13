"use client";

import { useEffect, useMemo, useState } from "react";
import { CloudDownload, ExternalLink, LoaderCircle, LogOut, RefreshCw, ShieldCheck, TrendingUp, UserRoundSearch } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildPlayerProfile } from "@/lib/lichess/profile";
import type { LichessGame } from "@/lib/lichess/types";

type Session = {
  configured: boolean;
  authenticated: boolean;
  user?: { username: string; perfs?: Record<string, { games?: number; rating?: number; prog?: number }> };
  error?: string;
};

type CachedSync = { version: 1; username: string; syncedAt: string; games: LichessGame[] };

const CACHE_KEY = "squire-lichess-games-v1";

function readCachedSync() {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(CACHE_KEY) || "null") as CachedSync | null;
    return value?.version === 1 && Array.isArray(value.games) && typeof value.username === "string" ? value : null;
  } catch {
    return null;
  }
}

function readOAuthStatus() {
  return typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("lichess");
}

function displayPlayer(game: LichessGame, color: "white" | "black") {
  const player = game.players[color];
  return player.user?.name || player.user?.id || player.userId || player.name || (player.aiLevel ? `AI ${player.aiLevel}` : "匿名棋手");
}

function gameResult(game: LichessGame) {
  if (!game.winner) return "½–½";
  return game.winner === "white" ? "1–0" : "0–1";
}

function bestRating(session: Session | null) {
  const entries = Object.entries(session?.user?.perfs ?? {}).filter(([, value]) => typeof value.rating === "number" && (value.games ?? 0) > 0);
  return entries.sort(([, a], [, b]) => (b.games ?? 0) - (a.games ?? 0))[0];
}

export function LichessProfile({ onOpenGame }: { onOpenGame: (pgn: string) => void }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [cached, setCached] = useState<CachedSync | null>(null);
  const [showCached, setShowCached] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const oauthStatus = readOAuthStatus();
    if (oauthStatus) {
      const params = new URLSearchParams(window.location.search);
      params.delete("lichess");
      window.history.replaceState({}, "", `${window.location.pathname}${params.size ? `?${params}` : ""}${window.location.hash}`);
    }
    void Promise.resolve().then(() => {
      setCached(readCachedSync());
      if (oauthStatus) {
        setOpen(true);
        if (oauthStatus !== "connected") setError(oauthStatus === "invalid_state" ? "授权校验失败，请重新登录。" : "Lichess 授权没有完成，请重试。");
      }
    });
    void fetch("/api/lichess/session", { cache: "no-store" })
      .then(async (response) => response.json() as Promise<Session>)
      .then(setSession)
      .catch(() => setSession({ configured: true, authenticated: false, error: "无法检查 Lichess 登录状态" }));
  }, []);

  async function syncGames() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/lichess/games?max=60", { cache: "no-store" });
      const result = await response.json() as Omit<CachedSync, "version"> & { error?: string };
      if (!response.ok || result.error) throw new Error(result.error || "同步失败");
      const next: CachedSync = { version: 1, username: result.username, syncedAt: result.syncedAt, games: result.games };
      localStorage.setItem(CACHE_KEY, JSON.stringify(next));
      setCached(next);
      setShowCached(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "同步失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      await fetch("/api/lichess/disconnect", { method: "POST" });
      setSession({ configured: session?.configured ?? true, authenticated: false });
    } finally {
      setBusy(false);
    }
  }

  const profile = useMemo(() => cached ? buildPlayerProfile(cached.games, cached.username) : null, [cached]);
  const rating = bestRating(session);
  const recentGames = cached?.games.slice(0, 5) ?? [];
  const isCurrentCache = cached && (!session?.authenticated || session.user?.username.toLowerCase() === cached.username.toLowerCase());

  return <>
    <button onClick={() => setOpen(true)} className="tool-button lichess-trigger"><UserRoundSearch size={16} /><span>棋手画像</span>{session?.authenticated && <i />}</button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="lichess-dialog border-white/10 bg-[#111827] text-slate-100 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><span className="lichess-mark">♞</span>Lichess 棋手画像</DialogTitle>
          <DialogDescription className="text-slate-400">同步你的近期实战，从六个维度识别棋风、行棋质量与最值得优先训练的环节。</DialogDescription>
        </DialogHeader>
        {session === null ? <div className="profile-empty"><LoaderCircle className="animate-spin" /><p>正在检查登录状态…</p></div> : !session.configured ? <div className="profile-empty">
          <ShieldCheck size={34} />
          <h3>需要先启用安全连接</h3>
          <p>请在服务器的 <code>.env.local</code> 中配置 <code>LICHESS_SESSION_SECRET</code>，重启后即可使用官方授权登录。密钥不会进入浏览器或 Git。</p>
        </div> : !session.authenticated && !showCached ? <div className="profile-connect">
          <div className="profile-connect-art"><span>♞</span><div><strong>连接你的 Lichess</strong><small>只读取公开账号信息和历史棋局，不会替你下棋。</small></div></div>
          {session.error && <p className="profile-error">{session.error}</p>}
          {error && <p className="profile-error">{error}</p>}
          <a className="lichess-login" href="/api/lichess/auth/start">使用 Lichess 授权登录 <ExternalLink size={15} /></a>
          {cached && <button className="cached-profile-button" onClick={() => setShowCached(true)}>查看上次同步的 {cached.username} 画像</button>}
        </div> : <div className="profile-content">
          <div className="profile-account">
            <div><span className="profile-avatar">{(session.user?.username || cached?.username || "L").slice(0, 1).toUpperCase()}</span><div><strong>{session.user?.username || cached?.username}</strong><small>{session.authenticated ? (rating ? `${rating[0]} · ${rating[1].rating}` : "Lichess 已连接") : "离线缓存画像"}</small></div></div>
            <div className="profile-account-actions">{session.authenticated ? <><button onClick={syncGames} disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={15} /> : <RefreshCw size={15} />}{cached && isCurrentCache ? "更新画像" : "同步最近 60 盘"}</button><button aria-label="断开 Lichess" title="断开 Lichess" onClick={disconnect} disabled={busy}><LogOut size={15} /></button></> : <a className="profile-reconnect" href="/api/lichess/auth/start">重新连接</a>}</div>
          </div>
          {error && <p className="profile-error">{error}</p>}
          {!profile || !isCurrentCache ? <div className="profile-empty compact"><CloudDownload size={34} /><h3>开始建立你的棋手画像</h3><p>首次同步会读取最近 60 盘已结束棋局；数据分析在浏览器内完成并保存在本机。</p><button onClick={syncGames} disabled={busy} className="lichess-login">{busy ? "正在同步…" : "同步棋局"}</button></div> : <>
            <div className="profile-meta"><span>最近同步 {new Date(cached.syncedAt).toLocaleString("zh-CN")}</span><span>{profile.sampleSize} 盘标准棋 · {profile.analysedGames} 盘含质量数据</span></div>
            <div className="profile-kpis">
              <article><small>棋风画像</small><strong>{profile.style}</strong><span>进攻 {profile.aggression} · 稳健 {profile.solidity}</span></article>
              <article><small>实战得分率</small><strong>{profile.winRate}%</strong><span>{profile.wins} 胜 · {profile.draws} 和 · {profile.losses} 负</span></article>
              <article><small>平均行棋质量</small><strong>{profile.averageAccuracy === null ? "—" : `${profile.averageAccuracy}%`}</strong><span>{profile.averageAccuracy === null ? "等待云分析样本" : `每盘大漏 ${profile.blundersPerGame ?? 0} 次`}</span></article>
              <article><small>近期趋势</small><strong className={profile.progress !== null && profile.progress >= 3 ? "positive" : profile.progress !== null && profile.progress <= -3 ? "negative" : ""}>{profile.progress === null ? "样本不足" : `${profile.progress >= 0 ? "+" : ""}${profile.progress}`}</strong><span>{profile.progressLabel}</span></article>
            </div>
            <div className="profile-columns">
              <section><h3>六维能力画像</h3><p className="profile-section-hint">它描述近期行为倾向，不等同于等级分。</p><div className="profile-dimensions">{profile.dimensions.map((item) => <div className="profile-meter" key={item.key} title={item.note}><span>{item.label}</span><div><i style={{ width: `${item.value}%` }} /></div><b>{item.value}</b></div>)}</div><h3 className="subheading">目前优势</h3><ul>{profile.strengths.map((item) => <li key={item}>{item}</li>)}</ul></section>
              <section><h3>优先训练</h3><ol>{profile.priorities.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol></section>
            </div>
            <div className="profile-lower">
              <section><h3>常见开局</h3>{profile.openings.length ? profile.openings.map((item) => <div className="opening-row" key={item.name}><span title={item.name}>{item.name}</span><small>{item.games} 盘</small><b>{item.score}%</b></div>) : <p className="profile-muted">尚无开局数据</p>}</section>
              <section><h3>最近棋局</h3>{recentGames.map((game) => <div className="recent-game" key={game.id}><div><span>{displayPlayer(game, "white")} <b>{gameResult(game)}</b> {displayPlayer(game, "black")}</span><small>{game.opening?.name || game.speed || "标准棋"} · {new Date(game.createdAt).toLocaleDateString("zh-CN")}</small></div><button disabled={!game.pgn} onClick={() => { if (game.pgn) { onOpenGame(game.pgn); setOpen(false); } }}>打开复盘</button></div>)}</section>
            </div>
            <p className="profile-disclaimer"><TrendingUp size={14} />风格来自走法行为统计；质量和趋势优先采用 Lichess 官方 accuracy/analysis，仅在有足够样本时显示。</p>
          </>}
        </div>}
      </DialogContent>
    </Dialog>
  </>;
}
