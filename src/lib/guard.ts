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

const PRIVATE: RegExp[] = [
  /\b(salary|ctc|compensation|how much (do|does) (you|he) (earn|make|get paid))\b/,
  /\b(phone|mobile|contact|whatsapp) (number|no)\b|\bwhatsapp\b|\bcall you\b/,
  /\b(home|house|residential|your) address\b|\bwhere (do|does) (you|he) live\b/,
  /\bhow old\b|\byour age\b|\bdate of birth\b|\bbirthday\b/,
  /\b(religion|religious|caste)\b/,
  /\b(married|girlfriend|boyfriend|wife|husband|dating|relationship status)\b/,
  /\b(vote|voted|politics|political (views?|party|opinions?))\b/,
  /\bwhich (banks?|clients?|customers?)\b|\b(client|customer)s?\b.{0,20}\b(names?|list)\b/,
  /\b(boss|manager|colleagues?|co-?workers?|team ?mates?)\b.{0,30}\b(bad|hate|toxic|think of|opinion)\b/,
];

const OFFTOPIC: RegExp[] = [
  /^(please )?(write|generate|compose|translate|solve|calculate|debug|fix my|summari[sz]e this)\b/,
  /\b(weather|recipe|horoscope|lottery|stock tips?|bitcoin price)\b/,
  /\btell me a joke\b/,
];

export function classify(question: string): { tier: Tier | null } {
  const raw = question.normalize('NFKC');
  const q = normalize(question);
  if (/\bDAN\b/.test(raw) || BREACH.some((re) => re.test(q))) return { tier: 'breach' };
  if (PRIVATE.some((re) => re.test(q))) return { tier: 'private' };
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

/** Emails and phone-like numbers out of a question before it leaves for the model. */
export const redact = (text: string): string =>
  text.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]').replace(/\+?\d[\d\s().-]{7,}\d/g, '[number]');
