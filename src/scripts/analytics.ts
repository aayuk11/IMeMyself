// Thin wrapper over PostHog. A no-op unless PUBLIC_POSTHOG_KEY was set at build time.

declare global {
  interface Window {
    posthog?: { capture: (event: string, properties?: Record<string, string | number | boolean>) => void };
  }
}

export function track(event: string, properties?: Record<string, string | number | boolean>): void {
  window.posthog?.capture(event, properties);
}

/** Track clicks on any element with data-track="event_name". */
export function initTracking(): void {
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-track]') : null;
    const name = target?.dataset.track;
    if (name) track(name);
  });
}
