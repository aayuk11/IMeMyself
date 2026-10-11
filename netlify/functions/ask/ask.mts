// /api/ask — answers visitor questions about Aayush from the site's own content.
//   GET  /api/ask?q=…&p=…            first question in a conversation (cached on Netlify's CDN)
//   POST /api/ask {q, p, history}     follow-ups, with the last two exchanges (never cached)
// p is the page being read ("project:transact-comply"), so "what was hard here?" works.
//
// Order of checks: switched on → same origin → valid input → guardrails (no model call for
// breach / private / easter-egg intents) → provider cooldown and daily cap → model → output checks.
// Question text is never logged or stored. Setup and limits: README → "AI answers".
import type { Config, Context } from '@netlify/functions';
import { site } from '../../../site.config';
import { buildCommands } from '../../../src/lib/commands';
import { classify, intent, normalize } from '../../../src/lib/guard';
import { coreChunks, type Chunk } from '../../../src/lib/knowledge';
import { canCall, coolDown, countCall, dailyCap } from './budget';
import { commandLine, lineFor, shapeReply, systemPrompt, userMessage, type Reply } from './prompt';
import { aiEnv, callModel, UpstreamError } from './providers';
import { retrieve, siteChunks } from './retrieve';

const MAX_QUESTION = 300;
const MAX_BODY = 4000;
const PAGE = /^(project|essay):[a-z0-9-]{1,80}$/;
const ONE_WEEK = 60 * 60 * 24 * 7;

const commands = buildCommands({ projects: 0, notes: 0, notesName: site.notesName });
const commandSet = new Set(commands.map((c) => c.cmd));
const core = coreChunks(site, commands);
const alwaysOn = core.filter((c) => c.core);
const system = systemPrompt(alwaysOn);

type History = { role: 'user' | 'bot'; text: string }[];

function respond(reply: Reply, status = 200, cache = false): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex',
  };
  if (cache) {
    // Same question on the same page → same answer for a week. Every deploy clears it.
    headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
    headers['Netlify-CDN-Cache-Control'] = `public, durable, max-age=${ONE_WEEK}`;
    headers['Netlify-Vary'] = 'query=q|p';
  }
  return new Response(JSON.stringify(reply), { status, headers });
}

const unavailable = (status = 503): Response =>
  respond({ verdict: 'unavailable', text: site.ask.lines.unavailable, links: [], commands: [], ai: false }, status);

/** Requests from other websites' pages are refused. Scripts can still call it: the rate limit and cap cover that. */
function sameOrigin(req: Request): boolean {
  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return false;
  const origin = req.headers.get('origin');
  return !origin || origin === new URL(req.url).origin;
}

async function readInput(req: Request): Promise<{ q: string; p: string; history: History } | null> {
  if (req.method === 'GET') {
    const params = new URL(req.url).searchParams;
    return { q: params.get('q') ?? '', p: params.get('p') ?? '', history: [] };
  }
  const length = Number(req.headers.get('content-length') ?? 0);
  if (length > MAX_BODY) return null;
  const body = (await req.json().catch(() => null)) as { q?: unknown; p?: unknown; history?: unknown } | null;
  if (!body || typeof body.q !== 'string') return null;
  const history: History = Array.isArray(body.history)
    ? body.history
        .filter((h): h is { role: 'user' | 'bot'; text: string } => (h?.role === 'user' || h?.role === 'bot') && typeof h?.text === 'string')
        .slice(-4)
        .map((h) => ({ role: h.role, text: h.text.replace(/\s+/g, ' ').trim().slice(0, h.role === 'user' ? MAX_QUESTION : 400) }))
    : [];
  return { q: body.q, p: typeof body.p === 'string' ? body.p : '', history };
}

export default async (req: Request, context: Context): Promise<Response> => {
  const started = Date.now();
  const env = aiEnv();
  const log = (verdict: string, extra: Record<string, unknown> = {}): void =>
    console.log(JSON.stringify({ ask: verdict, provider: env?.provider ?? 'none', ms: Date.now() - started, ...extra }));

  if (!site.ask.enabled) return unavailable(404);
  if (!sameOrigin(req)) return new Response('Forbidden', { status: 403 });

  const input = await readInput(req);
  if (!input) return unavailable(400);
  const q = input.q.replace(/\s+/g, ' ').trim();
  const p = PAGE.test(input.p) ? input.p : '';
  if (!q || q.length > MAX_QUESTION) return unavailable(400);
  const cacheable = req.method === 'GET';

  // Guardrails first: none of these need the model.
  if ([q, ...input.history.filter((h) => h.role === 'user').map((h) => h.text)].some((t) => classify(t).tier === 'breach')) {
    log('breach', { by: 'rule' });
    return respond({ verdict: 'breach', text: '', links: [], commands: [], ai: false }, 200, cacheable);
  }
  const tier = classify(q).tier;
  if (tier === 'private' || tier === 'offtopic') {
    log(tier, { by: 'rule' });
    return respond({ verdict: tier, text: lineFor(tier, q), links: [], commands: [], ai: false }, 200, cacheable);
  }
  const shortcut = intent(q, commands);
  if (shortcut) {
    log('answer', { by: 'intent' });
    return respond({ verdict: 'answer', text: commandLine(shortcut), links: [], commands: [shortcut], ai: false }, 200, cacheable);
  }

  // The model.
  if (!env) return unavailable();
  if (env.provider === 'mock' && context.deploy?.context === 'production') return unavailable();
  const cap = dailyCap();
  const budget = await canCall(cap);
  if (budget !== 'ok') {
    log('unavailable', { by: budget });
    return unavailable();
  }

  const pool: Chunk[] = [...core.filter((c) => !c.core), ...(await siteChunks(req, context.deploy?.id ?? 'local'))];
  const context_ = retrieve(normalize(q), p, pool);
  const pageTitle = p ? (pool.find((c) => c.id === `${p}:0`)?.title ?? '') : '';
  context.waitUntil(countCall(cap));

  try {
    const raw = await callModel(env, system, userMessage(q, context_, input.history, pageTitle), q, context_);
    const reply = shapeReply(raw, q, [...alwaysOn, ...pool], commandSet);
    if (!reply) {
      log('unavailable', { by: 'unparsable' });
      return unavailable(502);
    }
    log(reply.verdict, { by: 'model' });
    return respond(reply, 200, cacheable);
  } catch (error) {
    if (error instanceof UpstreamError) {
      if (error.kind === 'rate') await coolDown(error.retryAfter, cap);
      if (error.kind === 'auth') console.error('[ask] provider rejected the API key');
      log('unavailable', { by: error.kind });
    } else {
      console.error('[ask] unexpected error', error instanceof Error ? error.message : error);
    }
    return unavailable();
  }
};

export const config: Config = {
  path: '/api/ask',
  method: ['GET', 'POST'],
  rateLimit: {
    windowLimit: 8,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
