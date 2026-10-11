// Picks the few chunks of site content that answer a question, so prompts stay small
// (Groq's free tier allows ~8K tokens a minute). A light BM25 over titles and text.
import { normalize } from '../../../src/lib/guard';
import { KNOWLEDGE_PATH, type Chunk } from '../../../src/lib/knowledge';

const TOP_K = 3;
const MAX_CHARS = 4800; // ~1,200 tokens

const STOP = new Set(
  'a an and are as at be but by can could did do does for from had has have how i if in into is it its me my of on or our so tell that the their them then there these they this to us was we what when where which who why will with would you your about some any more much give show he his him she her aayush kumar last latest recent ever'.split(
    ' ',
  ),
);

// Visitor words → words the site actually uses.
const SYNONYMS: Record<string, string[]> = {
  company: ['zigram'],
  employer: ['zigram'],
  job: ['zigram', 'role'],
  current: ['zigram'],
  stack: ['tools', 'toolkit', 'skills'],
  tech: ['tools', 'skills'],
  tool: ['toolkit'],
  skill: ['toolkit'],
  article: ['essay', 'note'],
  blog: ['note', 'essay'],
  write: ['essay', 'note'],
  writing: ['note', 'essay'],
  written: ['essay', 'note'],
  wrote: ['essay'],
  resume: ['résumé'],
  cv: ['résumé'],
  hobby: ['outside', 'personal'],
  hobbies: ['outside', 'personal'],
  free: ['outside'],
  study: ['education', 'degree'],
  college: ['education', 'degree'],
  university: ['education', 'degree'],
  pep: ['profile', 'builder'],
  dpdp: ['privacy', 'panda'],
  privacy: ['panda'],
  aml: ['transact', 'comply'],
  monitoring: ['transact'],
  sprint: ['sheet'],
  side: ['lab'],
  project: ['lab', 'case'],
  dragon: ['crash', 'rayquaza'],
  pokemon: ['pokédex'],
};

/** The same crude stem for questions and content: "articles" and "article" must meet. */
function stem(w: string): string {
  let s = w;
  if (s.length > 3 && s.endsWith('s') && !s.endsWith('ss')) s = s.slice(0, -1);
  if (s.length > 5 && s.endsWith('ing')) s = s.slice(0, -3);
  else if (s.length > 4 && s.endsWith('ed')) s = s.slice(0, -2);
  return s;
}

// Synonym keys are written as plain words; look them up by their stem.
const SYN = new Map(Object.entries(SYNONYMS).map(([word, alts]) => [stem(word), alts.map(stem)]));

// Broad questions always bring the matching summary along (at most two).
const PINS: [RegExp, string][] = [
  [/\b(write|wrote|written|writing|articles?|essays?|blogs?|posts?|notes?)\b/, 'note:index'],
  [/\b(tools?|stack|tech|skills?|toolkit|technolog)/, 'core:skills'],
  [/\b(stud(y|ied|ies)|college|university|degree|education|graduat|qualification)/, 'core:education'],
  [/\b(hobb(y|ies)|outside work|free time|weekends?|fun|personal)\b/, 'core:personal'],
  [/\b(resume|résumé|cv|experience|career|background)\b/, 'core:resume'],
  [/\b(side projects?|lab|weekend builds?)\b/, 'core:lab'],
];

function tokens(text: string): string[] {
  return normalize(text)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(' ')
    .filter((w) => w && !STOP.has(w))
    .map(stem);
}

let cached: { deploy: string; chunks: Chunk[] } | null = null;

/** The site's content chunks, fetched once per deploy from the same origin. Empty on failure. */
export async function siteChunks(req: Request, deployId: string): Promise<Chunk[]> {
  if (cached?.deploy === deployId) return cached.chunks;
  try {
    const res = await fetch(new URL(KNOWLEDGE_PATH, req.url), { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return [];
    const data = (await res.json()) as { chunks?: unknown };
    const chunks = Array.isArray(data.chunks) ? (data.chunks as Chunk[]) : [];
    cached = { deploy: deployId, chunks };
    return chunks;
  } catch {
    return [];
  }
}

/** Best chunks for the question. `page` ("project:transact-comply") is what the visitor is reading. */
export function retrieve(question: string, page: string, pool: readonly Chunk[]): Chunk[] {
  if (!pool.length) return [];
  const query = tokens(question).flatMap((t) => [t, ...(SYN.get(t) ?? [])]);
  const docs = pool.map((c) => tokens(`${c.title} ${c.title} ${c.text}`));
  const avg = docs.reduce((n, d) => n + d.length, 0) / docs.length;
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);

  const scored = pool.map((chunk, i) => {
    const doc = docs[i] ?? [];
    let score = 0;
    for (const term of new Set(query)) {
      const tf = doc.filter((t) => t === term).length;
      if (!tf) continue;
      const n = df.get(term) ?? 0;
      const idf = Math.log(1 + (pool.length - n + 0.5) / (n + 0.5));
      score += (idf * tf * 2.2) / (tf + 1.2 * (0.25 + (0.75 * doc.length) / avg));
    }
    if (page && chunk.id.startsWith(`${page}:`)) score *= 1.5;
    return { chunk, score };
  });

  const picked: Chunk[] = [];
  // Asking "what was hard here?" on a case study: that page's summary always comes along.
  const pageSummary = page ? pool.find((c) => c.id === `${page}:0`) : undefined;
  if (pageSummary) picked.push(pageSummary);
  const q = normalize(question);
  for (const [re, id] of PINS) {
    const pin = re.test(q) ? pool.find((c) => c.id === id) : undefined;
    if (pin && !picked.includes(pin) && picked.length < 2) picked.push(pin);
  }
  for (const { chunk, score } of scored.sort((a, b) => b.score - a.score)) {
    if (picked.length >= TOP_K || score <= 0) break;
    if (!picked.includes(chunk)) picked.push(chunk);
  }
  let size = 0;
  return picked.filter((c) => (size += c.text.length) <= MAX_CHARS || c === picked[0]);
}
