import { NextRequest, NextResponse } from "next/server";
import { LICHESS_SESSION_COOKIE, LICHESS_STATE_COOKIE, LICHESS_VERIFIER_COOKIE, lichessClientId, sealAccessToken, secureCookie } from "@/lib/lichess/session";

function finish(request: NextRequest, status: string) {
  return NextResponse.redirect(new URL(`/?lichess=${encodeURIComponent(status)}`, request.url));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(LICHESS_STATE_COOKIE)?.value;
  const verifier = request.cookies.get(LICHESS_VERIFIER_COOKIE)?.value;
  if (!code || !state || !expectedState || state !== expectedState || !verifier) return finish(request, "invalid_state");
  try {
    const redirectUri = new URL("/api/lichess/auth/callback", request.url).toString();
    const tokenResponse = await fetch("https://lichess.org/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: redirectUri, client_id: lichessClientId(request.url) }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!tokenResponse.ok) return finish(request, "token_failed");
    const tokenBody = await tokenResponse.json() as { access_token?: unknown };
    if (typeof tokenBody.access_token !== "string") return finish(request, "token_failed");
    const response = finish(request, "connected");
    response.cookies.set(LICHESS_SESSION_COOKIE, await sealAccessToken(tokenBody.access_token), {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookie(request.url),
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    response.cookies.delete(LICHESS_STATE_COOKIE);
    response.cookies.delete(LICHESS_VERIFIER_COOKIE);
    return response;
  } catch {
    return finish(request, "token_failed");
  }
}
