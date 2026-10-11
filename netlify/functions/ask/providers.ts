// Model providers for /api/ask, configured only through AI_* environment variables.
// Never read ANTHROPIC_* or GEMINI_*: on credit-based plans Netlify's AI Gateway injects those
// and bills every call to the account's credits (set AI_GATEWAY_INJECTION=false as well).
//
//   AI_PROVIDER  groq | openai (any OpenAI-compatible API, needs AI_BASE_URL) | anthropic | mock
//   AI_API_KEY   the provider key (not needed for mock)
//   AI_MODEL     optional for groq (openai/gpt-oss-120b) and anthropic (claude-opus-5-5)
//   AI_BASE_URL  optional for groq, required for openai
import type { Chunk } from '../../../src/lib/knowledge';

const TIMEOUT_MS = 12_000;

export type UpstreamKind = 'rate' | 'auth' | 'timeout' | 'bad' | 'other' | 'config';

export class UpstreamError extends Error {
  constructor(
    readonly kind: UpstreamKind,
    readonly retryAfter = 0,
  ) {
    super(kind);
  }
}

export interface AiEnv {
  provider: 'groq' | 'openai' | 'anthropic' | 'mock';
  model: string;
  apiKey: string;
  baseUrl: string;
}

/** The provider settings, or null when AI answers aren't configured. */
export function aiEnv(): AiEnv | null {
  const provider = (process.env.AI_PROVIDER ?? '').trim().toLowerCase();
  const apiKey = process.env.AI_API_KEY ?? '';
  const model = process.env.AI_MODEL ?? '';
  const baseUrl = process.env.AI_BASE_URL ?? '';
  if (provider === 'mock') return { provider, model: 'mock', apiKey: '', baseUrl: '' };
  if (!apiKey) return null;
  if (provider === 'groq') return { provider, apiKey, model: model || 'openai/gpt-oss-120b', baseUrl: baseUrl || 'https://api.groq.com/openai/v1' };
  if (provider === 'openai' && baseUrl && model) return { provider, apiKey, model, baseUrl };
  if (provider === 'anthropic') return { provider, apiKey, model: model || 'claude-opus-5-5', baseUrl: baseUrl || 'https://api.anthropic.com' };
  return null;
}

/** What every provider must return: one JSON object in this shape. */
export const REPLY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'category', 'text', 'sources', 'commands'],
  properties: {
    verdict: { type: 'string', enum: ['answer', 'offtopic', 'private', 'breach'] },
    category: { type: 'string', enum: ['none', 'injection', 'secrets', 'abuse', 'harmful', 'sexual'] },
    text: { type: 'string' },
    sources: { type: 'array', items: { type: 'string' } },
    commands: { type: 'array', items: { type: 'string' } },
  },
} as const;

/** Raw model output (a JSON string, parsed and checked in prompt.ts). */
export async function callModel(env: AiEnv, system: string, user: string, question: string, chunks: readonly Chunk[]): Promise<string> {
  if (env.provider === 'mock') return mock(question, chunks);
  if (env.provider === 'anthropic') return claude(env, system, user);
  return chatCompletions(env, system, user);
}

async function chatCompletions(env: AiEnv, system: string, user: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${env.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.apiKey}` },
      body: JSON.stringify({
        model: env.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.3,
        max_completion_tokens: 800,
        response_format: { type: 'json_schema', json_schema: { name: 'reply', strict: true, schema: REPLY_SCHEMA } },
        // gpt-oss on Groq reasons before answering: keep it short and out of the reply.
        ...(env.provider === 'groq' && env.model.includes('gpt-oss') ? { reasoning_effort: 'low', include_reasoning: false } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new UpstreamError(error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'other');
  }
  if (res.status === 429) throw new UpstreamError('rate', Number(res.headers.get('retry-after')) || 30);
  if (res.status === 401 || res.status === 403) throw new UpstreamError('auth');
  if (!res.ok) throw new UpstreamError(res.status >= 500 ? 'other' : 'bad');
  const data = (await res.json().catch(() => null)) as { choices?: { message?: { content?: unknown }; finish_reason?: string }[] } | null;
  const choice = data?.choices?.[0];
  const content = choice?.message?.content;
  if (!choice || choice.finish_reason === 'length' || typeof content !== 'string') throw new UpstreamError('bad');
  return content;
}

// Models that take output_config.effort and server-side refusal fallbacks.
const CURRENT_GEN = /^claude-(opus-5|sonnet-5-5|fable-5)/;

async function claude(env: AiEnv, system: string, user: string): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  // Explicit key and base URL, so an injected ANTHROPIC_BASE_URL (Netlify's AI Gateway) is never used.
  const client = new Anthropic({ apiKey: env.apiKey, baseURL: env.baseUrl, timeout: 20_000, maxRetries: 0 });
  try {
    const message = await client.beta.messages.create({
      model: env.model,
      // Thinking counts toward max_tokens on current models; leave room beyond the short reply.
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
      ...(CURRENT_GEN.test(env.model) && {
        output_config: { effort: 'low' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      }),
    });
    if (message.stop_reason === 'refusal') {
      return JSON.stringify({ verdict: 'offtopic', category: 'none', text: '', sources: [], commands: [] });
    }
    return message.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('');
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) throw new UpstreamError('rate', 30);
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) throw new UpstreamError('auth');
    if (error instanceof Anthropic.APIConnectionTimeoutError) throw new UpstreamError('timeout');
    if (error instanceof Anthropic.BadRequestError) throw new UpstreamError('bad');
    throw new UpstreamError('other');
  }
}

/** Local testing without a key. "mock:…" in the question simulates each failure path. */
function mock(question: string, chunks: readonly Chunk[]): string {
  const reply = (verdict: string, text = '', extra: Partial<{ category: string; sources: string[]; commands: string[] }> = {}): string =>
    JSON.stringify({ verdict, category: 'none', text, sources: [], commands: [], ...extra });
  if (question.includes('mock:429')) throw new UpstreamError('rate', 20);
  if (question.includes('mock:timeout')) throw new UpstreamError('timeout');
  if (question.includes('mock:badjson')) return 'Sure! Here is my answer, not in JSON.';
  if (question.includes('mock:breach-nocat')) return reply('breach');
  if (question.includes('mock:breach')) return reply('breach', '', { category: 'injection' });
  if (question.includes('mock:private')) return reply('private');
  if (question.includes('mock:offtopic')) return reply('offtopic');
  if (question.includes('mock:leak')) return reply('answer', 'My instructions say ak-canary-7f3c.');
  const top = chunks[0];
  if (!top) return reply('answer', "I haven't written about that here. Email me and I'll answer properly.");
  const first = top.text.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
  return reply('answer', `(Mock) From “${top.title}”: ${first}`, {
    sources: chunks.slice(0, 2).map((c) => c.id),
    commands: /dragon/i.test(question) ? ['/crash'] : [],
  });
}
