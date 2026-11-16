import { describe, expect, it } from 'vitest';
import { canBuild, checkAnswer } from '../src/lib/check';
import { parseBackup } from '../src/lib/db';
import { grade } from '../src/lib/grade';
import { normaliseIt, normaliseJa } from '../src/lib/normalise';
import { parseRuby, rubyReading, stripRuby } from '../src/lib/ruby';
import type { Exercise } from '../src/lib/schema';
import { isDue, newCard, rate, Rating } from '../src/lib/srs';
import { emptyStreak, recordPractice, streakStatus, type Streak } from '../src/lib/streak';

describe('ruby markup', () => {
  it('parses, strips and reads', () => {
    const s = '{袋|ふくろ}はご{利用|りよう}ですか';
    expect(parseRuby(s)).toEqual([{ t: '袋', rt: 'ふくろ' }, { t: 'はご' }, { t: '利用', rt: 'りよう' }, { t: 'ですか' }]);
    expect(stripRuby(s)).toBe('袋はご利用ですか');
    expect(rubyReading(s)).toBe('ふくろはごりようですか');
  });
  it('leaves plain text alone', () => expect(parseRuby('ciao')).toEqual([{ t: 'ciao' }]));
});

describe('Japanese normalisation', () => {
  it('ignores punctuation, spaces and width', () => {
    expect(normaliseJa('はじめまして。 レオです！')).toBe(normaliseJa('はじめましてレオです'));
    expect(normaliseJa('ＡＢＣ１２３')).toBe('abc123');
    expect(normaliseJa('ｶﾀｶﾅ')).toBe(normaliseJa('カタカナ'));
  });
  it('folds katakana into hiragana', () => expect(normaliseJa('レオ')).toBe('れお'));
});

describe('Japanese answer checking', () => {
  const accepted = ['これは{日本|にほん}のチケットです。'];
  it('accepts kanji or kana spellings', () => {
    expect(checkAnswer('これは日本のチケットです', accepted, 'ja').ok).toBe(true);
    expect(checkAnswer('これはにほんのチケットです。', accepted, 'ja').ok).toBe(true);
    expect(checkAnswer('これはにほんのちけっとです', accepted, 'ja').ok).toBe(true);
  });
  it('accepts listed alternatives, including politeness variants', () => {
    const acc = ['いいえ、{学生|がくせい}じゃありません', 'いいえ、{学生|がくせい}ではありません'];
    expect(checkAnswer('いいえ、学生ではありません。', acc, 'ja').ok).toBe(true);
  });
  it('rejects a wrong particle and empty input', () => {
    expect(checkAnswer('これも日本のチケットです', accepted, 'ja').ok).toBe(false);
    expect(checkAnswer('   ', accepted, 'ja').ok).toBe(false);
  });
  it('returns the model answer', () => expect(checkAnswer('x', accepted, 'ja').expected).toBe(accepted[0]));
});

describe('Italian answer checking', () => {
  it('ignores case, end punctuation and curly apostrophes', () => {
    expect(normaliseIt('  Cos’hai  fatto? ')).toBe("cos'hai fatto");
    expect(checkAnswer('sono andato a roma.', ['Sono andato a Roma'], 'it')).toEqual({ ok: true, expected: 'Sono andato a Roma' });
  });
  it("accepts e' for è with a gentle hint", () => {
    const r = checkAnswer("La citta' e' bella", ['La città è bella'], 'it');
    expect(r.ok).toBe(true);
    expect(r.hint).toContain('città è');
  });
  it('accepts a missing or wrong accent with a hint', () => {
    expect(checkAnswer('perche', ['perché'], 'it')).toMatchObject({ ok: true, hint: expect.any(String) });
    expect(checkAnswer('perchè', ['perché'], 'it')).toMatchObject({ ok: true, hint: expect.any(String) });
  });
  it('gives no hint when the accents are right', () => expect(checkAnswer('perché', ['perché'], 'it').hint).toBeUndefined());
  it('does not confuse an elision with an accent', () => {
    expect(checkAnswer("l'amico", ["l'amico"], 'it')).toEqual({ ok: true, expected: "l'amico" });
  });
  it('rejects a wrong auxiliary', () => expect(checkAnswer('ho andato a Roma', ['Sono andato a Roma'], 'it').ok).toBe(false));
});

describe('tiles', () => {
  it('knows whether an answer can be built', () => {
    expect(canBuild('{東京|とうきょう}のチームです', ['チーム', '{東京|とうきょう}', 'の', 'です', 'は'], 'ja')).toBe(true);
    expect(canBuild('{東京|とうきょう}のチームです', ['チーム', '{東京|とうきょう}', 'です'], 'ja')).toBe(false);
    expect(canBuild('Penso che sia', ['sia', 'che', 'Penso', 'è'], 'it')).toBe(true);
  });
  it('uses each tile once', () => expect(canBuild('のの', ['の'], 'ja')).toBe(false));
});

describe('grading by exercise type', () => {
  const mcq: Exercise = { id: 'a', type: 'mcq', prompt: 'p', options: ['x', 'y'], answer: 1 };
  const gap: Exercise = { id: 'b', type: 'gap', prompt: 'p', text: 'わたし___レオです', options: ['は', 'か'], answer: 0 };
  const tiles: Exercise = { id: 'c', type: 'tiles', prompt: 'p', meaning: 'm', tiles: ['{学生|がくせい}', 'です'], answer: '{学生|がくせい}です', alt: [] };
  const type: Exercise = { id: 'd', type: 'type', prompt: 'p', answer: 'レオです', alt: ['わたしはレオです'] };
  const match: Exercise = { id: 'e', type: 'match', prompt: 'p', pairs: [['a', '1'], ['b', '2'], ['c', '3']] };

  it('multiple choice', () => {
    expect(grade(mcq, 1, 'ja')).toEqual({ ok: true, expected: 'y' });
    expect(grade(mcq, 0, 'ja').ok).toBe(false);
  });
  it('gap shows the completed sentence', () => expect(grade(gap, 1, 'ja')).toEqual({ ok: false, expected: 'わたしはレオです' }));
  it('tiles in the right and wrong order', () => {
    expect(grade(tiles, ['{学生|がくせい}', 'です'], 'ja').ok).toBe(true);
    expect(grade(tiles, ['です', '{学生|がくせい}'], 'ja').ok).toBe(false);
  });
  it('typed answer with alternatives', () => {
    expect(grade(type, 'れおです', 'ja').ok).toBe(true);
    expect(grade(type, 'わたしはレオです。', 'ja').ok).toBe(true);
    expect(grade(type, null, 'ja').ok).toBe(false);
  });
  it('match always passes once completed', () => expect(grade(match, null, 'ja').ok).toBe(true));
});

describe('streak', () => {
  const run = (days: string[], start: Streak = emptyStreak()) => days.reduce(recordPractice, start);

  it('starts at 1 and grows on consecutive days', () => {
    expect(run(['2026-11-16']).count).toBe(1);
    expect(run(['2026-11-16', '2026-11-17', '2026-11-18']).count).toBe(3);
  });
  it('counts a day once', () => expect(run(['2026-11-16', '2026-11-16']).count).toBe(1));
  it('crosses month and year ends', () => expect(run(['2026-12-31', '2027-01-01']).count).toBe(2));
  it('resets after a missed day without a freeze', () => {
    const s = run(['2026-11-16', '2026-11-17', '2026-11-19']);
    expect(s).toMatchObject({ count: 1, best: 2 });
  });
  it('earns a freeze after 7 days, up to the maximum', () => {
    const week = Array.from({ length: 7 }, (_, i) => `2026-11-${String(10 + i).padStart(2, '0')}`);
    expect(run(week).freezes).toBe(1);
    const month = Array.from({ length: 28 }, (_, i) => `2026-11-${String(1 + i).padStart(2, '0')}`);
    expect(run(month).freezes).toBe(2);
  });
  it('a freeze covers one missed day', () => {
    const s = recordPractice({ count: 7, best: 7, last: '2026-11-16', freezes: 1 }, '2026-11-18');
    expect(s).toMatchObject({ count: 8, freezes: 0 });
  });
  it('too many missed days reset even with a freeze, and the freeze is kept', () => {
    const s = recordPractice({ count: 9, best: 9, last: '2026-11-16', freezes: 1 }, '2026-11-19');
    expect(s).toMatchObject({ count: 1, freezes: 1, best: 9 });
  });
  it('never punishes a clock that moved backwards', () => {
    const s: Streak = { count: 5, best: 5, last: '2026-11-16', freezes: 0 };
    expect(recordPractice(s, '2026-11-15')).toBe(s);
  });
  it('reports status for display', () => {
    const s: Streak = { count: 5, best: 5, last: '2026-11-16', freezes: 0 };
    expect(streakStatus(s, '2026-11-16')).toEqual({ count: 5, doneToday: true, atRisk: false });
    expect(streakStatus(s, '2026-11-17')).toEqual({ count: 5, doneToday: false, atRisk: true });
    expect(streakStatus(s, '2026-11-18')).toEqual({ count: 0, doneToday: false, atRisk: false });
    expect(streakStatus(emptyStreak(), '2026-11-18').count).toBe(0);
  });
});

describe('spaced repetition', () => {
  const now = new Date('2026-11-16T09:00:00');
  const base = { itemId: 'x', lang: 'ja' as const, unitId: 'u', front: 'f', back: 'b' };

  it('a new card is due immediately', () => {
    const c = newCard(base, now);
    expect(c.id).toBe('x:recognise');
    expect(isDue(c, now)).toBe(true);
  });
  it('Good pushes the card into the future; Easy pushes further', () => {
    const c = newCard(base, now);
    const good = rate(c, Rating.Good, now);
    const easy = rate(c, Rating.Easy, now);
    expect(good.due).toBeGreaterThan(now.getTime());
    expect(good.due).toBe(good.fsrs.due.getTime());
    expect(easy.due).toBeGreaterThan(good.due);
    expect(isDue(good, now)).toBe(false);
  });
  it('Again after a long interval brings it back sooner than Good', () => {
    let c = rate(newCard(base, now), Rating.Easy, now);
    const later = new Date(c.due);
    expect(rate(c, Rating.Again, later).due).toBeLessThan(rate(c, Rating.Good, later).due);
  });
});

describe('backup', () => {
  it('rejects files that are not Pontino backups', () => {
    expect(() => parseBackup({ hello: 1 })).toThrow();
    expect(() => parseBackup(null)).toThrow();
  });
  it('restores dates after a JSON round trip', () => {
    const card = rate(newCard({ itemId: 'x', lang: 'ja', unitId: 'u', front: 'f', back: 'b' }), Rating.Good);
    const file = JSON.parse(
      JSON.stringify({ format: 'pontino-backup', version: 1, exportedAt: '', kv: [], cards: [card], lessons: [] }),
    );
    const restored = parseBackup(file).cards[0]!;
    expect(restored.fsrs.due).toBeInstanceOf(Date);
    expect(restored.fsrs.due.getTime()).toBe(card.due);
    expect(() => rate(restored, Rating.Good)).not.toThrow();
  });
});
