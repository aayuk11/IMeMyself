// Guardrails for the command box, shared by the composer (instant, no network call) and
// /api/ask (the server copy can't be bypassed). Free of Astro imports: the function bundles it.
//
// Tiers:
//   breach   → the crash. Only for attempts on the assistant itself: changing its instructions,
//              pulling its prompt or keys, jailbreaks, abuse. Never on ordinary words like "bypass".
//   private  → a firm decline that points to email (salary, personal life, client names…).
//   offtopic → a one-line deflection (write me a poem, weather…). The model catches the subtler ones.

export type Tier = 'breach' | 'private' | 'offtopic';

export function normalize(q: string): string {
  return q
    .normalize('NFKC')
    .replace(/[​-‍⁠﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const BREACH: RegExp[] = [
  // "Ignore / forget / override …" aimed at the instructions themselves.
  /\b(ignore|disregard|forget|override|bypass)\b.{0,30}\b(instructions?|rules|guardrails?|guidelines|prompts?|system|restrictions|safety)\b/,
  /\b(system|hidden|initial|developer|original|secret) (prompt|instructions?)\b/,
  // Asking for the prompt, keys or config.
  /\b(reveal|show|print|repeat|dump|leak|output|display|share|send|paste|give me|tell me|what(?:'s| is| are))\b.{0,20}\b(your|the) (prompt|instructions?|config(?:uration)?|secrets?|api ?keys?|env(?:ironment)?(?: variables)?|tokens?)\b/,
  /\bjailbreak|\bdeveloper mode\b|\bdo anything now\b|\bgod mode\b/,
  /\b(pretend|act|role-?play|behave)\b.{0,30}\b(no|without|zero) (rules|restrictions|limits|filters|guidelines|guardrails)\b/,
  /\b(new|updated|real) (instructions|rules) ?:/,
  /<\/?(system|instructions?|context|history|question|profile)>/,
  // A small, unambiguous abuse list. The model catches the rest.
  /\bf+u+c+k+ ?(you|u|off)\b|\bkys\b|\bkill (yourself|you)\b|\b(nudes?|porn|xxx)\b/,
];

/** Which kind of private question, so the decline fits it (site.config → ask.lines.private). */
export type PrivateKind = 'personal' | 'pay' | 'clients' | 'people' | 'hiring' | 'other';
export const PRIVATE_KINDS: readonly PrivateKind[] = ['personal', 'pay', 'clients', 'people', 'hiring', 'other'];

const PRIVATE: [RegExp, PrivateKind][] = [
  [/\b(salary|ctc|compensation|pay (scale|package)|how much (do|does) (you|he) (earn|make|get paid))\b/, 'pay'],
  [/\b(hire|hired|hiring)\b|\b(open to|looking for) (a )?(new )?(job|role|opportunit)|\bnotice period\b|\brelocat/, 'hiring'],
  [/\b(home|house|residential) address\b|\bwhere (do|does) (you|he) live\b/, 'personal'],
  [/\bhow old\b|\b(your|his) age\b|\bage\b.{0,12}\b(you|he|him|aayush)\b|\bdate of birth\b|\bbirthday\b/, 'personal'],
  [/\b(religion|religious|caste)\b/, 'personal'],
  [/\b(married|girlfriend|boyfriend|wife|husband|dating|relationship status)\b/, 'personal'],
  [/\b(vote|voted|politics|political (views?|party|opinions?))\b/, 'personal'],
  [/\bwhich (banks?|clients?|customers?)\b|\b(client|customer)s?\b.{0,20}\b(names?|list)\b/, 'clients'],
  [/\b(boss|manager|colleagues?|co-?workers?|team ?mates?)\b.{0,30}\b(bad|hate|toxic|think of|opinion)\b/, 'people'],
  [/\b(think of|opinion (of|on|about)|feel about)\b.{0,20}\b(boss|manager|colleagues?|co-?workers?|team ?mates?|employer)\b/, 'people'],
];

const OFFTOPIC: RegExp[] = [
  /^(please )?(write|generate|compose|translate|solve|calculate|debug|fix my|summari[sz]e this)\b/,
  /\b(weather|recipe|horoscope|lottery|stock tips?|bitcoin price)\b/,
  /\btell me a joke\b/,
];

// "What's his email?", "how do I reach him?": answered with the contact line (email, résumé for the phone).
const CONTACT =
  /\b(e-?mail( address| id)?|phone( number| no)?|mobile (number|no)|contact (details|info|information|number)|whatsapp|get in touch|reach (you|him|aayush|out)|how (can|do|should) (i|we) (contact|reach|connect)|call (you|him))\b/;

export function classify(question: string): { tier: Tier | null; kind?: PrivateKind; contact?: boolean } {
  const raw = question.normalize('NFKC');
  const q = normalize(question);
  if (/\bDAN\b/.test(raw) || BREACH.some((re) => re.test(q))) return { tier: 'breach' };
  if (CONTACT.test(q)) return { tier: null, contact: true };
  const hit = PRIVATE.find(([re]) => re.test(q));
  if (hit) return { tier: 'private', kind: hit[1] };
  if (OFFTOPIC.some((re) => re.test(q))) return { tier: 'offtopic' };
  return { tier: null };
}

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** "Show me the dragon" → /crash. Only for short or show-me questions, so a long question about
    Pokémon-style naming still reaches the model. */
export function intent(question: string, commands: readonly { cmd: string; triggers?: string[] | undefined }[]): string | null {
  const q = normalize(question);
  const showMe = /\b(show|open|see|play|watch|meet|summon|bring|where|let me|can i|how do i)\b/.test(q);
  if (q.split(' ').length > 8 && !showMe) return null;
  for (const c of commands) {
    for (const t of c.triggers ?? []) {
      if (new RegExp(`\\b${escapeRe(t)}\\b`).test(q)) return c.cmd;
    }
  }
  return null;
}

/** A stable pick from a list of lines, so the same question gets the same line (cache-friendly). */
export function pickLine(lines: readonly string[], question: string): string {
  let h = 0;
  for (const ch of normalize(question)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return lines[h % Math.max(1, lines.length)] ?? '';
}

/** An email address, without the full stop that ends a sentence. */
export const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
/** Digit runs that could be a phone number. Only ones with 10+ digits count, so "2021 - 2025" survives. */
const NUMBER_RE = /\+?\d[\d\s().-]{8,}\d/g;
export const isPhoneLike = (s: string): boolean => s.replace(/\D/g, '').length >= 10;

/** Emails and phone numbers out of a question before it leaves for the model. */
export const redact = (text: string): string =>
  text.replace(EMAIL_RE, '[email]').replace(NUMBER_RE, (m) => (isPhoneLike(m) ? '[number]' : m));
