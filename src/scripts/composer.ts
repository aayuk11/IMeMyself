// Composer: slash commands, the conversation view, and the hidden easter eggs.
import { isBlocked, routeReply } from '../lib/chat';
import { ALIASES, PAGE_ROUTES } from '../lib/commands';
import { track } from './analytics';
import { crash, isCrashActive } from './crash';
import { playIntro } from './intro';
import { animateLoader } from './loader';
import { nextPalette, nextType, paletteLabel, setGotham, toggleMode, typeLabel } from './prefs';
import { closeDrawer, drawerOpen, toggleFocus } from './shell';

const TOAST_MS = 3400;
const ASK_TIMEOUT_MS = 25_000;
const MAX_QUESTION = 300;
const CHAT_KEY = 'ak-chat';
const FOCUS_KEY = 'ak-focus-composer';

interface Message {
  role: 'user' | 'bot';
  text: string;
  routes?: string[];
  ai?: boolean;
  pending?: boolean;
}

const reducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;
const normalizePath = (p: string): string => (p.endsWith('/') ? p : `${p}/`);

function need<T extends Element>(scope: ParentNode, selector: string): T {
  const el = scope.querySelector<T>(selector);
  if (!el) throw new Error(`composer: missing ${selector}`);
  return el;
}

// ---------- toast ----------

let toastTimer: number | undefined;
export function toast(message: string): void {
  const el = document.querySelector<HTMLElement>('[data-toast]');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (el.hidden = true), TOAST_MS);
}

export function initComposer(): void {
  const wrap = document.querySelector<HTMLElement>('[data-composer]');
  if (!wrap) return;

  const form = need<HTMLFormElement>(wrap, '[data-composer-form]');
  const input = need<HTMLInputElement>(wrap, '[data-composer-input]');
  const menu = need<HTMLElement>(wrap, '[data-cmd-menu]');
  const send = need<HTMLButtonElement>(wrap, '[data-send]');
  const showAll = need<HTMLButtonElement>(wrap, '[data-show-commands]');
  const options = [...menu.querySelectorAll<HTMLElement>('[data-cmd]')];
  const groups = [...menu.querySelectorAll<HTMLElement>('[data-cmd-group]')];

  const page = document.querySelector<HTMLElement>('[data-page]');
  const chat = document.querySelector<HTMLElement>('[data-chat]');
  const log = document.querySelector<HTMLElement>('[data-chat-log]');
  const crumb = document.querySelector<HTMLElement>('[data-crumb]');

  const askEnabled = wrap.dataset.ask === 'true';
  const email = wrap.dataset.email ?? '';
  const notesName = wrap.dataset.notesName ?? 'Notes';

  let focused = false;
  let menuAll = false;
  let selected = 0;
  let visible: HTMLElement[] = [];

  // ---------- placeholder ----------

  const wide = matchMedia('(min-width: 640px)');
  const syncPlaceholder = (): void => {
    input.placeholder = (wide.matches ? wrap.dataset.placeholder : wrap.dataset.placeholderShort) ?? '';
  };
  wide.addEventListener('change', syncPlaceholder);
  syncPlaceholder();

  // ---------- menu ----------

  function filter(value: string): HTMLElement[] {
    const v = value.trim().toLowerCase();
    const typed = v.startsWith('/');
    const q = typed ? (v.split(/\s+/)[0] ?? '') : '';
    return options.filter((o) => {
      if (!typed && o.dataset.group === 'Play') return false;
      if (!q) return true;
      const aliases = (o.dataset.aliases ?? '').split(' ').filter(Boolean);
      return (o.dataset.cmd ?? '').startsWith(q) || aliases.some((a) => a.startsWith(q));
    });
  }

  const menuOpen = (): boolean => {
    const v = input.value.trim();
    return focused && ((menuAll && !v) || v.startsWith('/')) && visible.length > 0;
  };

  function render(): void {
    visible = filter(input.value);
    if (selected >= visible.length) selected = 0;
    const open = menuOpen();
    for (const o of options) o.hidden = !visible.includes(o);
    for (const g of groups) g.hidden = !g.querySelector('[data-cmd]:not([hidden])');
    visible.forEach((o, i) => o.setAttribute('aria-selected', String(open && i === selected)));
    menu.hidden = !open;
    input.setAttribute('aria-expanded', String(open));
    const active = open ? visible[selected] : undefined;
    if (active) {
      input.setAttribute('aria-activedescendant', active.id);
      active.scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
    send.toggleAttribute('data-ready', input.value.trim().length > 0);
  }

  function clearInput(): void {
    input.value = '';
    selected = 0;
    menuAll = false;
    render();
  }

  // ---------- conversation ----------

  const pageNav = document.querySelector<HTMLElement>('[data-nav][aria-current="page"]');
  const pageCrumb = crumb?.dataset.crumbPage ?? '';
  const chatOpen = (): boolean => Boolean(chat && !chat.hidden);

  function loadMessages(): Message[] {
    try {
      return (JSON.parse(sessionStorage.getItem(CHAT_KEY) ?? '[]') as Message[]).filter((m) => !m.pending);
    } catch {
      return [];
    }
  }
  let messages = loadMessages();
  function saveMessages(): void {
    try {
      sessionStorage.setItem(CHAT_KEY, JSON.stringify(messages.filter((m) => !m.pending)));
    } catch {
      // Storage blocked: the conversation lasts for this page only.
    }
  }

  const ROUTE_LABELS: Record<string, string> = { '/experience': 'Experience', '/notes': notesName, '/lab': 'Lab', '/resume': 'Résumé ↗' };
  const ROUTE_HREFS: Record<string, string> = { '/experience': '/experience/', '/notes': '/notes/', '/lab': '/lab/', '/resume': '/resume/' };

  let stopLoaders: (() => void)[] = [];

  function renderLog(): void {
    if (!log) return;
    const userTpl = document.getElementById('tpl-chat-user') as HTMLTemplateElement | null;
    const botTpl = document.getElementById('tpl-chat-bot') as HTMLTemplateElement | null;
    const chipTpl = document.getElementById('tpl-chat-chip') as HTMLTemplateElement | null;
    if (!userTpl || !botTpl || !chipTpl) return;
    stopLoaders.forEach((stop) => stop());
    stopLoaders = [];
    log.replaceChildren();
    for (const m of messages) {
      const node = (m.role === 'user' ? userTpl : botTpl).content.cloneNode(true) as DocumentFragment;
      const text = node.querySelector<HTMLElement>('[data-text]');
      if (text) text.textContent = m.text;
      // A reply still on its way shows the compact Sisyphus loader instead of text.
      const pendingBox = node.querySelector<HTMLElement>('[data-pending]');
      if (pendingBox && m.pending) {
        pendingBox.hidden = false;
        if (text) text.hidden = true;
        const loader = pendingBox.querySelector('[data-loader]');
        if (loader) stopLoaders.push(animateLoader(loader));
      }
      const chips = node.querySelector<HTMLElement>('[data-chips]');
      for (const r of m.routes ?? []) {
        const chip = chipTpl.content.cloneNode(true) as DocumentFragment;
        const a = chip.querySelector('a');
        const [cmd, label] = [...(a?.querySelectorAll('span') ?? [])];
        if (!a || !cmd || !label) continue;
        a.href = ROUTE_HREFS[r] ?? '/';
        if (r === '/resume') {
          a.target = '_blank';
          a.rel = 'noopener';
        }
        cmd.textContent = r;
        label.textContent = ROUTE_LABELS[r] ?? '';
        chips?.append(chip);
      }
      const foot = node.querySelector<HTMLElement>('[data-footnote]');
      if (foot) foot.hidden = !m.ai;
      log.append(node);
    }
  }

  function setChatView(open: boolean): void {
    if (!page || !chat) return;
    page.hidden = open;
    chat.hidden = !open;
    if (crumb) crumb.textContent = open ? '~/conversation' : pageCrumb;
    document.querySelectorAll<HTMLElement>('[data-nav]').forEach((n) => n.removeAttribute('aria-current'));
    const nav = open ? document.querySelector<HTMLElement>('[data-nav="home"]') : pageNav;
    nav?.setAttribute('aria-current', 'page');
  }

  function openChat(push: boolean): void {
    if (chatOpen()) return;
    setChatView(true);
    if (push) history.pushState({ chat: true }, '', '#conversation');
  }

  function closeChat(): void {
    if (!chatOpen()) return;
    setChatView(false);
    if (location.hash === '#conversation') history.replaceState(null, '', location.pathname + location.search);
  }

  const toEnd = (): void => {
    requestAnimationFrame(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' }));
  };

  async function answer(question: string): Promise<{ text: string; ai: boolean }> {
    const reply = routeReply(question, notesName, email);
    if (!askEnabled) {
      await new Promise((r) => setTimeout(r, 600));
      return {
        text: reply.matched
          ? `AI answers are coming soon. Until then: ${reply.text}`
          : 'AI answers are coming soon. Until then, these are the best places to start.',
        ai: false,
      };
    }
    const key = question.toLowerCase().replace(/\s+/g, ' ').trim();
    try {
      const res = await fetch(`/api/ask?q=${encodeURIComponent(key)}`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(ASK_TIMEOUT_MS),
      });
      if (res.status === 429) return { text: `That’s a lot of questions at once. Try again in a minute, or email ${email}.`, ai: false };
      const data = (await res.json().catch(() => null)) as { answer?: string; error?: string } | null;
      if (res.ok && data?.answer) return { text: data.answer, ai: true };
      return { text: data?.error ?? `Couldn’t reach the model just now. Email ${email} instead.`, ai: false };
    } catch {
      return { text: `Couldn’t reach the model just now. Email ${email} instead.`, ai: false };
    }
  }

  async function ask(raw: string): Promise<void> {
    const question = raw.trim().slice(0, MAX_QUESTION);
    if (!question) return;
    clearInput();
    closeDrawer(false);
    // A blocked question never reaches the chat: it trips the guardrails and plays the crash.
    if (isBlocked(raw)) {
      input.blur();
      track('question_blocked');
      crash(raw.trim());
      return;
    }
    openChat(true);
    const routes = routeReply(question, notesName, email).routes;
    const pending: Message = { role: 'bot', text: '…', routes: [], pending: true };
    messages.push({ role: 'user', text: question }, pending);
    renderLog();
    toEnd();
    track('question_asked', { ai: askEnabled });
    const { text, ai } = await answer(question);
    Object.assign(pending, { text, routes, ai, pending: false });
    saveMessages();
    renderLog();
    toEnd();
  }

  function newConversation(): void {
    // Phone: get the drawer out of the way so the page and composer are visible.
    closeDrawer(false);
    messages = [];
    saveMessages();
    renderLog();
    if (normalizePath(location.pathname) === '/') {
      closeChat();
      window.scrollTo({ top: 0 });
      input.focus();
    } else {
      try {
        sessionStorage.setItem(FOCUS_KEY, '1');
      } catch {
        // Fine: the composer just won't be focused on arrival.
      }
      location.assign('/');
    }
  }

  // ---------- easter eggs ----------

  function gear5(): void {
    toast('Gear 5. Everything’s rubber for a second.');
    const target = chatOpen() ? chat : page;
    if (!target || reducedMotion()) return;
    const originY = window.scrollY + window.innerHeight * 0.35 - (target.getBoundingClientRect().top + window.scrollY);
    target.style.transformOrigin = `50% ${Math.max(0, originY)}px`;
    target.animate(
      [
        { transform: 'scale(1, 1)' },
        { transform: 'scale(1.05, 0.9)' },
        { transform: 'scale(0.93, 1.08)' },
        { transform: 'scale(1.03, 0.96)' },
        { transform: 'scale(0.99, 1.01)' },
        { transform: 'scale(1, 1)' },
      ],
      { duration: 1100, easing: 'ease-in-out' },
    );
  }

  let snapping = false;
  function snap(): void {
    toast('Perfectly balanced. Restoring…');
    const scope = chatOpen() ? chat : page;
    if (snapping || !scope) return;
    let nodes = [...scope.querySelectorAll<HTMLElement>('[data-snap]')];
    if (!nodes.length) nodes = [...scope.querySelectorAll<HTMLElement>('h1, p, a, button')];
    const onScreen = nodes.filter((n) => {
      const r = n.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    });
    if (onScreen.length >= 2) nodes = onScreen;
    nodes = nodes.filter((_, i) => i % 2 === 0);
    if (!nodes.length) return;
    snapping = true;
    if (reducedMotion()) {
      nodes.forEach((n) => (n.style.visibility = 'hidden'));
      window.setTimeout(() => {
        nodes.forEach((n) => (n.style.visibility = ''));
        snapping = false;
      }, 2400);
      return;
    }
    const animations = nodes.map((n, i) =>
      n.animate(
        [
          { opacity: 1, filter: 'blur(0px)', transform: 'translate(0, 0)' },
          { opacity: 0, filter: 'blur(10px)', transform: 'translate(36px, -18px)' },
        ],
        { duration: 1300, delay: i * 110, easing: 'ease-in', fill: 'forwards' },
      ),
    );
    const total = 1300 + nodes.length * 110;
    window.setTimeout(() => animations.forEach((a) => a.reverse()), total + 1400);
    window.setTimeout(() => {
      animations.forEach((a) => a.cancel());
      snapping = false;
    }, total * 2 + 1700);
  }

  function openPokedex(): void {
    const dialog = document.getElementById('pokedex');
    if (dialog instanceof HTMLDialogElement && !dialog.open) dialog.showModal();
  }

  // ---------- commands ----------

  function run(raw: string): void {
    let cmd = (raw.trim().toLowerCase().split(/\s+/)[0] ?? '').trim();
    cmd = ALIASES[cmd] ?? cmd;
    clearInput();
    track('command_run', { command: cmd });

    const route = PAGE_ROUTES[cmd];
    if (route) {
      input.blur();
      if (normalizePath(location.pathname) === route) {
        closeChat();
        window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
      } else {
        location.assign(route);
      }
      return;
    }

    switch (cmd) {
      case '/resume': {
        input.blur();
        const tab = window.open('/resume/', '_blank', 'noopener');
        if (!tab) location.assign('/resume/');
        return;
      }
      case '/theme':
        return toggleMode();
      case '/palette':
        return toast(`Palette: ${paletteLabel(nextPalette())}`);
      case '/type':
        return toast(`Type: ${typeLabel(nextType())}`);
      case '/focus':
        if (!toggleFocus()) toast('Focus mode works on essays and case studies.');
        return;
      case '/intro':
        input.blur();
        if (!playIntro()) toast('The intro is off while reduced motion is on.');
        return;
      case '/help':
        return toast('Type / to see everything this box can do.');
      case '/gotham':
        setGotham(true);
        return toast('Gotham mode. /theme brings back daylight.');
      case '/gear5':
        return gear5();
      case '/snap':
        return snap();
      case '/pokedex':
        input.blur();
        return openPokedex();
      case '/crash':
        input.blur();
        return crash('/crash');
      default:
        toast(`No command “${cmd}”. Type / to see them all.`);
    }
  }

  function submit(): void {
    const v = input.value.trim();
    const pick = visible[Math.min(selected, visible.length - 1)];
    if (menuOpen() && (!v || v === '/') && pick?.dataset.cmd) return run(pick.dataset.cmd);
    if (!v) return;
    if (v.startsWith('/')) {
      const word = v.toLowerCase().split(/\s+/)[0] ?? v;
      const exact = ALIASES[word] || visible.some((o) => o.dataset.cmd === word) || !visible.length;
      return run(exact || !pick?.dataset.cmd ? word : pick.dataset.cmd);
    }
    void ask(v);
  }

  // ---------- events ----------

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submit();
  });

  input.addEventListener('input', () => {
    selected = 0;
    if (input.value) menuAll = false;
    render();
  });

  input.addEventListener('keydown', (event) => {
    if (event.isComposing) return;
    const open = menuOpen();
    if (event.key === 'ArrowDown' && open) {
      event.preventDefault();
      selected = (selected + 1) % visible.length;
      render();
    } else if (event.key === 'ArrowUp' && open) {
      event.preventDefault();
      selected = (selected - 1 + visible.length) % visible.length;
      render();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      clearInput();
      input.blur();
    }
  });

  wrap.addEventListener('focusin', () => {
    focused = true;
    render();
  });
  wrap.addEventListener('focusout', (event) => {
    if (event.relatedTarget instanceof Node && wrap.contains(event.relatedTarget)) return;
    focused = false;
    menuAll = false;
    render();
  });

  for (const o of options) {
    o.addEventListener('mousedown', (event) => event.preventDefault());
    o.addEventListener('click', () => {
      if (o.dataset.cmd) run(o.dataset.cmd);
    });
  }

  showAll.addEventListener('mousedown', (event) => event.preventDefault());
  showAll.addEventListener('click', () => {
    input.value = '';
    menuAll = !menuAll;
    selected = 0;
    input.focus();
    render();
  });

  document.querySelectorAll('[data-new-chat]').forEach((b) => b.addEventListener('click', newConversation));
  document.querySelectorAll<HTMLElement>('[data-focus-composer]').forEach((b) =>
    b.addEventListener('click', (event) => {
      event.preventDefault();
      input.focus();
      input.value = '/';
      render();
    }),
  );

  document.addEventListener('keydown', (event) => {
    if (isCrashActive()) return; // the crash owns the keyboard until Refresh
    if (event.key === 'Escape' && drawerOpen()) {
      closeDrawer();
      return;
    }
    const target = event.target;
    const typing = target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [contenteditable]'));
    if (typing || event.defaultPrevented || document.querySelector('dialog[open]')) return;
    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      input.focus();
      input.value = '/';
      render();
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      input.focus();
      input.value = '';
      menuAll = true;
      render();
    }
  });

  window.addEventListener('popstate', (event) => {
    const state = event.state as { chat?: boolean } | null;
    if (state?.chat) setChatView(true);
    else setChatView(false);
  });

  // Pokédex: close on backdrop click (the dialog box itself fills its content).
  const dialog = document.getElementById('pokedex');
  if (dialog instanceof HTMLDialogElement) {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  // Restore the conversation after a reload, and focus after "New conversation" elsewhere.
  renderLog();
  if (location.hash === '#conversation' && messages.length) {
    history.replaceState({ chat: true }, '');
    setChatView(true);
  }
  try {
    if (sessionStorage.getItem(FOCUS_KEY)) {
      sessionStorage.removeItem(FOCUS_KEY);
      input.focus();
    }
  } catch {
    // Ignore.
  }

  render();
}
