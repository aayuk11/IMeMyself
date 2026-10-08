# Portfolio Site — Project Context

Personal portfolio for Aayush Kumar, a product manager who builds AI products.
Editorial, minimal, content-first. No AI features on the site itself.

## Stack

- **Astro 5** — static output, zero JS by default
- **Tailwind CSS** — design tokens live in `tailwind.config.mjs`
- **MDX** — articles in `src/content/articles/`
- **TypeScript** — strict
- **Netlify** — deploys from GitHub `main`

Do not add React, Vue, or any framework island unless a component genuinely
cannot work without client-side JS. Default to zero JS.

## Design reference

`_design/` holds the Claude Design export. **Reference only — never import from
it and never ship it.** Read it for layout, spacing and component structure,
then build the real components in `src/components/`.

## Design tokens

Define these in `tailwind.config.mjs`, never as hardcoded hex values in components.

### Typography
| Role | Font | Desktop / Mobile |
|---|---|---|
| Display | Instrument Serif | 56 / 36px, 1.1, -0.02em |
| H1 | Instrument Serif | 40 / 30px, 1.15 |
| H2 | Instrument Serif | 28 / 23px, 1.25 |
| H3 | Inter Medium | 20 / 18px, 1.4 |
| Body | Inter Regular | 17 / 16px, 1.65 |
| Small | Inter Regular | 15 / 14px, 1.55 |
| Label | JetBrains Mono | 12 / 11px, uppercase, 0.08em |

### Color — light
```
bg        #FBFAF8
surface   #F3F1ED
text      #16150F
muted     #6B6860
border    #E3E0D8
accent    #B4532A
```

### Color — dark
```
bg        #111010
surface   #1B1A18
text      #F0EEE8
muted     #8C887E
border    #2A2825
accent    #D97845
```

One accent only. Links and active states. Nothing else.

### Layout
- Prose max-width 680px, grid max-width 1100px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128
- Section rhythm: 96px desktop, 64px mobile
- Breakpoints: 640 / 1024 / 1280

## Motion rules

Almost none, deliberately.
- Opacity fade 150ms on hover
- Underline slide on text links
- **No** entrance animations, parallax, scroll reveals, carousels, counters
- Always respect `prefers-reduced-motion`

## Structure

```
src/
  components/     Nav, Footer, ProjectCard, ArticleRow, SectionLabel,
                  MetricPill, ThemeToggle, Prose
  layouts/        Base.astro, Article.astro, Project.astro
  pages/          index.astro, work/, writing/, 404.astro
  content/
    articles/     *.mdx
    projects/     *.mdx
  styles/         global.css
site.config.ts    Resume, skills, experience, education — single source of truth
_design/          Design export. Reference only.
public/           resume PDF, OG images, favicon
```

## Content model

**`site.config.ts`** holds all structured personal data: name, bio, contact,
experience entries, skills groups, education. Typed. Pages read from it.
Never hardcode this data into a component.

**Articles** are MDX with frontmatter:
```yaml
title, description, date, readTime, tags, draft
```

**Projects** are MDX with frontmatter:
```yaml
title, oneLiner, dateRange, metrics (label + value), tags, link, featured
```

## Pages

1. **Home** — Intro, Selected Work (3), Writing (3), Experience & Skills, Footer
2. **Work index** + project detail pages
3. **Writing index** + article detail pages

Nav is text-only, max 3 links, no logo mark.

## Conventions

- Semantic HTML. Real `<article>`, `<nav>`, `<time>`, proper heading order.
- AA contrast minimum, both themes. Visible focus rings. Keyboard navigable.
- Images via Astro `<Image>`, always with width/height and alt text.
- Theme toggle uses `localStorage` plus a no-flash inline script in `<head>`.
- Components take typed props. No `any`.
- Target Lighthouse 100 on performance and accessibility.

## Confidentiality

Work content is from a RegTech employer. **No client names, no real transaction
data, no production screenshots.** Architecture diagrams stay conceptual.
If a piece of content looks like it identifies a client, flag it rather than
publishing it.

## Out of scope

No CMS, no contact form, no comments, no newsletter signup, no chatbot,
no AI features, no analytics beyond PostHog.