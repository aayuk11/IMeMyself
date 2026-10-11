// Keyword routing: the reply when AI answers are off or unavailable, with chips to the right pages.
// Guardrails (what crashes, what's declined) live in src/lib/guard.ts.

export interface RouteReply {
  text: string;
  routes: string[];
  /** false when no rule matched and the reply is the generic "best places to start". */
  matched: boolean;
}

export function routeReply(question: string, notesName: string, email: string): RouteReply {
  const rules: [RegExp, string[], string][] = [
    [/resume|cv|hir|recruit|open to|available|role/i, ['/resume', '/experience'], 'The résumé opens in a new tab with a one-click PDF download, and /experience has the detail.'],
    [
      /work|project|case|ship|built|transact|privacy|panda|profile|metric|result|experience|job|career|zigram|skill/i,
      ['/experience'],
      'Experience lists every product; each one opens a full case study. Transact Comply is the one with the numbers.',
    ],
    [/writ|article|essay|blog|read|medium|post|learn|lesson|note/i, ['/notes'], `${notesName} has the essays, short lessons and build logs in one feed.`],
    [/side|weekend|lab|dpdp|tool|hobby|fun/i, ['/lab'], 'Weekend builds and the tools in rotation are under /lab.'],
    [/contact|email|reach|talk|call|connect/i, ['/resume'], `Email is fastest: ${email}.`],
  ];
  const hit = rules.find(([re]) => re.test(question));
  return hit
    ? { text: hit[2], routes: hit[1], matched: true }
    : { text: 'These are the best places to start.', routes: ['/experience', '/notes', '/lab'], matched: false };
}
