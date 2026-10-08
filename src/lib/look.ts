// Palettes and type pairings visitors can switch between (sidebar, /palette, /type).
// Colours live in src/styles/tokens.css; this file only names them.
import type { PaletteId, TypeId } from '../../site.config';

export const PALETTES: readonly { id: PaletteId; label: string }[] = [
  { id: 'matcha', label: 'Matcha' },
  { id: 'espresso', label: 'Espresso' },
  { id: 'midnight', label: 'Midnight' },
  { id: 'oxblood', label: 'Oxblood' },
  { id: 'graphite', label: 'Graphite' },
];

/** Fontshare families load on demand, only when a visitor picks that pairing. Everything else is self-hosted. */
export const TYPES: readonly { id: TypeId; label: string; fontshare?: string }[] = [
  { id: 'funnel', label: 'Funnel' },
  { id: 'cabinet', label: 'Cabinet', fontshare: 'f[]=cabinet-grotesk@500,700,800&f[]=switzer@400,500,600' },
  { id: 'host', label: 'Host' },
  { id: 'sentient', label: 'Sentient', fontshare: 'f[]=sentient@400,400i,500&f[]=switzer@400,500,600' },
  { id: 'arcade', label: 'Arcade', fontshare: 'f[]=array@400,600&f[]=supreme@400,500' },
];

export const fontshareHref = (query: string): string => `https://api.fontshare.com/v2/css?${query}&display=swap`;

/** localStorage key for { palette, mode, type }. */
export const PREFS_KEY = 'ak-site-prefs';

/** Favicon "a/" (L1): tile = the palette's dark ink, glyph = the dark-sidebar accent. Same in light and dark.
    Literal values because a data-URL favicon can't read CSS variables. Source: _design/handoff_brand_bits/README.md */
export const FAVICON: Readonly<Record<PaletteId | 'gotham', { tile: string; glyph: string }>> = {
  matcha: { tile: '#1D211B', glyph: '#B9CF9A' },
  espresso: { tile: '#241B16', glyph: '#D9A574' },
  midnight: { tile: '#161B2B', glyph: '#A9B4FF' },
  oxblood: { tile: '#26161A', glyph: '#E6A3AE' },
  graphite: { tile: '#1A1A19', glyph: '#D6E36B' },
  gotham: { tile: '#121316', glyph: '#F2C230' },
};

export const faviconSvg = (bg: string, fg: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${bg}"/><circle cx="11.2" cy="18" r="4.6" fill="none" stroke="${fg}" stroke-width="3"/><rect x="14.4" y="12" width="3" height="11.2" rx="0.5" fill="${fg}"/><polygon points="19.4,25 22.4,25 27.2,9 24.2,9" fill="${fg}"/></svg>`;
