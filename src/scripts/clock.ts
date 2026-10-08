// Home greeting: "Good evening — it’s 21:04 in New Delhi", in Aayush's time zone, refreshed every 30s.
export function initClock(): void {
  const el = document.querySelector<HTMLElement>('[data-greet]');
  if (!el) return;
  const tz = el.dataset.tz ?? 'Asia/Kolkata';
  const city = el.dataset.city ?? '';

  const update = (): void => {
    const now = new Date();
    let time = '';
    let hour = now.getHours();
    try {
      time = now.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
      hour = Number(now.toLocaleString('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }));
    } catch {
      // Unknown time zone: fall back to the visitor's clock.
    }
    const greeting = hour < 5 ? 'Up late' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    el.textContent = time ? `${greeting} — it’s ${time} in ${city}` : `${greeting} from ${city}`;
  };

  update();
  window.setInterval(update, 30_000);
}
