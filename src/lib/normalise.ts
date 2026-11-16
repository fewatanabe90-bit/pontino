import { stripRuby } from './ruby';

export type Lang = 'ja' | 'it';

const JA_PUNCT = /[\s　。、．，・「」『』（）()!?！？.,…〜~ー－-]/g;

/**
 * Japanese: width-normalise (full-width Latin/digits, half-width kana), drop spaces and
 * punctuation, and fold katakana into hiragana so レオ / れお compare equal.
 * The long-vowel mark is dropped with the punctuation on both sides of a comparison.
 */
export function normaliseJa(input: string): string {
  const s = stripRuby(input).normalize('NFKC').replace(JA_PUNCT, '');
  let out = '';
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    out += c >= 0x30a1 && c <= 0x30f6 ? String.fromCodePoint(c - 0x60) : ch;
  }
  return out.toLowerCase();
}

const ACCENTED: Record<string, string> = { a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù' };

/** Italian: lowercase, straighten apostrophes, collapse spaces, drop sentence punctuation. */
export function normaliseIt(input: string): string {
  return input
    .normalize('NFC')
    .toLowerCase()
    .replace(/[‘’`´]/g, "'")
    .replace(/[.!?,;:"«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** `e'` typed for `è`: a vowel + apostrophe at a word end becomes the accented vowel. */
export function apostropheToAccent(s: string): string {
  return s.replace(/([aeiou])'(?=\s|$)/g, (_, v: string) => ACCENTED[v]!);
}

/** Remove accents entirely; é and è both become e. */
export function foldAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
}

export const normalise = (input: string, lang: Lang): string =>
  lang === 'ja' ? normaliseJa(input) : normaliseIt(input);
