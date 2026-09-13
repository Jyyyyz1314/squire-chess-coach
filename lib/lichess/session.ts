const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const LICHESS_SESSION_COOKIE = "squire_lichess_session";
export const LICHESS_STATE_COOKIE = "squire_lichess_state";
export const LICHESS_VERIFIER_COOKIE = "squire_lichess_verifier";

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function randomBase64Url(byteLength = 32) {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export async function pkceChallenge(verifier: string) {
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(verifier))));
}

function sessionSecret() {
  const secret = process.env.LICHESS_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error("LICHESS_SESSION_SECRET must contain at least 32 characters");
  return secret;
}

async function encryptionKey() {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(sessionSecret()));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function sealAccessToken(token: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = encoder.encode(JSON.stringify({ token, issuedAt: Date.now() }));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), payload));
  return `${bytesToBase64Url(iv)}.${bytesToBase64Url(encrypted)}`;
}

export async function openAccessToken(value?: string) {
  if (!value) return null;
  try {
    const [ivPart, encryptedPart] = value.split(".");
    if (!ivPart || !encryptedPart) return null;
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64UrlToBytes(ivPart) },
      await encryptionKey(),
      base64UrlToBytes(encryptedPart),
    );
    const payload = JSON.parse(decoder.decode(decrypted)) as { token?: unknown };
    return typeof payload.token === "string" ? payload.token : null;
  } catch {
    return null;
  }
}

export function lichessConfigured() {
  return Boolean(process.env.LICHESS_SESSION_SECRET && process.env.LICHESS_SESSION_SECRET.length >= 32);
}

export function lichessClientId(requestUrl: string) {
  return process.env.LICHESS_CLIENT_ID?.trim() || new URL(requestUrl).host;
}

export function secureCookie(requestUrl: string) {
  return new URL(requestUrl).protocol === "https:";
}
