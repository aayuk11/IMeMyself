// Guardrail crash: a 4.6s canvas sequence (warning, Rayquaza, charge, beam, boom), then the
// "SYSTEM CRASHED" screen. Ported from the logic class in _design/handoff_brand_bits/reference/Crash.dc.html.
// The dragon is an original sprite inspired by Rayquaza; keep it original.

const CHAT_KEY = 'ak-chat';
const INTRO_KEY = 'introSeen';
const CRASH_TITLE = 'System crashed — Aayush Kumar';

const COL = { K: '#0B2A18', G: '#2E9E52', D: '#1F6B38', L: '#7ED37F', Y: '#F2C230', W: '#FFF6C8', R: '#D8352A', M: '#3A0A0A' } as const;
type ColKey = keyof typeof COL;

const HEAD = [
  '...................KKKKK',
  '...............KKKKYYYYK',
  '............KKKGGGGKKKK',
  '..........KKGGGGGGGK',
  '.........KGGGYYYGGGGK',
  '......KKKGGGYYKGGGGGGKKK',
  '...KKKGGGGGGYKKGGGGGGYYK',
  '.KKGGGGGGGGGGGGGGGGGKKK',
  'KGKGGGGGGGGGGGGGGGGGK',
  'KLLGGGGGGGGGGGGGGGGK',
  'KWWKWWKWWKGGGGGGGGK',
  '.KKKKKKKKKKKKKKKKKK',
];
const JAW = ['.KWWKWWKWWKGGGGGK', '..KLLLLLLLLLLLLK', '...KKKKKKKKKKKK'];

interface Debris {
  vx: number;
  vy: number;
  sz: number;
  c: string;
}

interface Game {
  ctx: CanvasRenderingContext2D;
  GW: number;
  GH: number;
  t0: number;
  debris: Debris[] | null;
  ix: number;
  iy: number;
}

let active = false;
let targets: HTMLElement[] = [];
let g: Game | null = null;

/** True from the trigger until the visitor refreshes. The composer ignores global shortcuts meanwhile. */
export const isCrashActive = (): boolean => active;

const reducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = <T extends Element>(selector: string): T | null => document.querySelector<T>(selector);

function restoreHost(): void {
  for (const t of targets) {
    t.style.transform = '';
    t.style.filter = '';
    t.style.opacity = '';
  }
}

/** Reset what the crash changed, clear the chat, and reboot at Home, where the PRD intro plays again. */
function restart(): void {
  restoreHost();
  try {
    sessionStorage.removeItem(CHAT_KEY);
    sessionStorage.removeItem(INTRO_KEY);
  } catch {
    // Storage blocked: a plain reload still brings the site back.
  }
  if (location.pathname === '/' && !location.hash) location.reload();
  else location.assign('/');
}

// ---------- pixel drawing ----------

function disc(cx: number, cy: number, r: number, col: string): void {
  if (!g) return;
  g.ctx.fillStyle = col;
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy));
    g.ctx.fillRect(Math.round(cx - w), Math.round(cy + dy), 2 * w + 1, 1);
  }
}

function ring(cx: number, cy: number, r: number, col: string, sz: number): void {
  if (!g || r <= 0) return;
  g.ctx.fillStyle = col;
  const n = Math.max(24, Math.round(r * 3));
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    g.ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), sz, sz);
  }
}

function sprite(rows: string[], x: number, y: number): void {
  if (!g) return;
  const { ctx } = g;
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const ch = row[i] as ColKey | '.';
      if (ch === '.') continue;
      ctx.fillStyle = COL[ch];
      ctx.fillRect(x + i, y + j, 1, 1);
    }
  });
}

function drawDragon(hx: number, hy: number, jaw: number, t: number): void {
  if (!g) return;
  const { ctx } = g;
  const N = 48;
  const segs: [number, number, number][] = [];
  for (let i = 0; i < N; i++) {
    const amp = 7 * Math.min(1, i / 6);
    segs.push([hx + 17 + i * 3, Math.round(hy + 8 + Math.sin(i * 0.36 - t * 6) * amp), Math.max(3, Math.round(10 - (i * 7) / N))]);
  }
  for (let i = N - 1; i >= 0; i--) {
    const [x, y, th] = segs[i] as [number, number, number];
    ctx.fillStyle = COL.K;
    ctx.fillRect(x - 2, y - Math.ceil(th / 2) - 1, 6, th + 2);
  }
  for (let i = N - 1; i >= 0; i--) {
    const [x, y, th] = segs[i] as [number, number, number];
    const top = y - Math.ceil(th / 2);
    ctx.fillStyle = COL.G;
    ctx.fillRect(x - 1, top, 4, th);
    ctx.fillStyle = COL.D;
    ctx.fillRect(x - 1, top + th - 1, 4, 1);
    ctx.fillStyle = COL.L;
    if (th > 5) ctx.fillRect(x - 1, top + 1, 4, 1);
    if (i % 5 === 2) {
      ctx.fillStyle = COL.Y;
      ctx.fillRect(x, top, 2, th);
    }
    if (i % 7 === 3) {
      ctx.fillStyle = COL.R;
      ctx.fillRect(x, top - 2, 2, 2);
      ctx.fillStyle = COL.K;
      ctx.fillRect(x - 1, top - 2, 1, 2);
    }
  }
  if (jaw > 0) {
    ctx.fillStyle = COL.M;
    ctx.fillRect(hx + 2, hy + 11, 15, jaw + 1);
  }
  sprite(JAW, hx + 1, hy + 11 + jaw);
  sprite(HEAD, hx, hy);
}

/** Debris in the current palette's colours (the prototype used Matcha's), plus gold and white. */
function debrisColours(): string[] {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string): string => css.getPropertyValue(name).trim() || fallback;
  return [token('--bg', '#F4F5F0'), token('--border', '#DADED1'), token('--text', '#1D211B'), token('--accent', '#6F8C4E'), '#F2C230', '#FFFFFF'];
}

// ---------- sequence ----------

function frame(t: number, warn: HTMLElement, debrisPalette: string[]): boolean {
  if (!g) return false;
  const { ctx, GW, GH } = g;
  const C = COL;
  const cl = (x: number): number => Math.min(1, Math.max(0, x));
  const ease = (x: number): number => 1 - Math.pow(1 - cl(x), 3);
  ctx.clearRect(0, 0, GW, GH);

  if (t < 1.6) {
    ctx.fillStyle = `rgba(210,30,30,${Math.sin(t * 16) > 0 ? 0.2 : 0.07})`;
    ctx.fillRect(0, 0, GW, GH);
  } else {
    ctx.fillStyle = `rgba(8,9,12,${(0.2 + 0.45 * cl((t - 1.6) / 1.2)).toFixed(3)})`;
    ctx.fillRect(0, 0, GW, GH);
  }
  if (t > 1.6 && !warn.hidden) warn.hidden = true;

  const hx0 = GW + 6;
  const hx1 = Math.round(GW * 0.58);
  const hx = Math.round(hx0 + (hx1 - hx0) * ease((t - 1.0) / 1.3));
  const hy = Math.round(GH * 0.36 + Math.sin(t * 3) * 2);
  const jaw = t < 2.2 ? 0 : t < 2.5 ? Math.round((3 * (t - 2.2)) / 0.3) : t < 3.9 ? 3 : Math.max(0, 3 - Math.round((t - 3.9) * 8));
  if (t > 0.9 && t < 4.3) drawDragon(hx, hy, jaw, t);
  const mx = hx - 1;
  const my = hy + 12 + Math.floor(jaw / 2);

  if (t > 2.2 && t < 3.0) {
    const p = (t - 2.2) / 0.8;
    const r = Math.round(1 + 5 * p + (Math.random() < 0.3 ? 1 : 0));
    disc(mx - r, my, r, C.Y);
    disc(mx - r, my, Math.max(0, r - 2), C.W);
    for (let k = 0; k < 18; k++) {
      const a = k * 2.399 + t * 2;
      const d = (1 - ((p * 2 + k / 18) % 1)) * 36;
      ctx.fillStyle = k % 2 ? C.Y : C.W;
      ctx.fillRect(Math.round(mx - r + Math.cos(a) * d), Math.round(my + Math.sin(a) * d), 1, 1);
    }
  }

  if (t >= 3.0 && t < 3.9) {
    const p = (t - 3.0) / 0.9;
    const h = Math.round(Math.min(1, p * 6) * 8) + (Math.random() < 0.5 ? 1 : 0);
    const len = mx + 2;
    ctx.fillStyle = `rgba(255,240,180,${(0.1 + Math.random() * 0.08).toFixed(3)})`;
    ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = C.Y;
    ctx.fillRect(-2, my - h, len, h * 2 + 1);
    ctx.fillStyle = '#FFE680';
    ctx.fillRect(-2, my - h + 2, len, Math.max(1, h * 2 - 3));
    ctx.fillStyle = C.W;
    ctx.fillRect(-2, my - Math.max(0, h - 4), len, Math.max(1, (h - 4) * 2 + 1));
    for (let k = 0; k < 44; k++) {
      const x = Math.round(Math.random() * len);
      const s = Math.random() < 0.5 ? -1 : 1;
      ctx.fillStyle = k % 2 ? C.Y : C.W;
      ctx.fillRect(x, my + s * (h + 1 + Math.floor(Math.random() * 4)), 1 + (k % 2), 1);
    }
    disc(mx - 2, my, h + 2, C.W);
  }

  if (t >= 3.9) {
    const b = t - 3.9;
    if (!g.debris) {
      g.ix = Math.round(GW * 0.24);
      g.iy = my;
      g.debris = Array.from({ length: 110 }, () => {
        const a = Math.random() * Math.PI * 2;
        const s = 40 + Math.random() * 170;
        return {
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 40,
          sz: 1 + Math.floor(Math.random() * 3),
          c: debrisPalette[Math.floor(Math.random() * debrisPalette.length)] ?? '#FFFFFF',
        };
      });
    }
    const { ix, iy } = g;
    const R = Math.round(b * 260);
    disc(ix, iy, Math.max(0, Math.round(30 - b * 50)), C.W);
    ring(ix, iy, R, C.Y, 3);
    ring(ix, iy, Math.round(R * 0.72), C.W, 2);
    ring(ix, iy, Math.round(R * 0.45), C.R, 2);
    for (const d of g.debris) {
      ctx.fillStyle = d.c;
      ctx.fillRect(Math.round(ix + d.vx * b), Math.round(iy + d.vy * b + 140 * b * b), d.sz, d.sz);
    }
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0, 1 - b / 0.35).toFixed(3)})`;
    ctx.fillRect(0, 0, GW, GH);
  }

  const sh = t < 1.6 ? 3 : t < 2.2 ? 0 : t < 3.0 ? 2 + 5 * (t - 2.2) : t < 3.9 ? 12 : 6 * (1 - cl((t - 3.9) / 0.5));
  const dx = Math.round((Math.random() - 0.5) * sh * 2);
  const dy = Math.round((Math.random() - 0.5) * sh * 2);
  const bp = cl((t - 3.9) / 0.6);
  for (const target of targets) {
    target.style.transform = `translate(${dx}px,${dy}px)` + (bp ? ` scale(${(1 + 0.05 * bp).toFixed(3)}) rotate(${(-1.5 * bp).toFixed(2)}deg)` : '');
    target.style.filter = bp ? `blur(${(bp * 8).toFixed(1)}px)` : '';
    target.style.opacity = bp ? String((1 - bp).toFixed(3)) : '';
  }

  if (t >= 4.6) {
    ctx.clearRect(0, 0, GW, GH);
    return false;
  }
  return true;
}

function showScreen(): void {
  const screen = el<HTMLElement>('[data-crash-screen]');
  const warn = el<HTMLElement>('[data-crash-warn]');
  if (warn) warn.hidden = true;
  if (!screen) return;
  screen.hidden = false;
  document.title = CRASH_TITLE;
  el<HTMLButtonElement>('[data-crash-refresh]')?.focus({ preventScroll: true });
}

/** Play the crash. `question` is echoed back on the crash screen (not for /crash). */
export function crash(question: string): void {
  const root = el<HTMLElement>('[data-crash]');
  const canvas = el<HTMLCanvasElement>('[data-crash-canvas]');
  const warn = el<HTMLElement>('[data-crash-warn]');
  const screen = el<HTMLElement>('[data-crash-screen]');
  if (active || !root || !canvas || !warn || !screen) return;
  active = true;

  const echo = el<HTMLElement>('[data-crash-question]');
  if (echo) {
    const q = question.trim();
    echo.hidden = !q || q === '/crash';
    echo.textContent = `› ${q.length > 90 ? `${q.slice(0, 90)}…` : q}`;
  }

  // Shake and blur the page; keep focus out of it while the crash owns the screen.
  const shell = el<HTMLElement>('.shell');
  targets = shell ? [shell] : [];
  if (shell) shell.inert = true;
  void document.fonts.load("16px 'Press Start 2P'");

  root.hidden = false;
  screen.hidden = true;
  const blinkers = [...root.querySelectorAll<HTMLElement>('[data-blink]')];
  let on = true;
  // The crash only ends by leaving the page, so the blink and frame loops never need clearing.
  window.setInterval(() => {
    on = !on;
    blinkers.forEach((b) => (b.style.opacity = on ? '1' : '0.15'));
  }, 380);

  if (reducedMotion()) {
    warn.hidden = true;
    showScreen();
    return;
  }

  warn.hidden = false;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    showScreen();
    return;
  }
  g = { ctx, GW: 0, GH: 0, t0: performance.now(), debris: null, ix: 0, iy: 0 };
  const fit = (): void => {
    if (!g) return;
    const W = root.clientWidth || 1280;
    const H = root.clientHeight || 800;
    // Tall phone screens get slightly bigger pixels so the sprite still reads.
    const P = Math.max(3, Math.round(Math.min(H > W ? W * 1.3 : W, H) / 110));
    g.GW = Math.ceil(W / P);
    g.GH = Math.ceil(H / P);
    canvas.width = g.GW;
    canvas.height = g.GH;
    canvas.style.width = `${g.GW * P}px`;
    canvas.style.height = `${g.GH * P}px`;
    ctx.imageSmoothingEnabled = false;
  };
  fit();
  // On phones the crash starts as the keyboard closes, so the viewport grows after the first fit.
  window.addEventListener('resize', fit);
  const palette = debrisColours();

  const loop = (now: number): void => {
    if (!g) return;
    if (frame((now - g.t0) / 1000, warn, palette)) requestAnimationFrame(loop);
    else showScreen();
  };
  requestAnimationFrame(loop);
}

export function initCrash(): void {
  el('[data-crash-refresh]')?.addEventListener('click', restart);
  window.addEventListener('keydown', (event) => {
    const screen = el<HTMLElement>('[data-crash-screen]');
    if (!active || !screen || screen.hidden || event.key !== 'Enter') return;
    event.preventDefault();
    restart();
  });
  // Back-button restores from the bfcache would bring the crashed page back as it was: reload it clean.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && active) location.reload();
  });
}
