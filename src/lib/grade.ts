import { checkAnswer, type CheckResult } from './check';
import type { Lang } from './normalise';
import type { Exercise } from './schema';

/** The learner's answer: an option index, a list of tiles, or typed text. */
export type Answer = number | string[] | string | null;

export function hasAnswer(a: Answer): boolean {
  if (a === null) return false;
  if (typeof a === 'number') return true;
  if (typeof a === 'string') return a.trim().length > 0;
  return a.length > 0;
}

export function grade(ex: Exercise, a: Answer, lang: Lang): CheckResult {
  switch (ex.type) {
    case 'mcq':
      return { ok: a === ex.answer, expected: ex.options[ex.answer] ?? '' };
    case 'gap':
      return { ok: a === ex.answer, expected: ex.text.replace('___', ex.options[ex.answer] ?? '') };
    case 'tiles':
      return checkAnswer(Array.isArray(a) ? a.join(lang === 'it' ? ' ' : '') : '', [ex.answer, ...ex.alt], lang);
    case 'type':
      return checkAnswer(typeof a === 'string' ? a : '', [ex.answer, ...ex.alt], lang);
    case 'match':
      return { ok: true, expected: '' };
  }
}
