import { getCollection, type CollectionEntry } from 'astro:content';
import { site } from '../../site.config';
import { readingTime } from './format';
import { getMediumPosts } from './medium';

export type Project = CollectionEntry<'projects'>;
export type Essay = CollectionEntry<'essays'>;
export type Note = CollectionEntry<'notes'>;

export type FeedKind = 'learned' | 'built' | 'wrote';

/** Drafts are visible while developing and never in a production build. */
const includeDrafts = import.meta.env.DEV;
const visible = ({ data }: { data: { draft: boolean } }) => includeDrafts || !data.draft;

export async function getProjects(): Promise<Project[]> {
  return (await getCollection('projects', visible)).sort((a, b) => a.data.order - b.data.order);
}

export async function getEssays(): Promise<Essay[]> {
  return (await getCollection('essays', visible)).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const essayReadTime = (essay: Essay): number => essay.data.readTime ?? readingTime(essay.body ?? '');

/** One row in the notes feed. */
export interface FeedItem {
  key: string;
  /** Anchor id on /notes. */
  id: string;
  kind: FeedKind;
  date: Date;
  title: string;
  dek: string;
  tags: string[];
  /** Essays: the reader page (or Medium, for RSS-merged posts). */
  href?: string;
  /** Learned / built: optional external link. */
  url?: string;
  readTime?: number;
  medium: boolean;
  external: boolean;
  draft: boolean;
}

const normalizeTitle = (title: string): string => title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Notes, essays and Medium posts (fetched at build time) in one feed, newest first. */
export async function getFeed(): Promise<FeedItem[]> {
  const [essays, notes, medium] = await Promise.all([
    getEssays(),
    getCollection('notes', visible),
    getMediumPosts(site.socials.medium),
  ]);

  const items: FeedItem[] = [
    ...essays.map(
      (e): FeedItem => ({
        key: `essay:${e.id}`,
        id: e.id,
        kind: 'wrote',
        date: e.data.date,
        title: e.data.title,
        dek: e.data.dek,
        tags: e.data.tags,
        href: `/notes/${e.id}/`,
        readTime: essayReadTime(e),
        medium: Boolean(e.data.medium),
        external: false,
        draft: e.data.draft,
      }),
    ),
    ...notes.map(
      (n): FeedItem => ({
        key: `note:${n.id}`,
        id: n.id,
        kind: n.data.kind,
        date: n.data.date,
        title: n.data.title,
        dek: n.data.dek,
        tags: n.data.tags,
        ...(n.data.url ? { url: n.data.url } : {}),
        medium: false,
        external: false,
        draft: n.data.draft,
      }),
    ),
  ];

  // A post that is also on this site appears once, as the site copy.
  const seen = new Set<string>();
  for (const e of essays) {
    seen.add(normalizeTitle(e.data.title));
    if (e.data.medium) seen.add(e.data.medium);
  }
  for (const post of medium) {
    if (seen.has(post.href) || seen.has(normalizeTitle(post.title))) continue;
    items.push({
      key: `medium:${post.href}`,
      id: `medium-${normalizeTitle(post.title).replace(/ /g, '-')}`,
      kind: 'wrote',
      date: post.date,
      title: post.title,
      dek: post.description,
      tags: post.tags,
      href: post.href,
      readTime: post.readTime,
      medium: true,
      external: true,
      draft: false,
    });
  }

  return items.sort((a, b) => b.date.valueOf() - a.date.valueOf());
}
