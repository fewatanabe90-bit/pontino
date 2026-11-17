import { catalog, loadUnit } from './content';
import type { LessonProgress } from './db';
import type { Lang } from './normalise';
import type { Lesson, Unit } from './schema';

export interface NextLesson {
  unit: Unit;
  lesson: Lesson;
  /** 1-based position of the lesson in its unit. */
  n: number;
  resume: boolean;
}

/** All written units for a language, in catalog order. */
export async function writtenUnits(lang: Lang): Promise<Unit[]> {
  const entries = catalog.filter((c) => c.lang === lang && c.file);
  return Promise.all(entries.map((c) => loadUnit(c.file!)));
}

/** The first lesson not finished yet, or null when everything written so far is done. */
export function nextLesson(units: Unit[], done: Record<string, LessonProgress>): NextLesson | null {
  for (const unit of units) {
    for (const [i, lesson] of unit.lessons.entries()) {
      const p = done[lesson.id];
      if (p?.status !== 'done') return { unit, lesson, n: i + 1, resume: !!p && p.step > 0 };
    }
  }
  return null;
}

/** Has every lesson of this unit been finished? */
export const unitFinished = (unit: Unit, done: Record<string, LessonProgress>): boolean =>
  unit.lessons.every((l) => done[l.id]?.status === 'done');

export const lessonHref = (unitId: string, lessonId: string) => `#/lesson/${unitId}/${lessonId}`;
