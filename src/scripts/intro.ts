// PRD-tear intro timeline: hold → tension → tear → done.
// Auto-plays once per session on Home, after the first-load loader is gone; /intro replays it anywhere.
import { bootDone } from './loader';

const HOLD_MS = 700;
const TENSION_MS = 230;
const TEAR_MS = 1500;

const root = document.documentElement;
let timers: number[] = [];
let cleanup: (() => void) | null = null;

const reducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

function run(overlay: HTMLElement, replay: boolean): void {
  cleanup?.();
  timers.forEach((t) => window.clearTimeout(t));
  timers = [];

  const setPhase = (phase: 'idle' | 'tension' | 'out' | 'done'): void => {
    overlay.dataset.phase = phase;
  };
  const finish = (): void => {
    cleanup?.();
    setPhase('done');
    root.dataset.intro = 'done';
  };
  const skip = (event: Event): void => {
    // Let the global shortcuts see the key press too; just end the intro.
    if (event.type === 'keydown' && (event as KeyboardEvent).key === 'Tab') return;
    finish();
  };

  if (replay) {
    setPhase('idle');
    root.dataset.intro = 'play';
    // Flush styles so the reset to the idle state applies before the timeline starts.
    void overlay.offsetWidth;
  }

  timers.push(
    window.setTimeout(() => setPhase('tension'), HOLD_MS),
    window.setTimeout(() => setPhase('out'), HOLD_MS + TENSION_MS),
    window.setTimeout(finish, HOLD_MS + TENSION_MS + TEAR_MS),
  );

  overlay.addEventListener('click', skip);
  window.addEventListener('keydown', skip);
  cleanup = () => {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
    overlay.removeEventListener('click', skip);
    window.removeEventListener('keydown', skip);
    cleanup = null;
  };
}

/** Replay on demand (/intro). Returns false when motion is reduced. */
export function playIntro(): boolean {
  const overlay = document.querySelector<HTMLElement>('.prd-intro');
  if (!overlay || reducedMotion()) return false;
  run(overlay, true);
  return true;
}

/** First visit this session on Home: the head script already set data-intro="play".
    The sheet sits under the loader until it hides, then the timeline starts. */
export function initIntro(): void {
  const overlay = document.querySelector<HTMLElement>('.prd-intro');
  if (!overlay || root.dataset.intro !== 'play') return;
  try {
    sessionStorage.setItem('introSeen', '1');
  } catch {
    // Storage blocked: the intro may replay next visit, which is harmless.
  }
  void bootDone.then(() => run(overlay, false));
}
