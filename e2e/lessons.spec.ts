import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import type { Exercise, Unit } from '../src/lib/schema';

/** Plays every written lesson with the right answers and expects it to finish. */
const find = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? find(join(dir, n)) : /^unit-.*.json$/.test(n) ? [join(dir, n)] : []));
const units = find(join(process.cwd(), 'content')).map((f) => JSON.parse(readFileSync(f, 'utf8')) as Unit);

/** What a marked-up string looks like on screen with furigana on and romaji off. */
const shown = (s: string) =>
  s.replace(/\{([^|{}]+)\|([^|{}]+)\}/g, (_, base: string, rt: string) => (/^[\x20-\x7e]+$/.test(rt) ? base : base + rt));

async function answer(page: Page, ex: Exercise, lang: Unit['lang']) {
  if (ex.type === 'mcq' || ex.type === 'gap') {
    await page.locator('.opt').filter({ hasText: new RegExp(`^\\s*${escape(shown(ex.options[ex.answer]!))}\\s*$`) }).click();
  } else if (ex.type === 'tiles') {
    let rest = shown(ex.answer);
    // Italian tiles are whole words, so a tile must end at a word boundary ("a" must not match "andato").
    const fits = (t: string) => rest.startsWith(t) && (lang === 'ja' || rest.length === t.length || rest[t.length] === ' ');
    while (rest) {
      const tiles = page.locator('.bank .tile:not(.used)');
      const texts = (await tiles.allTextContents()).map((t) => t.trim());
      const i = texts.findIndex((t) => t && fits(t));
      expect(i, `${ex.id}: no tile continues "${rest}"`).toBeGreaterThanOrEqual(0);
      await tiles.nth(i).click();
      rest = rest.slice(texts[i]!.length).trimStart();
    }
  } else if (ex.type === 'type') {
    await page.locator('textarea').fill(ex.answer.replace(/\{([^|{}]+)\|[^|{}]+\}/g, '$1'));
  } else {
    for (const [a, b] of ex.pairs) {
      await page.locator('.col').first().locator('.tile').filter({ hasText: new RegExp(`^\\s*${escape(shown(a))}\\s*$`) }).click();
      await page.locator('.col').last().locator('.tile').filter({ hasText: new RegExp(`^\\s*${escape(b)}\\s*$`) }).click();
    }
  }
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test.beforeEach(async ({ page }) => {
  await page.goto('./#/profile');
  await page.getByRole('group', { name: 'Romaji under kana' }).getByRole('button', { name: 'Hide' }).click();
});

for (const unit of units)
 for (const lesson of unit.lessons) {
  test(`${lesson.id} can be completed`, async ({ page }) => {
    await page.goto(`./#/profile`);
    await page.getByRole('group', { name: 'Course' }).getByRole('button', { name: unit.lang === 'ja' ? '日本語' : 'Italiano' }).click();
    await page.goto(`./#/lesson/${unit.id}/${lesson.id}`);
    await page.getByRole('button', { name: 'Start practice' }).click();
    for (const ex of lesson.exercises) {
      await answer(page, ex, unit.lang);
      if (ex.type !== 'match') await page.getByRole('button', { name: 'Check' }).click();
      await expect(page.locator('.sheet .h'), ex.id).toContainText('Correct');
      await page.getByRole('button', { name: 'Continue' }).click();
    }
    await expect(page.getByText('Bridge crossed!')).toBeVisible();
    await expect(page.getByText(lesson.canDo)).toBeVisible();
  });
}
