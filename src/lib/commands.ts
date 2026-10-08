// Slash commands for the composer. Pages and Settings show in the menu; Play (easter eggs)
// only appears once the visitor types "/".

export type CommandGroup = 'Pages' | 'Settings' | 'Play';

export interface Command {
  group: CommandGroup;
  cmd: string;
  label: string;
  /** Right-hand hint; data-hint lets the script update it (current palette, type). */
  hint: string;
  aliases?: string[];
}

export const GROUPS: readonly CommandGroup[] = ['Pages', 'Settings', 'Play'];

export const ALIASES: Readonly<Record<string, string>> = {
  '/work': '/experience',
  '/cases': '/experience',
  '/writing': '/notes',
  '/write': '/notes',
  '/learn': '/notes',
  '/learnings': '/notes',
  '/blog': '/notes',
  '/batman': '/gotham',
};

export function buildCommands(meta: { projects: number; notes: number; notesName: string }): Command[] {
  return [
    { group: 'Pages', cmd: '/home', label: 'Home', hint: '' },
    { group: 'Pages', cmd: '/experience', label: 'Experience & case studies', hint: `${meta.projects} cases`, aliases: ['/work', '/cases'] },
    {
      group: 'Pages',
      cmd: '/notes',
      label: `${meta.notesName} — learn, build, write`,
      hint: `${meta.notes} entries`,
      aliases: ['/writing', '/write', '/learn', '/learnings', '/blog'],
    },
    { group: 'Pages', cmd: '/lab', label: 'Side projects & tools', hint: '' },
    { group: 'Pages', cmd: '/resume', label: 'Résumé with PDF download', hint: 'new tab ↗' },
    { group: 'Settings', cmd: '/theme', label: 'Switch light / dark', hint: '' },
    { group: 'Settings', cmd: '/palette', label: 'Next colour palette', hint: '' },
    { group: 'Settings', cmd: '/type', label: 'Next font pairing', hint: '' },
    { group: 'Settings', cmd: '/focus', label: 'Reading focus (hide sidebar)', hint: '' },
    { group: 'Settings', cmd: '/intro', label: 'Replay the PRD intro', hint: '' },
    { group: 'Play', cmd: '/pokedex', label: 'Open my Pokédex entry', hint: '' },
    { group: 'Play', cmd: '/gear5', label: 'Gear 5', hint: '' },
    { group: 'Play', cmd: '/gotham', label: 'Gotham mode', hint: '', aliases: ['/batman'] },
    { group: 'Play', cmd: '/snap', label: 'Perfectly balanced', hint: '' },
  ];
}

/** Commands visible for the current input. Play only shows once "/" is typed. */
export function matchCommands(list: readonly Command[], value: string): Command[] {
  const v = value.trim().toLowerCase();
  const typed = v.startsWith('/');
  const q = typed ? (v.split(/\s+/)[0] ?? '') : '';
  return list.filter(
    (c) => (typed || c.group !== 'Play') && (!q || c.cmd.startsWith(q) || (c.aliases ?? []).some((a) => a.startsWith(q))),
  );
}

/** Page commands and where they go. */
export const PAGE_ROUTES: Readonly<Record<string, string>> = {
  '/home': '/',
  '/experience': '/experience/',
  '/notes': '/notes/',
  '/lab': '/lab/',
};
