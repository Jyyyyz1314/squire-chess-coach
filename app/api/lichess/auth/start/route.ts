import { NextRequest, NextResponse } from "next/server";
import { LICHESS_STATE_COOKIE, LICHESS_VERIFIER_COOKIE, lichessClientId, lichessConfigured, pkceChallenge, randomBase64Url, secureCookie } from "@/lib/lichess/session";

export async function GET(request: NextRequest) {
  if (!lichessConfigured()) return NextResponse.json({ error: "Lichess 尚未配置" }, { status: 503 });
  const state = randomBase64Url();
  const verifier = randomBase64Url(64);
  const redirectUri = new URL("/api/lichess/auth/callback", request.url).toString();
  const authorization = new URL("https://lichess.org/oauth");
  authorization.search = new URLSearchParams({
    response_type: "code",
    client_id: lichessClientId(request.url),
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: await pkceChallenge(verifier),
    state,
  }).toString();
  const response = NextResponse.redirect(authorization);
  const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: secureCookie(request.url), path: "/", maxAge: 600 };
  response.cookies.set(LICHESS_STATE_COOKIE, state, cookieOptions);
  response.cookies.set(LICHESS_VERIFIER_COOKIE, verifier, cookieOptions);
  return response;
}
