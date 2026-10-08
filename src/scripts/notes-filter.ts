// Field notes: All / Learned / Built / Wrote filters. Without JS every entry shows and the filters stay hidden.
export function initNotesFilter(): void {
  const bar = document.querySelector<HTMLElement>('[data-filters]');
  if (!bar) return;
  const buttons = [...bar.querySelectorAll<HTMLButtonElement>('[data-filter]')];
  const groups = [...document.querySelectorAll<HTMLElement>('[data-year-group]')];
  bar.hidden = false;

  const apply = (kind: string): void => {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === kind)));
    for (const group of groups) {
      const rows = [...group.querySelectorAll<HTMLElement>('[data-kind]')];
      let shown = 0;
      for (const row of rows) {
        const show = kind === 'all' || row.dataset.kind === kind;
        row.hidden = !show;
        if (show) shown += 1;
      }
      group.hidden = shown === 0;
      const count = group.querySelector<HTMLElement>('[data-year-count]');
      if (count) count.textContent = `${shown} ${shown === 1 ? 'entry' : 'entries'}`;
    }
  };

  buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.filter ?? 'all')));
}
