import { ApiCoach, CoachRequest } from '@/lib/coach/provider';
import { COACH_SYSTEM_PROMPT, COACH_VERIFIER_PROMPT, coachTask } from '@/lib/coach/prompts';
import { checkCoachRateLimit } from '@/lib/coach/rate-limit';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_LIMIT = 128;
const cache = new Map<string, { answer: string; expiresAt: number }>();
const inFlight = new Map<string, Promise<string>>();

function limitFromEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? Math.min(value, 10_000) : fallback;
}

async function digest(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function clientKey(request: Request) {
  const forwarded = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown';
  return digest(forwarded);
}

function readCache(key: string) {
  const entry = cache.get(key);
  if (!entry) return;
  if (entry.expiresAt <= Date.now()) { cache.delete(key); return; }
  cache.delete(key);
  cache.set(key, entry);
  return entry.answer;
}

function writeCache(key: string, answer: string) {
  cache.set(key, { answer, expiresAt: Date.now() + CACHE_TTL_MS });
  while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: '不允许跨站请求' }, { status: 403 });
  try {
    if (process.env.COACH_API_ENABLED === 'false') return Response.json({ error: 'AI 老师当前处于维护状态。' }, { status: 503 });
    const rate = checkCoachRateLimit(await clientKey(request), limitFromEnv('COACH_RATE_LIMIT_PER_MINUTE', 12), limitFromEnv('COACH_RATE_LIMIT_PER_DAY', 120));
    if (!rate.allowed) return Response.json({ error: '老师请求过于频繁，请稍后再试。' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter), 'Cache-Control': 'no-store', 'X-RateLimit-Remaining': '0' } });
    const body = await request.text();
    if (body.length > 20000) return Response.json({ error: '请求过大' }, { status: 413 });
    const parsed = CoachRequest.safeParse(JSON.parse(body));
    if (!parsed.success) return Response.json({ error: '分析请求格式不正确' }, { status: 400 });
    const key = await digest(`${COACH_SYSTEM_PROMPT}\n${COACH_VERIFIER_PROMPT}\n${coachTask(parsed.data.mode)}\n${JSON.stringify(parsed.data)}`);
    const cached = readCache(key);
    if (cached) return Response.json({ answer: cached }, { headers: { 'X-Squire-Coach-Cache': 'HIT', 'Cache-Control': 'no-store', 'X-RateLimit-Remaining': String(rate.remaining) } });
    const existing = inFlight.get(key);
    if (existing) return Response.json({ answer: await existing }, { headers: { 'X-Squire-Coach-Cache': 'COALESCED', 'Cache-Control': 'no-store', 'X-RateLimit-Remaining': String(rate.remaining) } });
    const pending = new ApiCoach().explain(parsed.data);
    inFlight.set(key, pending);
    try {
      const answer = await pending;
      writeCache(key, answer);
      return Response.json({ answer }, { headers: { 'X-Squire-Coach-Cache': 'MISS', 'Cache-Control': 'no-store', 'X-RateLimit-Remaining': String(rate.remaining) } });
    } finally { inFlight.delete(key); }
  } catch (error) {
    const reason = error instanceof Error ? error.message : '';
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    const missing = reason === 'NOT_CONFIGURED';
    const unsafe = reason === 'HTTPS_REQUIRED';
    const upstreamStatus = reason.match(/^UPSTREAM:(\d{3}):/)?.[1];
    return Response.json({ error: missing ? '老师尚未连接。请填写项目根目录的 .env.local 并重启开发服务器。' : unsafe ? 'API 地址必须是 HTTPS 公网地址。' : timedOut ? '模型在 60 秒内没有完成回答，请换用响应更快的模型或稍后重试。' : upstreamStatus ? `模型服务暂时不可用（${upstreamStatus}），请稍后重试。` : '无法连接模型服务，请检查服务端网络和 API 配置。' }, { status: missing ? 503 : unsafe ? 400 : timedOut ? 504 : 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
