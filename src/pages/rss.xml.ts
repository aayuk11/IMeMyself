import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '../../site.config';
import { getFeed } from '../lib/content';

const KIND = { learned: 'Learned', built: 'Built', wrote: 'Wrote' } as const;

export async function GET(context: APIContext): Promise<Response> {
  const items = (await getFeed()).filter((item) => !item.draft && !item.external);
  return rss({
    title: `${site.name} — ${site.notesName}`,
    description: 'What I’m learning, what I’m building, and essays once it’s worth writing up.',
    site: context.site ?? site.url,
    items: items.map((item) => ({
      title: item.kind === 'wrote' ? item.title : `${KIND[item.kind]}: ${item.title}`,
      description: item.dek,
      pubDate: item.date,
      link: item.href ?? `/notes/#${item.id}`,
      categories: [KIND[item.kind], ...item.tags],
    })),
    customData: '<language>en</language>',
  });
}
