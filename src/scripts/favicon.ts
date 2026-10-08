// Favicon "a/": the static /favicon.svg is the Matcha tile. Other palettes (and Gotham) get a generated
// data: URL, swapped only when the colours actually change.
import type { PaletteId } from '../../site.config';
import { FAVICON, faviconSvg } from '../lib/look';

let applied = `${FAVICON.matcha.tile}${FAVICON.matcha.glyph}`;

export function setFavicon(key: PaletteId | 'gotham'): void {
  const colours = FAVICON[key] ?? FAVICON.matcha;
  const next = `${colours.tile}${colours.glyph}`;
  if (next === applied) return;
  const link = document.querySelector<HTMLLinkElement>('link[data-favicon]');
  if (!link) return;
  applied = next;
  link.href = `data:image/svg+xml,${encodeURIComponent(faviconSvg(colours.tile, colours.glyph))}`;
  document.head.append(link); // the last icon link wins over the PNG fallback
}
