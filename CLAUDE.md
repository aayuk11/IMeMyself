# Portfolio — project context

Personal portfolio for Aayush Kumar, a product manager who builds AI products: a sidebar "chat" app with a
command composer on every page. User-facing docs are in README.md. Design source: `_design/PortfolioApp.dc.html`
(v2) and `_design/site.content.js`. The original brief is `_design/brief.md`; where it conflicts with this file, this file wins.

## Stack

- Astro 7 (static). Every Astro ≤ 7.2.7 has open advisories. Astro 7 specifics: JSX whitespace rules (`{' '}` between
  inline elements on separate lines), stricter HTML (close every tag), `z` from `astro/zod` (Zod 4: `z.url()`).
- Tailwind CSS 4 via `@tailwindcss/vite`; theme in `tailwind.config.mjs`, loaded with `@config` in `src/styles/global.css`.
- MDX for case studies and essays; collections in `src/content.config.ts` (`projects`, `essays` via glob, `notes` via file loader on `notes.yaml`).
- TypeScript strict, no `any`. Client JS is plain TS modules in `src/scripts/`, loaded once from `Base.astro`. No framework islands.
- Netlify. Optional function `netlify/functions/ask.mts` (`GET /api/ask`, `@anthropic-ai/sdk`), used only when `site.ask.enabled`.

## Shell and state

- `Base.astro` renders: Sidebar (sticky ≥1024px, drawer below), Topbar (breadcrumb `~/…`), `<main data-page class="page">`,
  ChatPanel (hidden; replaces main in place on a question, history entry `#conversation`, sessionStorage `ak-chat`), Composer (sticky bottom).
- `<html>` attributes drive everything: `data-palette`, `data-mode` (light | dark), `data-type`, `data-sidebar="ink"`,
  `data-gotham` (session only), `data-side="collapsed"`, `data-drawer="open"`, `data-focus` (reader focus), `data-intro`,
  `data-boot="loading"` (first page per session, sessionStorage `ak-booted`).
  The inline head script applies stored prefs (`localStorage['ak-site-prefs']`) before first paint. Sidebar pressed states are CSS-driven from these attributes.
- `.page` and the FlowDiagram root are size containers; fluid sizes use `clamp(…cqi…)` like the design. Don't put containment on `.column`
  (it would capture fixed-position children like the toast).
- Brand bits (spec `_design/handoff_brand_bits/README.md`): palette favicon (`FAVICON` in `src/lib/look.ts`, swapped in `prefs.ts` `sync()`),
  Sisyphus `Loader.astro` + `scripts/loader.ts` (boot overlay, then the PRD intro via `bootDone`; compact variant in chat), and the guardrail
  crash `Crash.astro` + `scripts/crash.ts` (canvas, `--crash-*` tokens, `.shell` made inert; Refresh clears session state and reloads Home).

## Design rules

- Colours only via tokens (`bg-surface`, `text-muted`, `border-border`, `text-ink`, `bg-accent`…) or `var(--…)`. Palettes in `tokens.css`
  are generated from the design file's `PAL`; don't hand-edit them. Fixed literals (PRD sheet, Pokédex, crash screen) are named tokens.
- Type: `display` class / `font-display` for headings (weight `var(--display-weight)`), `font-sans` body, `font-mono` labels. `.eyebrow` = mono 11 uppercase.
- Reader typography is `.doc-body`, scoped with `:where()`; add `not-prose` to component roots inside it.
- Motion: opacity/background on hover only. No entrance animations. Respect `prefers-reduced-motion` (intro, loader, crash, `/gear5`, `/snap` do).
- Breakpoints: `sm` 640, `md` 1024 (sidebar in flow), `lg` 1280.
- `_design/` is reference only: never import from it, never ship it (Tailwind is told not to scan it).

## Content

- `site.config.ts`: all personal data and the AI facts (`ask.system`). Keep it free of Astro imports (the function bundles it).
- Drafts (`draft: true`) render in dev only. All notes/essays from the design are drafts with placeholder dates — never flip them on the user's behalf.
- Confidentiality: ZIGRAM (caps) is the employer. No client names, real transaction data or production screenshots; diagrams stay conceptual.

## Checks

- `npm run build` runs `astro check` first; keep 0 errors / 0 warnings.
- Verify in a browser at 390px and 1440px, light and dark, plus one other palette. No horizontal scroll at 320px.
- Keyboard: composer is a combobox + listbox (↑ ↓ Enter Esc), `/` and Cmd/Ctrl+K open it, drawer closes on Esc and returns focus.
- Lighthouse: 100 accessibility / best practices / SEO; performance ~98–100 (Home's first-visit intro costs a little).
