import { apostropheToAccent, foldAccents, normaliseIt, normaliseJa, type Lang } from './normalise';
import { rubyReading, stripRuby } from './ruby';

export interface CheckResult {
  ok: boolean;
  /** Gentle note shown with a correct answer (e.g. an accent reminder). */
  hint?: string;
  /** The model answer to show, with furigana markup if it has any. */
  expected: string;
}

/**
 * Compare a typed or built answer with the accepted answers.
 * Japanese: each accepted answer also matches by its kana reading, so 学生です and がくせいです both pass.
 * Italian: `e'` for `è` and missing or wrong accents are accepted with a hint.
 */
export function checkAnswer(input: string, accepted: string[], lang: Lang): CheckResult {
  const expected = accepted[0] ?? '';
  if (!input.trim()) return { ok: false, expected };

  if (lang === 'ja') {
    const got = normaliseJa(input);
    const ok = accepted.some((a) => got === normaliseJa(stripRuby(a)) || got === normaliseJa(rubyReading(a)));
    return { ok, expected };
  }

  const got = normaliseIt(input);
  const targets = accepted.map(normaliseIt);
  if (targets.includes(got)) return { ok: true, expected };

  const viaApostrophe = apostropheToAccent(got);
  const hit = targets.findIndex((t) => t === viaApostrophe || foldAccents(t) === foldAccents(viaApostrophe));
  if (hit >= 0) return { ok: true, expected, hint: `Watch the accents: ${accepted[hit]}` };
  return { ok: false, expected };
}

/** Can `target` be assembled by concatenating some of `tiles`, each used at most once? */
export function canBuild(target: string, tiles: string[], lang: Lang): boolean {
  const norm = (s: string) => (lang === 'ja' ? normaliseJa(s) : normaliseIt(s).replace(/ /g, ''));
  const goal = norm(target);
  const parts = tiles.map(norm);
  const used = new Array<boolean>(parts.length).fill(false);
  const walk = (pos: number): boolean => {
    if (pos === goal.length) return true;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]!;
      if (used[i] || !p || !goal.startsWith(p, pos)) continue;
      used[i] = true;
      if (walk(pos + p.length)) return true;
      used[i] = false;
    }
    return false;
  };
  return walk(0);
}
