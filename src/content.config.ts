import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Case studies, listed on /experience in `order`. Body is MDX. */
const projects = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    order: z.number().int().positive(),
    /** Which site.config experience entry it sits under. Defaults to the first (current) one. */
    org: z.string().optional(),
    /** Small caps after the title on /experience, e.g. "AI transaction monitoring". */
    what: z.string(),
    /** Case study meta line, e.g. "RegTech · AML". */
    sector: z.string(),
    /** e.g. "Feb 2026 — Oct 2026". */
    year: z.string(),
    /** One line on /experience. */
    line: z.string(),
    /** Outcome numbers in the case study header. The first is the headline number on /experience. */
    metrics: z.array(z.object({ value: z.string(), label: z.string() })).min(1),
    /** Subtitle under the case study title. */
    dek: z.string(),
    role: z.string(),
    /** "What I owned" in the case study header. */
    owned: z.string().optional(),
    tools: z.string(),
    tags: z.array(z.string()).default([]),
    link: z.object({ label: z.string(), href: z.url() }).optional(),
    draft: z.boolean().default(false),
  }),
});

/** Essays ("Wrote" in the notes feed). Drafts render in `astro dev` only. */
const essays = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/essays' }),
  schema: z.object({
    title: z.string(),
    /** Subtitle in the reader and the line under the title in the feed. */
    dek: z.string(),
    date: z.coerce.date(),
    /** Minutes. Calculated from the body when omitted. */
    readTime: z.number().int().positive().optional(),
    tags: z.array(z.string()).default([]),
    /** Published on Medium: the reader shows the dek and any body, then "Continue reading ↗". */
    medium: z.url().optional(),
    draft: z.boolean().default(false),
  }),
});

/** Short notes ("Learned" and "Built"), all in src/content/notes.yaml. */
const notes = defineCollection({
  loader: file('src/content/notes.yaml'),
  schema: z.object({
    kind: z.enum(['learned', 'built']),
    date: z.coerce.date(),
    title: z.string(),
    dek: z.string(),
    tags: z.array(z.string()).default([]),
    /** Optional link, shown as "Open ↗". */
    url: z.url().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, essays, notes };
