/** Furigana markup used in content: `{漢字|かんじ}`. Everything else is plain text. */
export interface RubySeg {
  t: string;
  rt?: string;
}

const RUBY = /\{([^|{}]+)\|([^|{}]+)\}/g;

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

/** Text as read (kanji replaced by their kana reading). */
export const rubyReading = (text: string): string => text.replace(RUBY, '$2');
