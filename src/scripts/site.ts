// The one script every page loads. Bundled by Astro as a module (deferred, runs once).
import { initTracking } from './analytics';
import { initClock } from './clock';
import { initComposer } from './composer';
import { initCrash } from './crash';
import { initIntro } from './intro';
import { initNavLoader } from './loader';
import { initNotesFilter } from './notes-filter';
import { initPrefs } from './prefs';
import { initShell } from './shell';

initPrefs();
initShell();
initComposer();
initCrash();
initIntro();
initNavLoader();
initClock();
initNotesFilter();
initTracking();

// PostHog loads only when a key was set at build time, after the page is idle.
const posthogKey = import.meta.env.PUBLIC_POSTHOG_KEY;
if (posthogKey) {
  const start = (): void => {
    void import('posthog-js').then(({ default: posthog }) => {
      posthog.init(posthogKey, {
        api_host: import.meta.env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        persistence: 'localStorage', // no cookies
      });
      window.posthog = posthog;
    });
  };
  // Safari has no requestIdleCallback.
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(start, { timeout: 4000 });
  else setTimeout(start, 2000);
}
