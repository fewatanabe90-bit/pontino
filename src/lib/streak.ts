export interface Streak {
  count: number;
  best: number;
  /** Local calendar day of the last practice, `YYYY-MM-DD`. */
  last: string | null;
  freezes: number;
}

export const MAX_FREEZES = 2;
/** One freeze is earned for every full week of streak. */
export const FREEZE_EVERY = 7;

export const emptyStreak = (): Streak => ({ count: 0, best: 0, last: null, freezes: 0 });

export function localDay(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function daysBetween(a: string, b: string): number {
  const utc = (s: string) => {
    const [y, m, d] = s.split('-').map(Number) as [number, number, number];
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

/** Record practice on `today`. Missed days are covered by freezes when there are enough of them. */
export function recordPractice(s: Streak, today: string): Streak {
  if (s.last === today) return s;
  let { count, freezes } = s;
  const gap = s.last ? daysBetween(s.last, today) : Infinity;
  if (gap < 1) return s; // the clock moved backwards: never punish
  const missed = gap - 1;
  if (gap === 1) count += 1;
  else if (count > 0 && missed <= freezes) {
    freezes -= missed;
    count += 1;
  } else count = 1;
  if (count % FREEZE_EVERY === 0) freezes = Math.min(MAX_FREEZES, freezes + 1);
  return { count, freezes, last: today, best: Math.max(s.best, count) };
}

/** What to show on `today`, without changing anything. */
export function streakStatus(s: Streak, today: string): { count: number; doneToday: boolean; atRisk: boolean } {
  if (!s.last) return { count: 0, doneToday: false, atRisk: false };
  const gap = daysBetween(s.last, today);
  if (gap <= 0) return { count: s.count, doneToday: true, atRisk: false };
  const alive = gap - 1 <= s.freezes;
  return { count: alive ? s.count : 0, doneToday: false, atRisk: alive && s.count > 0 };
}
