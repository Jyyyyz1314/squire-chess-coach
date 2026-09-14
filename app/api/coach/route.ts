import { ApiCoach, CoachApiRequest } from '@/lib/coach/provider';
import { checkCoachRateLimit } from '@/lib/coach/rate-limit';

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

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: '不允许跨站请求' }, { status: 403 });
  try {
    if (process.env.COACH_API_ENABLED === 'false') return Response.json({ error: 'AI 老师当前处于维护状态。' }, { status: 503 });
    const rate = checkCoachRateLimit(await clientKey(request), limitFromEnv('COACH_RATE_LIMIT_PER_MINUTE', 12), limitFromEnv('COACH_RATE_LIMIT_PER_DAY', 120));
    if (!rate.allowed) return Response.json({ error: '老师请求过于频繁，请稍后再试。' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter), 'Cache-Control': 'no-store', 'X-RateLimit-Remaining': '0' } });
    const body = await request.text();
    if (body.length > 20000) return Response.json({ error: '请求过大' }, { status: 413 });
    const parsed = CoachApiRequest.safeParse(JSON.parse(body));
    if (!parsed.success) return Response.json({ error: '分析请求或 AI 配置格式不正确' }, { status: 400 });
    const { config, ...context } = parsed.data;
    const answer = await new ApiCoach().explain(context, config);
    return Response.json({ answer }, { headers: { 'Cache-Control': 'no-store', 'X-RateLimit-Remaining': String(rate.remaining) } });
  } catch (error) {
    const reason = error instanceof Error ? error.message : '';
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    const unsafe = reason === 'HTTPS_REQUIRED' || reason === 'UNSAFE_HOST';
    const upstreamStatus = reason.match(/^UPSTREAM:(\d{3}):/)?.[1];
    return Response.json({ error: unsafe ? 'API 地址必须是安全的 HTTPS 公网地址。' : timedOut ? '模型在 60 秒内没有完成回答，请换用响应更快的模型或稍后重试。' : upstreamStatus ? `模型服务暂时不可用（${upstreamStatus}），请检查自己的 API Key、余额与模型名称。` : '无法连接模型服务，请检查自己的 API 地址、Key、模型名称和网络。' }, { status: unsafe ? 400 : timedOut ? 504 : 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
