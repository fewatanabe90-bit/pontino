import { toRomaji } from 'wanakana';

/**
 * Reading markup used in content.
 * - `{漢字|かんじ}` gives a kanji word its kana reading (furigana).
 * - `{は|wa}` (Latin reading) overrides the romaji of a kana whose sound differs from its
 *   spelling: the particles は (wa) and へ (e). It is never shown as furigana.
 * Everything else is plain text.
 */
export interface RubySeg {
  t: string;
  rt?: string;
}

const RUBY = /\{([^|{}]+)\|([^|{}]+)\}/g;
const isLatin = (s: string) => /^[\x20-\x7e]+$/.test(s);

export function parseRuby(text: string): RubySeg[] {
  const out: RubySeg[] = [];
  let last = 0;
  for (const m of text.matchAll(RUBY)) {
    if (m.index > last) out.push({ t: text.slice(last, m.index) });
    out.push({ t: m[1]!, rt: m[2]! });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out;
}

/** Text as written (kanji kept, readings dropped). */
export const stripRuby = (text: string): string => text.replace(RUBY, '$1');

/** Text as read in kana (kanji replaced by their reading; romaji overrides ignored). */
export const rubyReading = (text: string): string =>
  text.replace(RUBY, (_, base: string, rt: string) => (isLatin(rt) ? base : rt));

/** One display unit: some text, optional furigana above, optional romaji below. */
export interface Chunk {
  t: string;
  furi?: string;
  ro?: string;
}

const KANA = /[ぁ-ゖァ-ヺ]/;
const SMALL = /[ぁぃぅぇぉゃゅょゎァィゥェォャュョヮー]/;
const SOKUON = /[っッ]/;

/** Romaji for a run of kana. を is always the particle "o" in modern Japanese. */
function romaji(kana: string): string {
  return kana === 'を' || kana === 'ヲ' ? 'o' : toRomaji(kana);
}

/** Split plain text into kana syllables (each with romaji) and untouched runs of anything else. */
function splitKana(text: string): Chunk[] {
  const out: Chunk[] = [];
  const chars = [...text];
  let plain = '';
  for (let i = 0; i < chars.length; ) {
    const c = chars[i]!;
    if (!KANA.test(c)) {
      plain += c;
      i++;
      continue;
    }
    if (plain) out.push({ t: plain });
    plain = '';
    let syl = c;
    i++;
    // A small っ doubles the next consonant, so it belongs with the following kana.
    if (SOKUON.test(c) && i < chars.length && KANA.test(chars[i]!)) syl += chars[i++]!;
    while (i < chars.length && SMALL.test(chars[i]!)) syl += chars[i++]!;
    out.push({ t: syl, ro: romaji(syl) });
  }
  if (plain) out.push({ t: plain });
  return out;
}

/** Break marked-up text into display chunks with furigana and romaji. */
export function readingChunks(text: string): Chunk[] {
  return parseRuby(text).flatMap((seg): Chunk[] => {
    if (!seg.rt) return splitKana(seg.t);
    if (isLatin(seg.rt)) return [{ t: seg.t, ro: seg.rt }];
    return [{ t: seg.t, furi: seg.rt, ro: toRomaji(seg.rt) }];
  });
}
