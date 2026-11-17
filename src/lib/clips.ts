/**
 * Recorded voice clips: which voice says what, and the file name each line is stored under.
 * Used by the app (to find a clip), by scripts/voice-jobs.mjs (to list what must be generated)
 * and by the tests (to check nothing is missing). Keep it free of runtime imports so Node can load it directly.
 */
import type { Deck, Exercise, Unit } from './schema';

export type ClipLang = 'ja' | 'it';

/** Kokoro voice per language: a default narrator and one per recurring character. */
export const VOICES: Record<ClipLang, { narrator: string; cast: Record<string, string> }> = {
  ja: { narrator: 'jf_alpha', cast: { 中村: 'jf_alpha', 佐藤: 'jf_tebukuro', レオ: 'jm_kumo', 店員: 'jf_tebukuro', 駅員: 'jf_alpha', 係員: 'jf_alpha', フロント: 'jf_alpha' } },
  it: { narrator: 'if_sara', cast: { Giulia: 'if_sara', Sara: 'if_sara', Marco: 'im_nicola', Leo: 'im_nicola', Cameriere: 'im_nicola', Venditore: 'im_nicola', Impiegata: 'if_sara' } },
};

export const voiceFor = (lang: ClipLang, who?: string): string => (who && VOICES[lang].cast[who]) || VOICES[lang].narrator;

/** The line played when a voice is tried out in Profile. */
export const SAMPLE: Record<ClipLang, string> = { ja: 'こんにち{は|wa}。よろしくお{願|ねが}いします。', it: 'Ciao! Come stai oggi?' };

const RUBY = /\{([^|{}]+)\|([^|{}]+)\}/g;

/** Text exactly as it is said: reading markup and answer blanks removed. */
export const spoken = (text: string): string => text.replace(RUBY, '$1').replace(/___/g, ' ').replace(/\s+/g, ' ').trim();


/** cyrb53: a small, well-spread string hash. */
function hash(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export const clipId = (voice: string, text: string): string => hash(`${voice}|${spoken(text)}`);

export interface ClipJob {
  id: string;
  lang: ClipLang;
  voice: string;
  /** What to say. */
  text: string;
  /** Japanese only: the text with its `{漢字|かんじ}` readings, to check the model reads kanji the same way. */
  marked?: string;
}

/** Every target-language sentence an exercise can play, including the model answer. */
export function exerciseLines(e: Exercise): string[] {
  switch (e.type) {
    case 'mcq':
      return e.text ? [e.text] : [];
    case 'gap':
      return [e.text.replace('___', e.options[e.answer] ?? '')];
    case 'tiles':
      return [e.context, e.answer].filter((s): s is string => !!s);
    case 'type':
      return [e.text, e.answer].filter((s): s is string => !!s);
    default:
      return [];
  }
}

/** Everything the app can say, once per voice. */
export function clipJobs(units: Unit[], decks: Deck[]): ClipJob[] {
  const jobs = new Map<string, ClipJob>();
  const add = (lang: ClipLang, text: string, who?: string) => {
    const say = spoken(text);
    if (!say) return;
    const voice = voiceFor(lang, who);
    const id = clipId(voice, text);
    const prev = jobs.get(id);
    if (prev && prev.text !== say) throw new Error(`clip id clash: "${prev.text}" and "${say}"`);
    jobs.set(id, { id, lang, voice, text: say, ...(lang === 'ja' ? { marked: text.replace(/___/g, ' ').replace(/\s+/g, ' ').trim() } : {}) });
  };
  for (const lang of ['ja', 'it'] as const) add(lang, SAMPLE[lang]);
  for (const u of units) {
    // Grammar patterns are not flashcards, so they are never read aloud on their own.
    for (const i of u.items) if (i.kind !== 'grammar') add(u.lang, i.front);
    for (const l of u.lessons) {
      for (const line of l.intro.lines) add(u.lang, line.text, line.who);
      for (const e of l.exercises) for (const t of exerciseLines(e)) add(u.lang, t);
      // A text or story is read sentence by sentence, and its questions are asked aloud.
      for (const s of l.passage?.sentences ?? []) add(u.lang, s.text, s.who);
      // Its "words to know" become flashcards, so each needs a clip of its own.
      for (const g of l.passage?.glossary ?? []) add(u.lang, g.word);
      if (l.passage) for (const e of l.exercises) add(u.lang, e.prompt);
    }
  }
  for (const d of decks) for (const c of d.cards) add(d.lang, c.front);
  return [...jobs.values()];
}
