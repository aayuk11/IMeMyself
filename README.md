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
netlify/functions/ask/        /api/ask: AI answers (providers, retrieval, prompt, daily budget)
src/lib/guard.ts              Guardrail tiers: what crashes, what's declined, easter-egg shortcuts
src/pages/api/knowledge.json.ts  The site's content as chunks the AI can search (built on deploy)
_design/                       Design export and original brief. Reference only; never imported or deployed.
```

## Writing

**A short note** (Learned / Built): add an entry to `src/content/notes.yaml`. Notes don't get their own page; they live in the feed.

**An essay**: copy `src/content/essays/_template.mdx` to `my-slug.mdx` (URL becomes `/notes/my-slug/`). Markdown covers most of it: `##` headings, `>` pull-quotes, `1.` numbered steps (`**Title.** text`), `-` bullets. Components for the rest: `CodeBlock`, `Figure`, `Metrics`. Read time is calculated automatically.

**A Medium post**: either an essay file with `medium: <url>` (the reader shows the dek and any body, then "Continue reading ↗"), or set `socials.medium` to your username and the latest Medium posts merge into the feed at build time.

**Drafts**: `draft: true` shows in `npm run dev` only. Set it to `false` (or delete the line) to publish.

**Case studies**: one MDX file per product in `src/content/projects/`; copy `_template.mdx` to start one. Frontmatter drives the Experience list (`what`, `line`, `order`, and the first of `metrics`) and the reader header (`dek`, `sector`, `year`, `role`, `owned`, `tools`, every number in `metrics`, `tags`). Link to an article with a normal Markdown link, e.g. `[Title](/notes/slug/)`. Diagrams are conceptual `FlowDiagram`s; swap in an Excalidraw export with `![alt](./diagram.png)` whenever you have one. No client names, no real transaction data, no production screenshots.

## The composer

- **Pages**: `/home` `/experience` `/notes` `/lab` `/resume`. Aliases: `/work`, `/writing`, `/blog`…
- **Settings**: `/theme` `/palette` `/type` `/focus` (essays and case studies) `/intro`
- **Play** (only listed after typing `/`): `/pokedex` `/gear5` `/gotham` (`/batman`) `/snap` `/crash` `/sisyphus` (`/boulder`; sending anything skips it)
- `/` or Cmd/Ctrl+K from anywhere opens it. Free text opens a conversation.

## AI answers

Visitors can ask about my work, ZIGRAM, the case studies, skills, tools, education, Field notes and the site's commands. Answers come only from what's published on the site: `/api/knowledge.json` is rebuilt from the content on every deploy, so a new case study or article is covered automatically. Profile, résumé and commands come from `site.config.ts`. The phone number and drafts are never included.

**Set up (Groq free tier):**

1. Create a key at [console.groq.com](https://console.groq.com) and turn on Zero Data Retention in its data controls.
2. In Netlify (Site configuration → Environment variables, for Production and Deploy Previews): `AI_PROVIDER=groq`, `AI_API_KEY=<key>`, `AI_DAILY_CAP=80`, `AI_GATEWAY_INJECTION=false`. `AI_MODEL` is optional (default `openai/gpt-oss-120b`). Mark only `AI_API_KEY` as a secret; the others are plain settings (the build's secret scanner skips them anyway).
3. Redeploy. Without a key, questions get "The model's resting" and links to the right pages.

`AI_GATEWAY_INJECTION=false` matters: on credit-based plans Netlify otherwise injects its own AI keys and bills calls to your Netlify credits. `AI_PROVIDER` can also be `openai` (any OpenAI-compatible API, with `AI_BASE_URL` and `AI_MODEL`), `anthropic` (Claude, paid) or `mock` (canned answers for testing; refused in production).

**Guardrails**, in order (`src/lib/guard.ts`, run in the browser and again on the server):

| Tier | Examples | Reply |
|---|---|---|
| Breach | "ignore your instructions", "what's your system prompt", jailbreaks, abuse | The Rayquaza crash. Refresh resets the visit. |
| Private | salary, phone, address, client names, politics, colleagues | A firm line pointing to email. |
| Off-topic | write me a poem, weather, trivia | "Low priority. Ask me something else." |
| Easter egg | "show me the dragon", "open your Pokédex" | "That's /crash…" with a clickable command chip, no AI call. |
| Everything else | questions about me and my work | The AI answers in two to four sentences, with links to the pages it used. |

The model also classifies every question, so subtler off-topic, private or breach questions are caught too. A breach from the model only crashes the page when it names a reason (injection, secrets, abuse, harmful, sexual). Ordinary words like "bypass" or "password" never crash anything. The fixed replies live in `site.config.ts` → `ask.lines`; the AI's voice in `ask.system`.

**Limits:**

- 8 questions per IP per minute (Netlify rate limit).
- A daily cap on model calls (`AI_DAILY_CAP`, kept in Netlify Blobs).
- A shared cooldown when Groq says slow down.
- In the browser: 25 AI questions per visit, one at a time, 3 seconds apart.
- Questions are capped at 300 characters.
- Repeat first questions are served from Netlify's CDN for a week; each deploy clears them.

**Privacy:**

- Question text is never logged or stored.
- Emails and phone numbers are stripped before a question leaves for the model.
- A conversation lasts for the visit: page hops keep it, a refresh clears it.
- The chat says "Questions go to an AI to answer. Nothing is saved."

**Test locally:**

1. `cp .env.example .env` (it starts on `AI_PROVIDER=mock`).
2. Run `npx netlify-cli dev` and open :8888.
3. In another terminal, run `node scripts/ask-eval.mjs`, which checks every tier, the false-positive traps and each failure path.
4. With a real key in `.env`, run `node scripts/ask-eval.mjs --real` (about 15 model calls).

The daily cap and shared cooldown need Netlify Blobs, so check them on a deploy preview with `--deployed`.

## Look

Defaults are in `site.config.ts` → `look` (palette `matcha`, type `funnel`, sidebar `tinted`; `ink` gives a dark sidebar in light mode). A visitor's own palette, light/dark and type choice is remembered in their browser. The Funnel pairing is self-hosted; Cabinet, Sentient and Arcade load from Fontshare only when a visitor picks them.

The favicon follows the palette (and Gotham); `public/favicon.svg` is the Matcha default. The Sisyphus loader is the "thinking" state in the chat, and covers the page when moving to another page takes longer than 400ms (slow connections; pages are prefetched on hover, so it's rare). Specs: `_design/handoff_brand_bits/README.md`.

## Deploy to Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new project → Import an existing project →** pick the repo. Build settings come from `netlify.toml` (`npm run build`, publish `dist`, Node 22, functions in `netlify/functions`).
3. Environment variables: the `AI_*` set for AI answers (see above), and optionally `PUBLIC_POSTHOG_KEY` / `PUBLIC_POSTHOG_HOST` (analytics; nothing loads when unset; no cookies).
4. Deploy. Canonical URLs, the sitemap and RSS use Netlify's `URL` automatically. With a custom domain, also update `url` and `handle` in `site.config.ts`.

## Before going live

- [ ] Every note and essay is a draft with placeholder dates from the design. Edit and publish the ones that are true (`src/content/notes.yaml`, `src/content/essays/`). Until then, Field notes shows an empty state.
- [ ] Review the case-study text (from the design handoff), especially Transact Comply's "What I'd do differently".
- [ ] Replace `https://medium.com/` in the three Medium essay stubs with real post URLs, or delete them.
- [ ] Check `handle` in `site.config.ts` (`aayush.site` is the design's placeholder; it appears in chat replies and on the résumé page).
- [ ] The résumé page shows your phone number (as the PDF does). Remove `phone` from `site.config.ts` if you'd rather not.
- [ ] Add the Groq key and the other `AI_*` variables in Netlify (see AI answers), then run `node scripts/ask-eval.mjs <preview-url> --real --deployed` against a deploy preview.

## Design

`_design/` holds the Claude Design export. Open `_design/Chat Portfolio Devices.dc.html` in a browser (served over http, e.g. `npx serve _design`) for every v2 screen, palette and type pairing. `_design/PortfolioApp.dc.html` is the live prototype; `_design/brief.md` is the original brief.
