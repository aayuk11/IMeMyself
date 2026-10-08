# Aayush Kumar — portfolio

A portfolio you talk to: a sidebar app with a command composer docked on every page. Type `/` for every page and setting, or ask a question. Visitors can switch between five palettes, light and dark, and five type pairings.

Astro 7 · Tailwind CSS 4 · MDX · TypeScript (strict) · Netlify. Static output; the only server code is one optional Netlify Function for AI answers.

## Run it

Needs Node 22.12 or newer.

```bash
npm install
npm run dev       # http://localhost:4321 — drafts are visible here
npm run build     # type-check + production build into dist/ (drafts excluded)
npm run preview   # serve dist/ locally
```

If port 4321 is busy, Astro picks the next free one and prints it, or use `npm run dev -- --port 4330`.

## Pages

| URL | What |
|---|---|
| `/` | Home: greeting in Delhi time, bio, links, command shortcuts, latest essay |
| `/experience/` | Roles, with every product opening its case study, plus education and toolkit |
| `/experience/<slug>/` | Case study reader |
| `/notes/` | Field notes: Learned / Built / Wrote in one feed, with filters |
| `/notes/<slug>/` | Essay reader |
| `/lab/` | Side projects and the tools in rotation |
| `/resume/` | Printable résumé with PDF download (opens in a new tab) |

Old `/work/` and `/writing/` URLs redirect (see `netlify.toml`).

## Where things live

```
site.config.ts                 Profile, experience, education, toolkit, lab, résumé page, look defaults, AI switch
src/content/projects/*.mdx     Case studies
src/content/essays/*.mdx       Essays ("Wrote"). _template.mdx is a starting point and is never published.
src/content/notes.yaml         Short notes ("Learned" and "Built")
src/components/shell/          Sidebar, Topbar, Composer, ChatPanel
src/components/doc/            Reader blocks: Figure, FlowDiagram, Metrics, CodeBlock
src/layouts/                   Base (app shell), Doc (reader)
src/scripts/                   Client JS: prefs (look), shell, composer, intro, clock, notes filter
src/styles/tokens.css          Palettes × light/dark, type pairings, Gotham (palettes generated from the design file)
netlify/functions/ask.mts      /api/ask: AI answers via the Claude API (only used when switched on)
_design/                       Design export and original brief. Reference only; never imported or deployed.
```

## Writing

**A short note** (Learned / Built): add an entry to `src/content/notes.yaml`. Notes don't get their own page; they live in the feed.

**An essay**: copy `src/content/essays/_template.mdx` to `my-slug.mdx` (URL becomes `/notes/my-slug/`). Markdown covers most of it: `##` headings, `>` pull-quotes, `1.` numbered steps (`**Title.** text`), `-` bullets. Components for the rest: `CodeBlock`, `Figure`, `Metrics`. Read time is calculated automatically.

**A Medium post**: either an essay file with `medium: <url>` (the reader shows the dek and any body, then "Continue reading ↗"), or set `socials.medium` to your username and the latest Medium posts merge into the feed at build time.

**Drafts**: `draft: true` shows in `npm run dev` only. Set it to `false` (or delete the line) to publish.

**Case studies**: one MDX file per product in `src/content/projects/`. Frontmatter drives the Experience list (`what`, `line`, `key` metric, `order`) and the reader header (`dek`, `sector`, `year`, `role`, `tools`, `tags`). Diagrams are conceptual `FlowDiagram`s; swap in an Excalidraw export with `![alt](./diagram.png)` whenever you have one. No client names, no real transaction data, no production screenshots.

## The composer

- **Pages**: `/home` `/experience` `/notes` `/lab` `/resume`. Aliases: `/work`, `/writing`, `/blog`…
- **Settings**: `/theme` `/palette` `/type` `/focus` (essays and case studies) `/intro`
- **Play** (only listed after typing `/`): `/pokedex` `/gear5` `/gotham` (`/batman`) `/snap`
- `/` or Cmd/Ctrl+K from anywhere opens it. Free text opens a conversation.

**AI answers are off by default**, matching the design ("AI answers soon"): questions get a reply that routes to the right page. To switch them on:

1. Set `ask.enabled: true` in `site.config.ts`.
2. Add `ANTHROPIC_API_KEY` in Netlify (Site configuration → Environment variables). `ANTHROPIC_MODEL` is optional (default `claude-opus-5-5`).
3. Set a monthly spend limit in the Anthropic Console.

The function is rate-limited (10 requests per IP per minute), caches answers on Netlify's CDN for a week (each deploy clears them), caps questions at 300 characters, and answers only from the facts in `ask.system`. Update those facts when the résumé changes.

## Look

Defaults are in `site.config.ts` → `look` (palette `matcha`, type `funnel`, sidebar `tinted`; `ink` gives a dark sidebar in light mode). A visitor's own palette, light/dark and type choice is remembered in their browser. The Funnel pairing is self-hosted; Cabinet, Sentient and Arcade load from Fontshare only when a visitor picks them.

## Deploy to Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new project → Import an existing project →** pick the repo. Build settings come from `netlify.toml` (`npm run build`, publish `dist`, Node 22, functions in `netlify/functions`).
3. Optional environment variables: `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` (AI answers, see above), `PUBLIC_POSTHOG_KEY` / `PUBLIC_POSTHOG_HOST` (analytics; nothing loads when unset; no cookies).
4. Deploy. Canonical URLs, the sitemap and RSS use Netlify's `URL` automatically. With a custom domain, also update `url` and `handle` in `site.config.ts`.

## Before going live

- [ ] Every note and essay is a draft with placeholder dates from the design. Edit and publish the ones that are true (`src/content/notes.yaml`, `src/content/essays/`). Until then, Field notes shows an empty state.
- [ ] Review the case-study text (from the design handoff), especially Transact Comply's "What I'd do differently".
- [ ] Replace `https://medium.com/` in the three Medium essay stubs with real post URLs, or delete them.
- [ ] Check `handle` in `site.config.ts` (`aayush.site` is the design's placeholder; it appears in chat replies and on the résumé page).
- [ ] The résumé page shows your phone number (as the PDF does). Remove `phone` from `site.config.ts` if you'd rather not.
- [ ] Optional: a Pokédex avatar in `public/` and `pokedex.avatar` in `site.config.ts`.

## Design

`_design/` holds the Claude Design export. Open `_design/Chat Portfolio Devices.dc.html` in a browser (served over http, e.g. `npx serve _design`) for every v2 screen, palette and type pairing. `_design/PortfolioApp.dc.html` is the live prototype; `_design/brief.md` is the original brief.
