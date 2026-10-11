// What the AI is allowed to know: the site's own content, cut into small chunks it can search.
// Free of Astro imports: /api/knowledge.json (build time) and netlify/functions/ask (runtime) both use it.
// Never add the phone number or drafts here.
import type { SiteConfig } from '../../site.config';
import type { Command } from './commands';

export const KNOWLEDGE_PATH = '/api/knowledge.json';

export interface Chunk {
  /** "core:profile", "project:transact-comply:2"… The first two segments name the page it belongs to. */
  id: string;
  kind: 'core' | 'project' | 'essay' | 'note';
  title: string;
  /** Where a link chip should go. Internal paths or the owner's own external links. */
  url: string;
  text: string;
  /** Always sent to the model, whatever the question. */
  core?: boolean;
}

const MAX_CHUNK = 1200;
const clean = (s: string): string => s.replace(/\s+/g, ' ').trim();

/** Profile, résumé, skills, lab and commands, straight from site.config. Contact: email only. */
export function coreChunks(site: SiteConfig, commands: readonly Command[]): Chunk[] {
  const play = commands.filter((c) => c.group === 'Play');
  const other = commands.filter((c) => c.group !== 'Play');
  return [
    {
      id: 'core:profile',
      kind: 'core',
      core: true,
      title: `About ${site.name}`,
      url: '/',
      text: clean(
        `${site.name}: ${site.tagline}, based in ${site.city}. ${site.bio} Contact by email: ${site.email}. LinkedIn: ${site.socials.linkedin}. GitHub: ${site.socials.github}.`,
      ),
    },
    {
      id: 'core:work',
      kind: 'core',
      core: true,
      title: 'Where I work',
      url: '/experience/',
      text: clean(
        site.experience
          .map((r) => `${r.role} at ${r.org} (${r.kind}, ${r.place}), ${r.period}. ${r.summary}`)
          .concat(site.resumePage.roles.map((r) => `${r.name}: ${r.what}.`))
          .join(' '),
      ),
    },
    {
      id: 'core:commands',
      kind: 'core',
      core: true,
      title: 'Commands on this site',
      url: '/',
      text: clean(
        `Pages and settings: ${other.map((c) => `${c.cmd} (${c.label})`).join(', ')}. Easter eggs: ${play
          .map((c) => `${c.cmd}: ${c.about ?? c.label}`)
          .join(' ')}`,
      ),
    },
    {
      id: 'core:resume',
      kind: 'core',
      title: 'Résumé',
      url: '/resume/',
      text: clean(
        `${site.resumePage.summary} ${site.resumePage.roles.map((r) => `${r.name} (${r.what}): ${r.points.join(' ')}`).join(' ')}`,
      ),
    },
    {
      id: 'core:skills',
      kind: 'core',
      title: 'Skills and tools',
      url: '/experience/',
      text: clean(
        [...site.toolkit, ...site.resumePage.skills].map((t) => `${t.group}: ${t.items}.`).join(' ') +
          ` Tools in rotation: ${site.toolbox.join(', ')}.`,
      ),
    },
    {
      id: 'core:education',
      kind: 'core',
      title: 'Education',
      url: '/resume/',
      text: clean(`${site.education.degree}, ${site.education.schoolFull}, ${site.education.period}. ${site.education.note}.`),
    },
    {
      id: 'core:lab',
      kind: 'core',
      title: 'Lab: side projects',
      url: '/lab/',
      text: clean(site.lab.map((l) => `${l.name} (${l.status}): ${l.line}`).join(' ')),
    },
    {
      id: 'core:personal',
      kind: 'core',
      title: 'Outside work',
      url: '/',
      text: clean(
        `${site.ask.personal} My Pokédex entry (/pokedex): ${site.pokedex.species}, types ${site.pokedex.types.join(' and ')}. ${site.pokedex.entries
          .map((e) => `${e.label}: ${e.value}.`)
          .join(' ')}`,
      ),
    },
  ];
}

/** MDX source to plain text: no imports, comments or components (their captions and labels survive). */
export function mdxToText(body: string): string {
  return (
    body
      .replace(/^\s*(import|export)\s.*$/gm, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      // Components: keep what a reader would see (captions, titles, node labels, metric pairs).
      .replace(/<([A-Z][A-Za-z]*)\b[\s\S]*?(?:\/>|<\/\1>)/g, (block) => {
        const bits: string[] = [];
        for (const m of block.matchAll(/\b(?:caption|title)="([^"]+)"/g)) bits.push(m[1] ?? '');
        for (const m of block.matchAll(/\bn: '([^']+)', l: '([^']+)'/g)) bits.push(`${m[1]} ${m[2]}`);
        for (const m of block.matchAll(/\blabel: '([^']+)'(?:, note: '([^']+)')?/g)) bits.push(m[2] ? `${m[1]}: ${m[2]}` : (m[1] ?? ''));
        return bits.length ? `\n${bits.join('. ')}.\n` : '\n';
      })
      .replace(/<\/?[A-Za-z][^>]*>/g, '')
      // Markdown.
      .replace(/^\s*\|?\s*-{3,}.*$/gm, '')
      .replace(/\|/g, ' · ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^\s{0,3}(#{1,6}|>|[-*]|\d+\.)\s+/gm, '')
      .replace(/[*_`]/g, '')
  );
}

/** Split MDX on its ## headings, then into pieces of at most ~1,200 characters at sentence ends. */
export function sectionChunks(base: Omit<Chunk, 'id' | 'text'> & { id: string }, body: string): Chunk[] {
  const sections = body.split(/^## /m);
  const chunks: Chunk[] = [];
  sections.forEach((section, i) => {
    const [first = '', ...rest] = section.split('\n');
    const heading = i === 0 ? '' : clean(first);
    const text = clean(mdxToText(i === 0 ? section : rest.join('\n')));
    if (!text) return;
    let piece = '';
    for (const sentence of text.split(/(?<=[.!?])\s+/)) {
      if (piece && piece.length + sentence.length > MAX_CHUNK) {
        chunks.push({ ...base, id: `${base.id}:${chunks.length + 1}`, title: heading ? `${base.title}: ${heading}` : base.title, text: piece });
        piece = '';
      }
      piece = piece ? `${piece} ${sentence}` : sentence;
    }
    if (piece) chunks.push({ ...base, id: `${base.id}:${chunks.length + 1}`, title: heading ? `${base.title}: ${heading}` : base.title, text: piece });
  });
  return chunks;
}
