# Handoff: Aayush Kumar — personal portfolio (v1.0)

## Overview
A personal portfolio for a product manager who builds AI products. The design is editorial and minimal: an Instrument Serif display face for writing, JetBrains Mono for metadata (building). It adds three personal touches:
- a docked, Claude-style **command box** on every page, which handles navigation and Q&A;
- a one-time **PRD-tear intro** on Home;
- a few **hidden easter-egg commands** (Pokémon, One Piece, Batman, MCU).

The site has three sections: **Work · Writing · Resume (PDF)**. Planned stack: Astro 5 + Tailwind + MDX, content in `site.config.ts`, Medium RSS at build time, Netlify, PostHog.

## About the design files
The files in this bundle are **design references built in HTML**. They are prototypes that show the intended look and behaviour, not production code to copy. Rebuild them in the target codebase (Astro + Tailwind, per the brief) using its own patterns. Open `Portfolio.dc.html` in a browser. It is a pan/zoom canvas with every screen, and frames marked **LIVE** scroll and have a working command box.

## Fidelity
**High-fidelity.** Colours, type, spacing and interactions are final. Recreate them pixel-accurately. Copy is final except for article titles, essay text and the case-study narrative, which are drafts for Aayush to replace.

## Screens (canvas ids)
| id | Screen | Notes |
|---|---|---|
| S0 | Design system | Token table, type scale, spacing, components, command-box states, intro, command list |
| S1 / S2 | Home, light / dark | Intro band → Selected work → Writing → Background band → Footer. Intro plays on load |
| S3 | Home, mobile 390 | Single column, 20px gutters, 44px hit targets, 12px-inset command box |
| S4 | Work index | Three case rows: meta column 180 / content / diagram 340, 48px gaps |
| S5 | Project detail | Header, 500px hero diagram, 200px sticky TOC + 680px prose. Sections: Problem, What I built, How it worked, Outcome, What I'd do differently (on --surface) |
| S6 | Writing index | Year groups (serif 40px year, 200px column) and article rows; Medium posts tagged |
| S7 / S8 | Article, light / dark | 680px measure; pull-quote, code block, wide figure (breaks out 110px each side), captions |

### Layout rules
- Grid container `max-width:1100px`, prose `680px`. Section rhythm 96px on desktop, 64px on mobile. Breakpoints 640 / 1024 / 1280.
- **Nav**: 64px high, sticky, `background: var(--nav)` with `backdrop-filter: blur(12px)`, 1px bottom border. Name on the left; Work · Writing · Resume PDF and the theme toggle on the right. Links are 15px Inter. The active link is `--accent` with a full 1px underline.
- **Home intro band**: full-bleed `--hero` with a 1px `--hero-border` underneath and 80px margin below. Padding 112 / 80. H1 is 56px Instrument Serif: "Aayush Kumar" in `--text`, then on a new line "Product, AI, and whatever I'm building this weekend." in `--muted`. One-line bio at 17px, max 560px. Links row: email, LinkedIn, GitHub, then a mono "BUILDING · DPDP Shield ↗".
- **Section label**: 12px mono, uppercase, 0.08em tracking. The number is `--accent`, followed by " — " and the title. 1px rule below, 12px padding. "All work →" style link on the right.
- **Project card**: `--card` fill, 1px `--border`, radius 4, padding 28, 20px gap. Eyebrow is 11px mono in `--card-meta`, then a 28px serif title, a 15px muted line, metric pills, and a footer with a 1px top rule containing the tags (11px mono, muted) and a → arrow. Hover changes the background to `--card-hover`, 150ms.
- **Metric pill**: radius 999, padding 6×12, `--pill` fill with `--pill-border`. The number is 14px/600 Inter in tabular numerals and `--accent`. The label is 11px mono uppercase in `--muted`.
- **Article row**: grid `140px / 1fr / 120px`, 32px gap, 28px vertical padding, 1px bottom rule. Date is 12px mono in `--accent`. Title is 28px serif, excerpt 15px muted. Read time and the optional "Medium ↗" tag are on the right. Hover sets opacity to 0.7.
- **Background band**: full-bleed `--band` with 96px top padding. Two columns, 1.1fr and 1fr with an 80px gap: an experience timeline (1px left rule, 7px `--accent` dots; education uses a hollow dot) and skill chips (13px Inter, padding 7×10, `--chip` / `--chip-border`, radius 4) grouped under 15px/500 headings.
- **Footer**: `--footer` fill, 1px `--footer-border` top rule. Columns 1.4fr / 1fr / 1.4fr: Contact, Elsewhere, Colophon. All 12px mono. A bottom row holds © and the updated date.
- Use **ZIGRAM** in caps everywhere.

## Command box (all pages)
- Docked `position: fixed`: bottom 24px, centred, 640px wide. On mobile: bottom 12px and 12px side insets.
- Shell: `--bg` fill, 1px border (`--border`, or `--text` when focused), radius 16, `--shadow-cmd`, padding 8 8 8 18. Contents: a 15px input, a "/" keycap hint, and a 38×38 send button (`--text` background, `--bg` arrow, radius 11).
- **Focused and empty**: show three suggestion chips above the shell: "What has Aayush shipped?", "How does he use AI day to day?", "What is he building right now?".
- **Typing `/`**: show a list of commands (radius 14, `--shadow-pop`): `/work`, `/writing`, `/background`, `/resume`, `/theme`. Filter by prefix. ↑/↓ moves the highlighted row (highlight is `--surface`), Enter runs it, Esc clears and closes. Hidden commands never appear in this list.
- **Free text + Enter**: call the LLM (the prototype uses `window.claude.complete`; in production use a Netlify function and the Anthropic API). Show an answer card above the shell containing "› question", the 15px answer and an "Answered by Claude from my résumé" footnote. Show "Thinking…" while the request is pending. The system prompt is in `Portfolio.dc.html` (`SYSTEM` in the logic class). It restricts answers to résumé facts, 2–4 sentences, plain text, and mentions hobbies only if asked directly. Rate-limit and cache answers on the server.
- Nav commands scroll to `[data-sec]` sections on Home and navigate to the page from anywhere else.

### Hidden commands (easter eggs, not listed anywhere in the UI)
| Command | Effect |
|---|---|
| `/pokedex` | Modal, 560px wide, radius 16: red header band, "Entry No. 0117", avatar slot, "Aayush — The Builder Pokémon", PRODUCT and AI type chips, an Ability / Moves / Weakness / Habitat list, flavour text, Close. Closes on backdrop click or Esc. |
| `/gear5` | Squash-and-stretch on `<main>`: scale 1 → (1.05, .9) → (.93, 1.08) → (1.03, .96) → (.99, 1.01) → 1 over 1100ms ease-in-out, plus a toast. |
| `/gotham`, `/batman` | Switches to `data-theme="gotham"`, adds a top radial glow (`--spot`) and shows a toast. `/theme` returns to light. |
| `/snap` | Every other `[data-snap]` card or row fades to opacity 0 with blur(10px) and translate(36px, -18px) over 1300ms, staggered 110ms, holds for 1.4s, then reverses. |
| `/help` | Toast: "/work · /writing · /background · /resume · /theme — and a few I'm not listing." |
Toasts: pill-shaped, `--text` background and `--bg` text, 12px mono, 84px from the top, auto-hide after 3.4s. With prefers-reduced-motion, skip the gear5 and snap animations (snap just hides and then shows).

## PRD intro (Home only)
`PrdIntro.dc.html` covers the viewport with a generic white PRD sheet ("Untitled product", meta row, skeleton sections, a red DRAFT stamp), which then tears away. There are three variants, chosen with the Intro tweak; **rip** is the default.
- **rip**: two halves clipped along a jagged vertical line, each with a drop shadow and a fibre layer (#E9E4D8). Timing: hold 700ms → tension 220ms (±0.7% x, ±0.5°) → out 1100ms `cubic-bezier(.6,.02,.3,1)` to translate(∓64%, 7%) rotate(∓9°).
- **peel**: the sheet has a jagged top edge and flips up from the top with `rotateX(40deg) translateY(-120%)`. The torn stub at the top fades out.
- **shred**: 12 vertical strips that drop (translateY 120%, ±1–4°) with staggered 45ms delays.
Plays **once per session** (sessionStorage). Click anywhere to skip. Do not play under prefers-reduced-motion. The overlay never blocks input after it finishes (`pointer-events: none`).

## Theme
Light is the default; follow `prefers-color-scheme` on first visit and store the toggle in localStorage. The theme toggle is a 36px round icon button (half-filled circle) and switches instantly, with no cross-fade. To theme, set `data-theme` on `<html>`; every colour is a token.

## Interactions & motion
- Hover: opacity or background changes over 150ms ease only.
- Text links: `--accent` text with a resting 1px `--accent-soft` underline. On hover a 1px `--accent` underline slides in left to right over 150ms; build it with two background-image layers.
- Focus: `outline: 2px solid var(--accent); outline-offset: 3px`.
- No entrance animations, parallax, scroll reveals or carousels.

## State
- `theme`: light | dark | gotham (persisted).
- Command box: `value`, `focused`, `selectedIndex`, `answer {q, text, loading}`, `toast`, `pokedexOpen`.
- `introSeen` (sessionStorage).

## Design tokens
See `tokens.css` (CSS variables for light, dark and gotham) and `tailwind.tokens.js`. Fonts: Instrument Serif 400 and italic, Inter 400/500/600, JetBrains Mono 400/500 (Google Fonts). Contrast against `--bg`: text 16.9:1 / 12.0:1, muted 5.8:1 / 6.1:1, accent 5.8:1 / 6.1:1 (light / dark).

## Assets
No images are included. Striped boxes are placeholders for conceptual diagrams (Excalidraw exports) and the Pokédex avatar. The project-detail Fig. 1 (pipeline) and Fig. 2 (before/after bars) are built in HTML/CSS; rebuild them as components. The only icon is the theme toggle: an 18px circle with a half fill.

## Files
- `Portfolio.dc.html`: all screens and the design system, with working prototypes (open in a browser).
- `PrdIntro.dc.html`: the intro overlay component (rip / peel / shred).
- `support.js`: runtime for the .dc.html files (needed only to view them).
- `tokens.css`, `tailwind.tokens.js`: the tokens.
