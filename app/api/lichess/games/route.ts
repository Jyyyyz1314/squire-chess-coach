import { NextRequest, NextResponse } from "next/server";
import { LICHESS_SESSION_COOKIE, openAccessToken } from "@/lib/lichess/session";
import type { LichessAccount, LichessGame } from "@/lib/lichess/types";

export async function GET(request: NextRequest) {
  const token = await openAccessToken(request.cookies.get(LICHESS_SESSION_COOKIE)?.value);
  if (!token) return NextResponse.json({ error: "请先登录 Lichess" }, { status: 401 });
  const requestedMax = Number(request.nextUrl.searchParams.get("max") || 60);
  const max = Math.max(10, Math.min(100, Number.isFinite(requestedMax) ? Math.round(requestedMax) : 60));
  try {
    const accountResponse = await fetch("https://lichess.org/api/account", { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, signal: AbortSignal.timeout(12_000) });
    if (!accountResponse.ok) return NextResponse.json({ error: "Lichess 登录已失效，请重新授权" }, { status: 401 });
    const account = await accountResponse.json() as LichessAccount;
    const url = new URL(`https://lichess.org/api/games/user/${encodeURIComponent(account.username)}`);
    url.search = new URLSearchParams({ max: String(max), moves: "true", pgnInJson: "true", tags: "true", clocks: "true", evals: "true", accuracy: "true", opening: "true", division: "true", finished: "true", sort: "dateDesc" }).toString();
    const gamesResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/x-ndjson",
        "User-Agent": "Squire Chess Coach (https://github.com/Jyyyyz1314/squire-chess-coach)",
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!gamesResponse.ok) return NextResponse.json({ error: gamesResponse.status === 429 ? "Lichess 请求频率过高，请一分钟后重试" : "暂时无法下载 Lichess 棋局" }, { status: gamesResponse.status === 429 ? 429 : 502 });
    const body = await gamesResponse.text();
    if (body.length > 8_000_000) return NextResponse.json({ error: "棋局数据过大，请减少同步数量" }, { status: 413 });
    const games = body.split("\n").filter(Boolean).slice(0, max).map((line) => JSON.parse(line) as LichessGame);
    return NextResponse.json({ username: account.username, syncedAt: new Date().toISOString(), games });
  } catch {
    return NextResponse.json({ error: "同步失败，请检查网络后重试" }, { status: 502 });
  }
}
