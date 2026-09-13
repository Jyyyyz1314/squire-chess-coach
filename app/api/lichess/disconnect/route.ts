import { NextRequest, NextResponse } from "next/server";
import { LICHESS_SESSION_COOKIE, openAccessToken } from "@/lib/lichess/session";

export async function POST(request: NextRequest) {
  const token = await openAccessToken(request.cookies.get(LICHESS_SESSION_COOKIE)?.value);
  if (token) {
    try {
      await fetch("https://lichess.org/api/token", { method: "DELETE", headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) });
    } catch {
      // Clearing the local session is still useful if Lichess is temporarily unreachable.
    }
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(LICHESS_SESSION_COOKIE);
  return response;
}
