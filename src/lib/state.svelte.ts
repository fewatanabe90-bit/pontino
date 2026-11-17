import { db, type LessonProgress } from './db';
import { INTEREST_IDS, type Interest } from './interests';
import type { Lang } from './normalise';
import type { Lesson, Unit } from './schema';
import { newCard } from './srs';
import { emptyStreak, localDay, recordPractice, type Streak } from './streak';
import { setPreferredVoice } from './tts';

export type Furigana = 'always' | 'never';
export type Mode = 'light' | 'dark' | 'auto';

interface Settings {
  lang: Lang;
  furigana: Furigana;
  /** Latin letters under kana, as a reading aid for the early units. */
  romaji: boolean;
  /** Topics the learner picked; matching decks and units are offered first. */
  interests: Interest[];
  /** The learner has confirmed their interests at least once. */
  interestsSet: boolean;
  /** Chosen voice per language (a voiceURI); empty picks the best one on the device. */
  voiceJa: string;
  voiceIt: string;
  /** Sound effects for right and wrong answers. */
  sound: boolean;
  /** Read dialogues and exercises aloud without tapping. */
  autoplay: boolean;
  mode: Mode;
  rate: number;
}

const DEFAULTS: Settings = { lang: 'ja', furigana: 'always', romaji: true, interests: [...INTEREST_IDS], interestsSet: false, voiceJa: '', voiceIt: '', sound: true, autoplay: true, mode: 'auto', rate: 0.9 };

export const app = $state({
  ready: false,
  ...DEFAULTS,
  xp: 0,
  /** XP earned per local day. */
  xpToday: 0,
  /** Seconds practised today in each language, for the daily goal. */
  secondsToday: { ja: 0, it: 0 } as Record<Lang, number>,
  streak: emptyStreak() as Streak,
  lessons: {} as Record<string, LessonProgress>,
  due: { ja: 0, it: 0 } as Record<Lang, number>,
});

export const DAILY_XP_GOAL = 100;
/** The daily target for each language. */
export const DAILY_MINUTES = 15;
let timeDay = '';

const put = (key: string, value: unknown) => db.kv.put({ key, value: $state.snapshot(value) });

function applyTheme() {
  const dark = app.mode === 'dark' || (app.mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  setPreferredVoice('ja', app.voiceJa);
  setPreferredVoice('it', app.voiceIt);
  const root = document.documentElement;
  root.dataset.lang = app.lang;
  root.dataset.mode = dark ? 'dark' : 'light';
  root.lang = 'en';
}

export async function refreshDue() {
  const now = Date.now();
  const [ja, it] = await Promise.all(
    (['ja', 'it'] as const).map((l) => db.cards.where('[lang+due]').between([l, 0], [l, now], true, true).count()),
  );
  app.due = { ja: ja ?? 0, it: it ?? 0 };
}

export async function boot() {
  const kv = new Map((await db.kv.toArray()).map((r) => [r.key, r.value]));
  Object.assign(app, DEFAULTS, kv.get('settings') ?? {});
  // One-time change: the first versions saved full speed as the default; the natural default is a little slower.
  if (!kv.get('rateTuned')) {
    app.rate = DEFAULTS.rate;
    void put('rateTuned', true);
  }
  app.xp = (kv.get('xp') as number | undefined) ?? 0;
  app.streak = (kv.get('streak') as Streak | undefined) ?? emptyStreak();
  const day = kv.get('xpDay') as { day: string; xp: number } | undefined;
  app.xpToday = day?.day === localDay() ? day.xp : 0;
  const time = kv.get('timeDay') as { day: string; ja: number; it: number } | undefined;
  timeDay = localDay();
  app.secondsToday = time?.day === timeDay ? { ja: time.ja, it: time.it } : { ja: 0, it: 0 };
  app.lessons = Object.fromEntries((await db.lessons.toArray()).map((l) => [l.id, l]));
  // Earlier versions made flashcards out of grammar patterns ("AのB"); those are removed.
  await db.cards.filter((c) => /\.g-/.test(c.itemId)).delete();
  await refreshDue();
  applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  // Ask the browser not to evict our data. It may say no; the export reminder covers that case.
  void navigator.storage?.persist?.();
  app.ready = true;
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  app[key] = value as never;
  applyTheme();
  void put('settings', { lang: app.lang, furigana: app.furigana, romaji: app.romaji, interests: app.interests, interestsSet: app.interestsSet, voiceJa: app.voiceJa, voiceIt: app.voiceIt, sound: app.sound, autoplay: app.autoplay, mode: app.mode, rate: app.rate });
}

export function addXp(n: number) {
  app.xp += n;
  app.xpToday += n;
  void put('xp', app.xp);
  void put('xpDay', { day: localDay(), xp: app.xpToday });
}

/** Count time spent studying towards today's goal for that language. */
export function addPracticeTime(lang: Lang, seconds: number) {
  const today = localDay();
  if (today !== timeDay) {
    timeDay = today;
    app.secondsToday = { ja: 0, it: 0 };
  }
  app.secondsToday[lang] += seconds;
  void put('timeDay', { day: today, ja: app.secondsToday.ja, it: app.secondsToday.it });
}

export function markPractice() {
  app.streak = recordPractice(app.streak, localDay());
  void put('streak', app.streak);
}

export function saveLessonStep(unit: Unit, lesson: Lesson, step: number) {
  if (app.lessons[lesson.id]?.status === 'done') return;
  const p: LessonProgress = { id: lesson.id, unitId: unit.id, lang: unit.lang, status: 'started', step };
  app.lessons[lesson.id] = p;
  void db.lessons.put(p);
}

/** Finish a lesson: record it, add its new items to the review queue, keep the streak alive. Returns the number of new cards. */
export async function completeLesson(unit: Unit, lesson: Lesson, score: number): Promise<number> {
  const p: LessonProgress = {
    id: lesson.id,
    unitId: unit.id,
    lang: unit.lang,
    status: 'done',
    step: lesson.exercises.length,
    completedAt: Date.now(),
    score: Math.max(score, app.lessons[lesson.id]?.score ?? 0),
  };
  app.lessons[lesson.id] = p;
  await db.lessons.put(p);

  // Flashcards are a word or phrase and its meaning. Grammar patterns are practised in the lessons instead.
  const items = unit.items.filter((i) => i.kind !== 'grammar' && lesson.newItems.includes(i.id));
  const fresh = [];
  for (const i of items) {
    const card = newCard({ itemId: i.id, lang: unit.lang, unitId: unit.id, front: i.front, back: i.back, note: [i.note, i.pt && `🇧🇷 ${i.pt}`].filter(Boolean).join('\n') || undefined });
    if (!(await db.cards.get(card.id))) fresh.push(card);
  }
  // The "words to know" of a text or story become flashcards too.
  for (const [n, g] of (lesson.passage?.glossary ?? []).entries()) {
    const card = newCard({ itemId: `${lesson.id}.w${n + 1}`, lang: unit.lang, unitId: unit.id, front: g.word, back: g.meaning });
    if (!(await db.cards.get(card.id))) fresh.push(card);
  }
  await db.cards.bulkPut(fresh);
  markPractice();
  await refreshDue();
  return fresh.length;
}

export async function reloadAfterImport() {
  location.hash = '#/home';
  location.reload();
}
