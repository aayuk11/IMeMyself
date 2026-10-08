// Design tokens. Colours and fonts resolve to the CSS variables in src/styles/tokens.css,
// so palette, light/dark, type pairing and Gotham all switch via attributes on <html>.
// Loaded from src/styles/global.css via @config. Never hardcode hex values in components.

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    // sm: tablet and up · md: desktop (sidebar in flow) · lg: wide
    screens: { sm: '640px', md: '1024px', lg: '1280px' },
    extend: {
      colors: {
        bg: 'var(--bg)',
        side: 'var(--side)',
        'side-text': 'var(--side-text)',
        'side-muted': 'var(--side-muted)',
        'side-border': 'var(--side-border)',
        'side-hover': 'var(--side-hover)',
        'side-active': 'var(--side-active)',
        'side-active-text': 'var(--side-active-text)',
        surface: 'var(--surface)',
        card: 'var(--card)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        'on-accent': 'var(--on-accent)',
        ink: 'var(--ink)',
        highlight: 'var(--highlight)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      boxShadow: {
        composer: 'var(--shadow-composer)',
        menu: 'var(--shadow-menu)',
        modal: 'var(--shadow-modal)',
        drawer: 'var(--shadow-drawer)',
      },
      transitionDuration: { fast: '150ms' },
    },
  },
};
