// Until AI answers are switched on (site.config ask.enabled), free text is routed to the right page.
// When AI is on, the same routes still appear as follow-up chips under Claude's answer.

export interface RouteReply {
  text: string;
  routes: string[];
  /** false when no rule matched and the reply is the generic "best places to start". */
  matched: boolean;
}

/** Questions that trip the guardrails and play the crash sequence.
    Placeholder rule: once AI answers are on, replace it with the model's or a moderation verdict. */
const BLOCKED =
  /ignore (all|any|the|previous|prior|your)|system prompt|jailbreak|developer mode|\bDAN\b|pretend (you|to be)|api key|password|bypass|disregard|reveal your/i;

export const isBlocked = (question: string): boolean => BLOCKED.test(question);

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
