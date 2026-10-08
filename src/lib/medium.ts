import { XMLParser } from 'fast-xml-parser';
import { readingTime } from './format';

export interface MediumPost {
  title: string;
  description: string;
  date: Date;
  readTime: number;
  href: string;
  tags: string[];
}

interface FeedItem {
  title?: unknown;
  link?: unknown;
  pubDate?: unknown;
  category?: unknown;
  'content:encoded'?: unknown;
}

const FEED_TIMEOUT_MS = 8000;
const cache = new Map<string, Promise<MediumPost[]>>();

const asText = (value: unknown): string => (typeof value === 'string' ? value : '');

const stripHtml = (html: string): string =>
  html
    .replace(/<figure[\s\S]*?<\/figure>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;|&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

/** First paragraph of the post, trimmed to a sentence or ~180 characters. */
function excerpt(html: string): string {
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => stripHtml(m[1] ?? ''));
  const first = paragraphs.find((p) => p.length > 40) ?? stripHtml(html);
  if (first.length <= 180) return first;
  const cut = first.slice(0, 180);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

/** Strip Medium's tracking query string from post links. */
const cleanLink = (link: string): string => link.split('?')[0] ?? link;

async function load(username: string): Promise<MediumPost[]> {
  const url = `https://medium.com/feed/@${username}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FEED_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const parsed: unknown = new XMLParser({ ignoreAttributes: true, processEntities: true }).parse(xml);
    const channel = (parsed as { rss?: { channel?: { item?: FeedItem | FeedItem[] } } }).rss?.channel;
    const items = channel?.item ? (Array.isArray(channel.item) ? channel.item : [channel.item]) : [];

    return items
      .map((item): MediumPost | null => {
        const title = asText(item.title).trim();
        const href = cleanLink(asText(item.link));
        const date = new Date(asText(item.pubDate));
        const html = asText(item['content:encoded']);
        if (!title || !href || Number.isNaN(date.getTime())) return null;
        const categories = Array.isArray(item.category) ? item.category : [item.category];
        return {
          title,
          href,
          date,
          description: excerpt(html),
          readTime: readingTime(stripHtml(html)),
          tags: categories.map(asText).filter(Boolean),
        };
      })
      .filter((post): post is MediumPost => post !== null);
  } catch (error) {
    // A Medium outage must never break the build. Log and carry on without the merge.
    console.warn(`[medium] Skipping ${url}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/** Fetch a Medium user's latest posts once per build. Empty username → []. */
export function getMediumPosts(username: string): Promise<MediumPost[]> {
  if (!username) return Promise.resolve([]);
  let pending = cache.get(username);
  if (!pending) {
    pending = load(username);
    cache.set(username, pending);
  }
  return pending;
}
