// /api/knowledge.json — the site's published content as small text chunks, built at deploy time.
// /api/ask reads it to answer questions; profile and commands come from site.config inside the function.
// Drafts are never included (not even in dev), and nothing here is private: it's all on the site already.
import { site } from '../../../site.config';
import { getEssays, getFeed, getProjects } from '../../lib/content';
import { formatDate } from '../../lib/format';
import { sectionChunks, type Chunk } from '../../lib/knowledge';

const clean = (s: string): string => s.replace(/\s+/g, ' ').trim();
const KIND = { learned: 'Learned', built: 'Built', wrote: 'Wrote' } as const;

export async function GET(): Promise<Response> {
  const [projects, essays, feed] = await Promise.all([getProjects(), getEssays(), getFeed()]);
  const chunks: Chunk[] = [];

  for (const p of projects) {
    const d = p.data;
    if (d.draft) continue;
    const url = `/experience/${p.id}/`;
    chunks.push({
      id: `project:${p.id}:0`,
      kind: 'project',
      title: d.title,
      url,
      text: clean(
        `${d.title}, a case study: ${d.what}. ${d.sector}, ${d.year}. ${d.line} ${d.dek} My role: ${d.role}.` +
          `${d.owned ? ` What I owned: ${d.owned}.` : ''} Tools: ${d.tools}. Numbers: ${d.metrics
            .map((m) => `${m.value} ${m.label}`)
            .join('; ')}. Tags: ${d.tags.join(', ')}.`,
      ),
    });
    chunks.push(...sectionChunks({ id: `project:${p.id}`, kind: 'project', title: d.title, url }, p.body ?? ''));
  }

  for (const e of essays) {
    const d = e.data;
    if (d.draft) continue;
    const url = `/notes/${e.id}/`;
    chunks.push({
      id: `essay:${e.id}:0`,
      kind: 'essay',
      title: d.title,
      url,
      text: clean(`${d.title}, an article I wrote (${formatDate(d.date)}): ${d.dek} Tags: ${d.tags.join(', ')}.`),
    });
    chunks.push(...sectionChunks({ id: `essay:${e.id}`, kind: 'essay', title: d.title, url }, e.body ?? ''));
  }

  // Short notes and Medium posts. Site essays are already covered above.
  for (const item of feed) {
    if (item.draft || (item.kind === 'wrote' && !item.external)) continue;
    chunks.push({
      id: `note:${item.id}`,
      kind: 'note',
      title: item.title,
      url: item.external ? (item.href ?? '/notes/') : (item.url ?? `/notes/#${item.id}`),
      text: clean(`${KIND[item.kind]}, ${formatDate(item.date)}: ${item.title}. ${item.dek}`),
    });
  }

  // "What did he last write about?": everything published, newest first, in one place.
  const written = feed.filter((item) => !item.draft).slice(0, 8);
  if (written.length) {
    chunks.push({
      id: 'note:index',
      kind: 'note',
      title: `${site.notesName}: what I’ve written`,
      url: '/notes/',
      text: clean(
        `Newest first. ${written
          .map((item, i) => `${i === 0 ? 'Latest: ' : ''}${KIND[item.kind]} “${item.title}” (${formatDate(item.date)}): ${item.dek}`)
          .join(' ')}`,
      ),
    });
  }

  return new Response(JSON.stringify({ v: 1, chunks }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
