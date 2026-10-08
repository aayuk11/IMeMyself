// Look preferences: palette, light/dark, type pairing (remembered), plus Gotham (this visit only).
// The inline script in Base.astro applies the stored choice before first paint; this module handles changes.
import type { PaletteId, TypeId } from '../../site.config';
import { fontshareHref, PALETTES, PREFS_KEY, TYPES } from '../lib/look';
import { setFavicon } from './favicon';

type Mode = 'light' | 'dark';
interface Prefs {
  palette?: PaletteId;
  mode?: Mode;
  type?: TypeId;
}

const root = document.documentElement;

function read(): Prefs {
  try {
    return (JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Prefs) ?? {};
  } catch {
    return {};
  }
}

function write(patch: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...read(), ...patch }));
  } catch {
    // Private mode: the change still applies for this page view.
  }
}

export const currentPalette = (): PaletteId => (root.dataset.palette as PaletteId) || 'matcha';
export const currentType = (): TypeId => (root.dataset.type as TypeId) || 'funnel';
export const currentMode = (): Mode => (root.dataset.mode === 'dark' ? 'dark' : 'light');
export const isGotham = (): boolean => 'gotham' in root.dataset;
export const paletteLabel = (id: PaletteId = currentPalette()): string => PALETTES.find((p) => p.id === id)?.label ?? id;
export const typeLabel = (id: TypeId = currentType()): string => TYPES.find((t) => t.id === id)?.label ?? id;

function loadFonts(type: TypeId): void {
  const query = TYPES.find((t) => t.id === type)?.fontshare;
  if (!query) return;
  const href = fontshareHref(query);
  if (document.querySelector(`link[href="${CSS.escape(href)}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}

/** Reflect the current look in controls and browser chrome. */
function sync(): void {
  setFavicon(isGotham() ? 'gotham' : currentPalette());
  const dark = isGotham() || currentMode() === 'dark';
  document.querySelectorAll<HTMLButtonElement>('[data-palette-pick]').forEach((b) => {
    b.setAttribute('aria-pressed', String(!isGotham() && b.dataset.palettePick === currentPalette()));
  });
  document.querySelectorAll<HTMLButtonElement>('[data-mode-pick]').forEach((b) => {
    b.setAttribute('aria-pressed', String((b.dataset.modePick === 'dark') === dark));
  });
  document.querySelectorAll<HTMLElement>('[data-cmd="/palette"] [data-hint]').forEach((h) => (h.textContent = paletteLabel()));
  document.querySelectorAll<HTMLElement>('[data-cmd="/type"] [data-hint]').forEach((h) => (h.textContent = typeLabel()));
  // Reading a computed value forces a style pass; do it after the browser has painted.
  requestAnimationFrame(() =>
    setTimeout(() => {
      const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
      if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
    }),
  );
}

export function setPalette(id: PaletteId): void {
  delete root.dataset.gotham;
  root.dataset.palette = id;
  write({ palette: id });
  sync();
}

export function setMode(mode: Mode, persist = true): void {
  delete root.dataset.gotham;
  root.dataset.mode = mode;
  if (persist) write({ mode });
  sync();
}

export function setType(id: TypeId): void {
  loadFonts(id);
  root.dataset.type = id;
  write({ type: id });
  sync();
}

export function setGotham(on: boolean): void {
  if (on) root.dataset.gotham = '';
  else delete root.dataset.gotham;
  sync();
}

/** Light ↔ dark. Leaves Gotham. */
export function toggleMode(): void {
  setMode(isGotham() || currentMode() === 'dark' ? 'light' : 'dark');
}

const next = <T>(list: readonly T[], cur: T): T => list[(list.indexOf(cur) + 1) % list.length] as T;

export function nextPalette(): PaletteId {
  const id = next(
    PALETTES.map((p) => p.id),
    currentPalette(),
  );
  setPalette(id);
  return id;
}

export function nextType(): TypeId {
  const id = next(
    TYPES.map((t) => t.id),
    currentType(),
  );
  setType(id);
  return id;
}

export function initPrefs(): void {
  sync();

  document.querySelectorAll<HTMLButtonElement>('[data-palette-pick]').forEach((b) => {
    b.addEventListener('click', () => setPalette(b.dataset.palettePick as PaletteId));
  });
  document.querySelectorAll<HTMLButtonElement>('[data-mode-pick]').forEach((b) => {
    b.addEventListener('click', () => setMode(b.dataset.modePick === 'dark' ? 'dark' : 'light'));
  });
  document.querySelector('[data-type-cycle]')?.addEventListener('click', () => nextType());
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', toggleMode));

  // Follow the OS setting until the visitor picks light or dark.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    if (!read().mode) setMode(event.matches ? 'dark' : 'light', false);
  });
}
