# Handoff: favicon, loader, crash screen

This adds three features to an **existing** portfolio site. Change only what is listed here and leave everything else alone.

## Paste this into Claude Code
> Read `handoff_brand_bits/README.md` and the reference files next to it. Implement the favicon, the Sisyphus loader and the crash screen in my existing site, following the specs exactly. Use my site's existing theme tokens and components. Don't restyle or restructure anything else. Start by showing me where each piece will hook in, then build.

## What's in this folder
- `favicon.svg`: the static favicon (L1, Matcha). Use it as the default in `<head>`.
- `reference/Loader.dc.html` and `reference/Crash.dc.html`: working prototypes. The logic class inside each file (`class Component …`) holds the exact animation code. Port it; don't embed these files.
- `reference/support.js`: needed only to open the prototypes in a browser. **Don't ship it.**

The prototypes read the site's CSS variables. Map them to your own tokens:

| Prototype var | Meaning |
|---|---|
| `--bg` | page background |
| `--tx` | main text / ink |
| `--mu` | muted text |
| `--ac` | accent |
| `--on-ac` | text on accent |
| `--serif` | display font family |
| `--mono` | mono font family |

---

## 1. Favicon (L1, the "a/")
A 32×32 rounded tile (rx 8) holding a single-storey "a" (a ring plus a stem) and a forward slash.
- **Tile** = the palette's dark ink. **Glyph** = the dark-sidebar accent.
- Generate it at runtime and swap `<link rel="icon">` to a `data:image/svg+xml` URL whenever the palette changes. Only update when the colours actually change.

```js
const favSvg = (bg, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${bg}"/><circle cx="11.2" cy="18" r="4.6" fill="none" stroke="${fg}" stroke-width="3"/><rect x="14.4" y="12" width="3" height="11.2" rx="0.5" fill="${fg}"/><polygon points="19.4,25 22.4,25 27.2,9 24.2,9" fill="${fg}"/></svg>`;
```

| Palette | Tile | Glyph |
|---|---|---|
| Matcha | #1D211B | #B9CF9A |
| Espresso | #241B16 | #D9A574 |
| Midnight | #161B2B | #A9B4FF |
| Oxblood | #26161A | #E6A3AE |
| Graphite | #1A1A19 | #D6E36B |
| Gotham (easter egg) | #121316 | #F2C230 |

Light and dark mode use the same favicon, because the dark tile reads well on both kinds of browser chrome.

Page titles: `Aayush Kumar — PM who builds` on Home, `{Page} — Aayush Kumar` on section pages, `{Case/essay title} — Aayush Kumar` on a case study or essay, and `System crashed — Aayush Kumar` while the crash screen is showing.

---

## 2. Loader: Sisyphus and the AI boulder
An inline SVG (`viewBox 0 0 240 150`). The whole scene sits in `<g transform="rotate(-14 120 110)">` so the ground slopes up to the right. Copy the SVG markup straight from `reference/Loader.dc.html`.

**Colours (tokens only, so it works with every palette and font):**
- figure, slope and boulder outline: `--tx`
- ground dashes: `--tx` at 35% opacity
- boulder and sweat drop: `--ac`
- "AI" on the boulder: `--on-ac`, in `--serif` at 700, 27px
- status line: `--mono`, 14px, `--tx`
- attempt line: `--mono`, 10.5px, uppercase, `--mu`
- backdrop: `--bg`

**Animation:** one `requestAnimationFrame` loop that sets SVG attributes, so it stays smooth and doesn't depend on CSS keyframes. With `t` in seconds, `v = 30` and `r = 33`:
- ground `stroke-dashoffset = v·t`
- boulder `rotate(v·t/r rad → deg, 152, 84)`. The "AI" turns with it.
- legs `rotate(±15·sin(2πt/0.9), 83, 90)`, the two legs in opposite directions
- body `translate(0, −|sin|·1.6)`
- sweat drop: every 1.6s it moves by (−7·p, 9·p²) and fades in, then out

**Copy:** the status line cycles every 2s through: *Rolling the boulder uphill… · Rewriting the PRD. Again… · Running one more eval… · Waiting on the model… · Shipping. Almost…*. The attempt line reads `Attempt 2,417 · one must imagine the PM happy`, and the number goes up by one every cycle.

**Two variants:**
- **Full:** fills the viewport and shows the 260×162 SVG with both lines stacked underneath.
- **Compact:** a row with a 64×40 SVG and the status line only. It's the "thinking" state in chat.

**When it shows:**
- First load: the full loader stays up until the content and `document.fonts.ready` have both resolved, for **at least 1.9s**. After 5s it hides regardless. The PRD-tear intro starts only once the loader is gone.
- Chat: a bot reply shows the compact loader while it waits.
- `prefers-reduced-motion`: no animation loop. The status line still cycles.

---

## 3. Crash screen (blocked question)
**Trigger:** a question that's blocked. For now, test the input against:
```js
/ignore (all|any|the|previous|prior|your)|system prompt|jailbreak|developer mode|\bDAN\b|pretend (you|to be)|api key|password|bypass|disregard|reveal your/i
```
Once the AI is connected, replace this with the model or moderation verdict. The hidden `/crash` command (Play group, visible only after typing `/`) also triggers it. While the crash is running, the box ignores global key shortcuts.

**Sequence, 4.6s.** It runs on a `<canvas>` overlay. The canvas's real resolution is the game grid, with `P = max(3, round(min(W,H)/110))` screen pixels per game pixel, and CSS scales it up with `image-rendering: pixelated`.

| Time (s) | What happens |
|---|---|
| 0–1.6 | Red flash overlay. A **WARNING** banner with yellow/black hazard stripes and the line "GUARDRAIL BREACH DETECTED" (Press Start 2P). The page shakes ±3px. |
| 0.9–2.2 | A pixel sky dragon flies in from the right, ease-out cubic, to 58% of the width. Its 48-segment body follows a moving sine wave, with gold bands and red fin dots. Head and jaw sprites are in the logic class. |
| 1.6–2.8 | The screen darkens to 65%. |
| 2.2–3.0 | The jaw opens and a charge ball grows at the mouth while 18 particles spiral in. |
| 3.0–3.9 | A beam fires left across the screen: gold, then pale yellow, then a white core, with sparks along the edges. Shake goes up to ±12px. |
| 3.9–4.5 | Boom: a white flash, three expanding pixel rings and 110 pieces of debris with gravity. The page underneath scales to 1.05, rotates −1.5°, blurs 8px and fades out. |
| 4.6 | The crash screen appears. |

**Crash screen:** background #0B0C0E with faint scanlines.
- **HUD row:** `AAYUSH.EXE · HP [▮] 0/100 · SCORE 000384`
- `ERROR 0x0180 · GUARDRAIL_BREACH`. 0x180 is 384, Rayquaza's Pokédex number.
- **Heading:** "SYSTEM / CRASHED" in Press Start 2P, 28–64px, with a 5px red (#E8392F) offset shadow.
- **Line:** "That question tripped the guardrails. A sky dragon took care of the rest."
- **The question echoed back** in a dashed box, cut off at 90 characters. Leave it out when the trigger was `/crash`.
- **▶ REFRESH:** a yellow (#F2C230) pixel button with a hard shadow. It's focused automatically, and Enter also works.
- A blinking "PRESS ENTER TO CONTINUE" line.
- **Footer:** "Ask about work, building or AI. Those are fair game."

**Refresh** resets the page styles you changed, clears the chat and goes Home. It then reboots: the loader shows, then the PRD-tear intro plays again. Without a host app, it falls back to `location.reload()`.

**Reduced motion:** go straight to the crash screen.

The dragon is an **original** sprite inspired by Rayquaza. Keep it original; don't swap in official artwork.

---

## Acceptance checks
- The favicon changes to match each of the five palettes and Gotham, and is legible at 16px.
- The loader looks right in every palette, in light and dark, and in all five font pairings. "AI" stays readable on Graphite light.
- First load runs loader → PRD intro → page, with no flash of unstyled content.
- A blocked question plays the full sequence. Refresh brings the site back with nothing broken (no leftover blur or transform).
- No console errors. Keyboard: Enter on the crash screen works and focus is visible.
