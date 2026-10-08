// Sisyphus loader: one requestAnimationFrame loop that sets SVG attributes (ported from
// _design/handoff_brand_bits/reference/Loader.dc.html). Compact: the chat's "thinking" state.
// Full: covers the page area when a page change is slow.
const MESSAGES = [
  'Rolling the boulder uphill…',
  'Rewriting the PRD. Again…',
  'Running one more eval…',
  'Waiting on the model…',
  'Shipping. Almost…',
];
const FIRST_ATTEMPT = 2417;
const NAV_DELAY_MS = 400;

const reducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Start a loader's animation and status cycle. Returns a stop function. */
export function animateLoader(el: Element): () => void {
  const part = (name: string): Element | null => el.querySelector(`[data-l="${name}"]`);
  const msg = part('msg');
  const attempt = part('attempt');

  let mi = 0;
  let n = FIRST_ATTEMPT;
  const iv = window.setInterval(() => {
    mi = (mi + 1) % MESSAGES.length;
    n += 1;
    if (msg) msg.textContent = MESSAGES[mi] ?? '';
    if (attempt) attempt.textContent = n.toLocaleString('en-US');
  }, 2000);

  let raf = 0;
  if (!reducedMotion()) {
    const ground = part('ground');
    const boulder = part('boulder');
    const fig = part('fig');
    const legA = part('legA');
    const legB = part('legB');
    const sweat = part('sweat');
    const t0 = performance.now();
    const v = 30;
    const r = 33;
    const loop = (now: number): void => {
      const t = (now - t0) / 1000;
      const ph = Math.sin((t * Math.PI * 2) / 0.9);
      ground?.setAttribute('stroke-dashoffset', (v * t).toFixed(2));
      boulder?.setAttribute('transform', `rotate(${(((v * t) / r) * 57.2958).toFixed(2)} 152 84)`);
      legA?.setAttribute('transform', `rotate(${(ph * 15).toFixed(2)} 83 90)`);
      legB?.setAttribute('transform', `rotate(${(-ph * 15).toFixed(2)} 83 90)`);
      fig?.setAttribute('transform', `translate(0 ${(-Math.abs(ph) * 1.6).toFixed(2)})`);
      const sp = (t % 1.6) / 1.6;
      sweat?.setAttribute('transform', `translate(${(-7 * sp).toFixed(2)} ${(9 * sp * sp).toFixed(2)})`);
      sweat?.setAttribute('opacity', sp < 0.15 ? (sp / 0.15).toFixed(2) : (1 - sp).toFixed(2));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  return () => {
    window.clearInterval(iv);
    cancelAnimationFrame(raf);
  };
}

let navTimer = 0;
let stopNav: (() => void) | null = null;
const navLoader = (): HTMLElement | null => document.querySelector('[data-nav-loader]');

/** A page change is starting. If the next page hasn't replaced this one within 400ms, show the loader. */
export function pageLoading(): void {
  window.clearTimeout(navTimer);
  navTimer = window.setTimeout(() => {
    const overlay = navLoader();
    if (!overlay?.hidden) return;
    overlay.hidden = false;
    stopNav = animateLoader(overlay);
  }, NAV_DELAY_MS);
}

function pageLoaded(): void {
  window.clearTimeout(navTimer);
  stopNav?.();
  stopNav = null;
  const overlay = navLoader();
  if (overlay) overlay.hidden = true;
}

export function initNavLoader(): void {
  // On window, so any handler that cancels the click has already run.
  window.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('a') : null;
    if (!link?.href || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
    const url = new URL(link.href);
    // Other sites, mailto:, and links within this page aren't a page change here.
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
    pageLoading();
  });
  // Back/forward cache restores the page as it was left, loader included.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) pageLoaded();
  });
  // A stopped page change leaves this page in place.
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') pageLoaded();
  });
}
