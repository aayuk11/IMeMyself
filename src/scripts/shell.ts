// App shell: mobile drawer, desktop sidebar collapse, and reading focus on essays and case studies.
const root = document.documentElement;
const desktop = matchMedia('(min-width: 1024px)');
const SIDE_KEY = 'ak-side';

const sidebar = (): HTMLElement | null => document.getElementById('sidebar');
const opener = (): HTMLButtonElement | null => document.querySelector('[data-side-open]');

export const isDocPage = (): boolean => document.body.hasAttribute('data-doc');
export const drawerOpen = (): boolean => root.dataset.drawer === 'open';

export function openDrawer(): void {
  root.dataset.drawer = 'open';
  sidebar()?.querySelector<HTMLElement>('a, button')?.focus();
}

export function closeDrawer(returnFocus = true): void {
  if (!drawerOpen()) return;
  delete root.dataset.drawer;
  if (returnFocus) opener()?.focus();
}

function setCollapsed(collapsed: boolean): void {
  if (collapsed) root.dataset.side = 'collapsed';
  else delete root.dataset.side;
  try {
    if (collapsed) sessionStorage.setItem(SIDE_KEY, 'collapsed');
    else sessionStorage.removeItem(SIDE_KEY);
  } catch {
    // Storage blocked: the sidebar state lasts for this page only.
  }
}

function syncFocusButton(): void {
  const on = 'focus' in root.dataset;
  document.querySelectorAll<HTMLButtonElement>('[data-focus-toggle]').forEach((b) => {
    b.setAttribute('aria-pressed', String(on));
    b.textContent = on ? 'Exit focus' : 'Focus';
  });
}

/** Toggle reading focus. Returns false when the current page isn't an essay or case study. */
export function toggleFocus(): boolean {
  if (!isDocPage()) return false;
  if ('focus' in root.dataset) delete root.dataset.focus;
  else root.dataset.focus = '';
  syncFocusButton();
  return true;
}

function syncCloseLabel(): void {
  document.querySelector('[data-side-close]')?.setAttribute('aria-label', desktop.matches ? 'Collapse sidebar' : 'Close navigation');
}

export function initShell(): void {
  syncCloseLabel();
  desktop.addEventListener('change', () => {
    syncCloseLabel();
    closeDrawer(false);
  });

  opener()?.addEventListener('click', () => {
    if (desktop.matches) {
      setCollapsed(false);
      if ('focus' in root.dataset) toggleFocus();
    } else {
      openDrawer();
    }
  });

  document.querySelector('[data-side-close]')?.addEventListener('click', () => {
    if (desktop.matches) {
      setCollapsed(true);
      opener()?.focus();
    } else {
      closeDrawer();
    }
  });

  document.querySelector('[data-scrim]')?.addEventListener('click', () => closeDrawer());
  sidebar()?.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) closeDrawer(false);
  });

  document.querySelectorAll('[data-focus-toggle]').forEach((b) => b.addEventListener('click', () => toggleFocus()));
  syncFocusButton();
}
