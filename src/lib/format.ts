const WORDS_PER_MINUTE = 230;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Sep 14, 2026" */
export const formatDate = (date: Date): string =>
  `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;

/** "Sep 2" */
export const formatShort = (date: Date): string => `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;

/** "2026-09-14" for <time datetime>. */
export const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

/** "03" */
export const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Reading time in minutes from Markdown/MDX source or plain text. */
export function readingTime(source: string): number {
  const text = source
    .replace(/^(import|export)\s.*$/gm, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`[\]()|-]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
