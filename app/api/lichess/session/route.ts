import { NextRequest, NextResponse } from "next/server";
import { LICHESS_SESSION_COOKIE, lichessConfigured, openAccessToken } from "@/lib/lichess/session";
import type { LichessAccount } from "@/lib/lichess/types";

export async function GET(request: NextRequest) {
  if (!lichessConfigured()) return NextResponse.json({ configured: false, authenticated: false });
  const token = await openAccessToken(request.cookies.get(LICHESS_SESSION_COOKIE)?.value);
  if (!token) return NextResponse.json({ configured: true, authenticated: false });
  try {
    const response = await fetch("https://lichess.org/api/account", { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, signal: AbortSignal.timeout(12_000) });
    if (!response.ok) return NextResponse.json({ configured: true, authenticated: false }, { status: response.status === 401 ? 401 : 502 });
    const account = await response.json() as LichessAccount;
    return NextResponse.json({ configured: true, authenticated: true, user: { id: account.id, username: account.username, perfs: account.perfs } });
  } catch {
    return NextResponse.json({ configured: true, authenticated: false, error: "暂时无法连接 Lichess" }, { status: 502 });
  }
}
