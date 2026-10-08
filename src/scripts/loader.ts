// Sisyphus loader: one requestAnimationFrame loop that sets SVG attributes (ported from
// _design/handoff_brand_bits/reference/Loader.dc.html), plus the first-load boot overlay.
const MESSAGES = [
  'Rolling the boulder uphill…',
  'Rewriting the PRD. Again…',
  'Running one more eval…',
  'Waiting on the model…',
  'Shipping. Almost…',
];
const FIRST_ATTEMPT = 2417;
const BOOT_MIN_MS = 1900;
const BOOT_MAX_MS = 5000;
export const BOOTED_KEY = 'ak-booted';

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

let resolveBoot: () => void = () => {};
/** Resolves once the first-load loader is gone (immediately when it isn't showing). */
export const bootDone: Promise<void> = new Promise((resolve) => (resolveBoot = resolve));

/** First load of a visit: the head script set <html data-boot="loading">, so the full loader is already on screen.
    Keep it until the page and fonts are ready, for at least 1.9s, and never more than 5s. */
export function initBootLoader(): void {
  const root = document.documentElement;
  const overlay = document.querySelector('[data-boot-loader]');
  if (!overlay || root.dataset.boot !== 'loading') {
    resolveBoot();
    return;
  }
  try {
    sessionStorage.setItem(BOOTED_KEY, '1');
  } catch {
    // Storage blocked: the loader shows on every load, which is harmless.
  }

  const shell = document.querySelector<HTMLElement>('.shell');
  if (shell) shell.inert = true;
  const stop = animateLoader(overlay);

  // performance.now() counts from navigation start, when the loader first painted.
  const after = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, Math.max(0, ms - performance.now())));
  const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise<void>((r) => addEventListener('load', () => r(), { once: true }));
  const ready = Promise.all([loaded, document.fonts.ready, after(BOOT_MIN_MS)]);

  void Promise.race([ready, after(BOOT_MAX_MS)]).then(() => {
    stop();
    delete root.dataset.boot;
    if (shell) shell.inert = false;
    resolveBoot();
  });
}
