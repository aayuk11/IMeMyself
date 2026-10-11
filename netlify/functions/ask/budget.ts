// Spend controls for /api/ask, on top of Netlify's per-IP rate limit. One Netlify Blobs entry per day
// holds both:
//   - n:    model calls today, capped by AI_DAILY_CAP (default 80). Function time costs Netlify
//           credits and the free plan pauses every site when they run out, so this matters.
//   - cool: a cooldown after the provider says "slow down" (429), shared by every function instance.
// Blobs has no atomic increment: a burst can overshoot the cap by a call or two, which is fine.
// AI_DAILY_CAP=0 turns the cap off; the cooldown then lives in each instance's memory only.
import { getStore } from '@netlify/blobs';

interface Day {
  n: number;
  cool: number;
}

let coolUntil = 0;

export const dailyCap = (): number => {
  const n = Number(process.env.AI_DAILY_CAP ?? 80);
  return Number.isFinite(n) && n >= 0 ? n : 80;
};

const todayKey = (): string => `day:${new Date().toISOString().slice(0, 10)}`;
const BLOBS_TIMEOUT_MS = 1500;
/** A slow or missing store must never hold up an answer. */
const timed = <T>(promise: Promise<T>): Promise<T> =>
  Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('blobs timeout')), BLOBS_TIMEOUT_MS))]);
const store = () => getStore({ name: 'ask', consistency: 'strong' });
const parse = (value: string | null | undefined): Day => {
  try {
    const v = JSON.parse(value ?? '') as Partial<Day>;
    return { n: Number(v.n) || 0, cool: Number(v.cool) || 0 };
  } catch {
    return { n: 0, cool: 0 };
  }
};

/** Whether a model call may go ahead. If Blobs is unreachable, it may. */
export async function canCall(cap: number): Promise<'ok' | 'cap' | 'cooldown'> {
  if (Date.now() < coolUntil) return 'cooldown';
  if (cap === 0) return 'ok';
  try {
    const day = parse(await timed(store().get(todayKey(), { type: 'text' })));
    if (Date.now() < day.cool) {
      coolUntil = day.cool;
      return 'cooldown';
    }
    return day.n < cap ? 'ok' : 'cap';
  } catch {
    return 'ok';
  }
}

/** Read-modify-write with a retry when another request wrote first. Best effort. */
async function update(change: (day: Day) => Day): Promise<void> {
  try {
    const s = store();
    for (let attempt = 0; attempt < 3; attempt++) {
      const current = await timed(s.getWithMetadata(todayKey(), { type: 'text' }));
      const next = JSON.stringify(change(parse(current?.data)));
      const result = await timed(current?.etag ? s.set(todayKey(), next, { onlyIfMatch: current.etag }) : s.set(todayKey(), next, { onlyIfNew: true }));
      if (result.modified) return;
    }
  } catch {
    // Counting is best effort.
  }
}

export const countCall = (cap: number): Promise<void> => (cap === 0 ? Promise.resolve() : update((d) => ({ ...d, n: d.n + 1 })));

export function coolDown(seconds: number, cap: number): Promise<void> {
  coolUntil = Date.now() + Math.min(Math.max(seconds, 5), 120) * 1000;
  return cap === 0 ? Promise.resolve() : update((d) => ({ ...d, cool: Math.max(d.cool, coolUntil) }));
}
