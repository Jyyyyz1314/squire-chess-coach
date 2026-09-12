import { z } from 'zod';
import { Chess } from 'chess.js';
import { COACH_SYSTEM_PROMPT, COACH_VERIFIER_PROMPT, coachTask } from './prompts';
export const CoachRequest = z.object({ mode: z.enum(['quick', 'deep', 'question']).default('quick'), fen: z.string().max(120), sideToMove: z.enum(['白方', '黑方']), question: z.string().trim().min(1).max(500), opening: z.string().max(200), playedMove: z.string().max(20).optional(), lines: z.array(z.object({ rank: z.number(), depth: z.number(), score: z.number(), mate: z.number().optional(), pv: z.array(z.string().max(12)).max(100) })).max(3) });
export interface CoachProvider { explain(context: z.infer<typeof CoachRequest>): Promise<string> }

type CompletionResult = { choices?: { message?: { content?: string } }[]; error?: { message?: string } };

function isRetryable(error: unknown) {
  if (!(error instanceof Error)) return false;
  if (error.name === 'TimeoutError' || error.name === 'TypeError' || error.message === 'EMPTY_RESPONSE') return true;
  return /^UPSTREAM:(408|429|500|502|503|504):/.test(error.message);
}

async function requestCompletion(endpoint: URL, key: string, payload: Record<string, unknown>) {
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(45000), body: JSON.stringify(payload) });
  const raw = await response.text();
  let result: CompletionResult = {};
  try { result = JSON.parse(raw) as CompletionResult; } catch { /* streaming or non-JSON upstream response */ }
  if (!response.ok) {
    const detail = (result.error?.message || raw || response.statusText).replace(/[\r\n\t]+/g, ' ').slice(0, 300);
    throw new Error(`UPSTREAM:${response.status}:${detail}`);
  }
  let answer = result.choices?.[0]?.message?.content;
  if (!answer && raw.includes('data:')) {
    const parts: string[] = [];
    for (const line of raw.split(/\r?\n/)) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const event = JSON.parse(data) as { choices?: { delta?: { content?: string }; message?: { content?: string } }[] };
        const content = event.choices?.[0]?.delta?.content ?? event.choices?.[0]?.message?.content;
        if (content) parts.push(content);
      } catch { /* ignore malformed SSE heartbeat */ }
    }
    answer = parts.join('');
  }
  answer = answer?.trim();
  if (!answer) throw new Error('EMPTY_RESPONSE');
  return answer;
}

async function requestWithRetry(endpoint: URL, key: string, payload: Record<string, unknown>) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try { return await requestCompletion(endpoint, key, payload); }
    catch (error) {
      if (attempt || !isRetryable(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }
  throw new Error('EMPTY_RESPONSE');
}

export class ApiCoach implements CoachProvider {
  async explain(context: z.infer<typeof CoachRequest>) {
    const position = new Chess(context.fen);
    const normalizedContext = { ...context, sideToMove: position.turn() === 'w' ? '白方' as const : '黑方' as const };
    const key = process.env.COACH_API_KEY;
    const base = process.env.COACH_BASE_URL;
    const model = process.env.COACH_MODEL;
    if (!key || !base || !model) throw new Error('NOT_CONFIGURED');
    const endpoint = new URL(base);
    if (endpoint.protocol !== 'https:') throw new Error('HTTPS_REQUIRED');
    if (!/\/chat\/completions\/?$/.test(endpoint.pathname)) endpoint.pathname = `${endpoint.pathname.replace(/\/$/, '')}/chat/completions`;
    const payload: Record<string, unknown> = { model, messages: [{ role: 'system', content: COACH_SYSTEM_PROMPT }, { role: 'user', content: `${coachTask(normalizedContext.mode)}\n\n局面数据：\n${JSON.stringify(normalizedContext)}` }], max_tokens: normalizedContext.mode === 'deep' ? 900 : normalizedContext.mode === 'question' ? 760 : 260, stream: true };
    // DeepSeek V4 enables thinking by default. For a short interactive hint this can
    // spend the whole output budget on reasoning_content and leave content empty.
    // Other OpenAI-compatible providers may reject this vendor-specific field.
    if (endpoint.hostname === 'api.deepseek.com' || endpoint.hostname.endsWith('.deepseek.com')) payload.thinking = { type: 'disabled' };
    const draft = await requestWithRetry(endpoint, key, payload);
    if (normalizedContext.mode !== 'question') return draft;

    const verifierPayload: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: COACH_VERIFIER_PROMPT },
        { role: 'user', content: `局面与问题：\n${JSON.stringify(normalizedContext)}\n\n待审讲解：\n${draft}` },
      ],
      max_tokens: 760,
      stream: true,
    };
    if (endpoint.hostname === 'api.deepseek.com' || endpoint.hostname.endsWith('.deepseek.com')) verifierPayload.thinking = { type: 'disabled' };
    return requestWithRetry(endpoint, key, verifierPayload);
  }
}
