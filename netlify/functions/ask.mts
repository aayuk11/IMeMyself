// GET /api/ask?q=… — answers a visitor question about Aayush from the résumé facts in site.config.ts.
//
// Cost controls:
//   - Netlify rate limit: 10 requests per IP per minute (429 beyond that).
//   - Successful answers are cached on Netlify's CDN per question for a week, and every deploy
//     clears that cache, so edits to the facts take effect on the next deploy.
//   - Questions are capped at 300 characters; answers are 2–4 sentences.
//   - Set a monthly spend limit on the Anthropic Console as the backstop.
//
// Environment (Netlify → Site configuration → Environment variables):
//   ANTHROPIC_API_KEY  required
//   ANTHROPIC_MODEL    optional, defaults to claude-opus-5-5
import Anthropic from '@anthropic-ai/sdk';
import { site } from '../../site.config';

const DEFAULT_MODEL = 'claude-opus-5-5';
const MAX_QUESTION = 300;
const ONE_WEEK = 60 * 60 * 24 * 7;

// Models that take output_config.effort and server-side refusal fallbacks.
const CURRENT_GEN = /^claude-(opus-5|sonnet-5-5|fable-5)/;

const unavailable = `The command box isn’t connected right now. Email ${site.email} instead.`;

type Body = { answer: string } | { error: string };

function reply(body: Body, status: number, cache = false): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex',
  };
  if (cache) {
    headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
    headers['Netlify-CDN-Cache-Control'] = `public, durable, max-age=${ONE_WEEK}`;
    headers['Netlify-Vary'] = 'query=q';
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export default async (req: Request): Promise<Response> => {
  if (!site.ask.enabled) return reply({ error: 'Questions are switched off on this site.' }, 404);
  if (req.method !== 'GET') return reply({ error: 'Method not allowed.' }, 405);

  const question = (new URL(req.url).searchParams.get('q') ?? '').replace(/\s+/g, ' ').trim();
  if (!question) return reply({ error: 'Ask a question about Aayush’s work.' }, 400);
  if (question.length > MAX_QUESTION) return reply({ error: 'That question is a bit long. Try a shorter one.' }, 400);

  if (!process.env.ANTHROPIC_API_KEY) return reply({ error: unavailable }, 503);

  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const client = new Anthropic({ timeout: 20_000, maxRetries: 1 });

  try {
    const message = await client.beta.messages.create({
      model,
      // Thinking counts toward max_tokens on current models; leave room beyond the short reply.
      max_tokens: 2048,
      system: site.ask.system,
      messages: [{ role: 'user', content: question }],
      ...(CURRENT_GEN.test(model) && {
        output_config: { effort: 'low' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      }),
    });

    if (message.stop_reason === 'refusal') {
      return reply({ answer: 'That’s not something I can answer here. Ask about Aayush’s work, or email him.' }, 200);
    }

    const answer = message.content
      .flatMap((block) => (block.type === 'text' ? [block.text] : []))
      .join('')
      .trim();
    if (!answer) return reply({ error: unavailable }, 502);

    return reply({ answer }, 200, true);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      console.error('[ask] Anthropic credentials rejected');
      return reply({ error: unavailable }, 503);
    }
    if (error instanceof Anthropic.RateLimitError) {
      return reply({ error: 'Lots of questions right now. Try again in a minute.' }, 503);
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error('[ask] Bad request:', error.message);
      return reply({ error: unavailable }, 502);
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`[ask] API error ${error.status ?? ''}:`, error.message);
      return reply({ error: unavailable }, 502);
    }
    console.error('[ask] Unexpected error:', error);
    return reply({ error: unavailable }, 500);
  }
};

export const config = {
  path: '/api/ask',
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
