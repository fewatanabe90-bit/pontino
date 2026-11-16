import { db, type LessonProgress } from './db';
import type { Lang } from './normalise';
import type { Lesson, Unit } from './schema';
import { newCard } from './srs';
import { emptyStreak, localDay, recordPractice, type Streak } from './streak';

export type Furigana = 'always' | 'never';
export type Mode = 'light' | 'dark' | 'auto';

interface Settings {
  lang: Lang;
  furigana: Furigana;
  mode: Mode;
  rate: number;
}

const DEFAULTS: Settings = { lang: 'ja', furigana: 'always', mode: 'auto', rate: 1 };

export const app = $state({
  ready: false,
  ...DEFAULTS,
  xp: 0,
  /** XP earned per local day, for the daily goal. */
  xpToday: 0,
  streak: emptyStreak() as Streak,
  lessons: {} as Record<string, LessonProgress>,
  due: { ja: 0, it: 0 } as Record<Lang, number>,
});

export const DAILY_XP_GOAL = 100;

const put = (key: string, value: unknown) => db.kv.put({ key, value: $state.snapshot(value) });

function applyTheme() {
  const dark = app.mode === 'dark' || (app.mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
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
  app.xp = (kv.get('xp') as number | undefined) ?? 0;
  app.streak = (kv.get('streak') as Streak | undefined) ?? emptyStreak();
  const day = kv.get('xpDay') as { day: string; xp: number } | undefined;
  app.xpToday = day?.day === localDay() ? day.xp : 0;
  app.lessons = Object.fromEntries((await db.lessons.toArray()).map((l) => [l.id, l]));
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
  void put('settings', { lang: app.lang, furigana: app.furigana, mode: app.mode, rate: app.rate });
}

export function addXp(n: number) {
  app.xp += n;
  app.xpToday += n;
  void put('xp', app.xp);
  void put('xpDay', { day: localDay(), xp: app.xpToday });
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

  const items = unit.items.filter((i) => lesson.newItems.includes(i.id));
  const fresh = [];
  for (const i of items) {
    const card = newCard({ itemId: i.id, lang: unit.lang, unitId: unit.id, front: i.front, back: i.back, note: i.note });
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
