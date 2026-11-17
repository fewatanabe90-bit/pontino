import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import type { Unit } from '../src/lib/schema';

const unit = JSON.parse(readFileSync(join(process.cwd(), 'content/ja/A1/unit-01.json'), 'utf8')) as Unit;

/** Marks every lesson of the first Japanese unit as finished, as if it had been played. */
async function finishFirstUnit(page: Page) {
  await page.evaluate(
    (lessons) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('pontino');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction('lessons', 'readwrite');
          for (const id of lessons) tx.objectStore('lessons').put({ id, unitId: 'ja-a1-01', lang: 'ja', status: 'done', step: 0, completedAt: Date.now(), score: 1 });
          tx.oncomplete = () => (open.result.close(), resolve());
          tx.onerror = () => reject(tx.error);
        };
      }),
    unit.lessons.map((l) => l.id),
  );
  await page.reload();
}

test('a kanji deck stays locked until its unit is finished', async ({ page }) => {
  await page.goto('./#/review');
  await expect(page.getByRole('heading', { name: 'Kanji decks' })).toBeVisible();
  await expect(page.getByText('Finish "Meeting people" to open it')).toBeVisible();
  await expect(page.getByRole('link', { name: /Kanji · Meeting people/ })).toHaveCount(0);

  // Opening it by its address does not get around the lock.
  await page.goto('./#/deck/ja-kanji-a1-01');
  await expect(page.getByText('Finish every lesson of "Meeting people" first')).toBeVisible();
});

test('a finished unit opens its kanji deck, with the reading and words on the back', async ({ page }) => {
  await page.goto('./#/review');
  await finishFirstUnit(page);
  await expect(page.getByText('Finish "Match day" to open it')).toBeVisible();
  await page.getByRole('link', { name: /Kanji · Meeting people/ }).click();

  // The front is the kanji alone; the audio would give it away, so it waits for the flip.
  await expect(page.locator('.face.front .word')).toHaveText('人');
  await expect(page.locator('.spk')).toHaveCount(0);
  await page.getByRole('button', { name: 'Show meaning' }).click();
  await expect(page.getByText('person', { exact: true })).toBeVisible();
  await expect(page.locator('.face.back')).toContainText('日本人');
  await expect(page.locator('.face.back')).toContainText('Japanese person');
  await expect(page.locator('.spk')).toHaveCount(1);
  await page.getByRole('button', { name: 'Got it' }).click();

  for (let i = 0; i < 9; i++) {
    await page.getByRole('button', { name: 'Show meaning' }).click();
    await page.getByRole('button', { name: 'Got it' }).click();
  }
  await expect(page.getByText('10 new cards learned')).toBeVisible();

  // Learned kanji sit in My flashcards under their own group, and can be practised there.
  await page.goto('./#/cards');
  await expect(page.getByRole('heading', { name: /Kanji · Meeting people/ })).toBeVisible();
  await page.getByRole('button', { name: /Practise .*Kanji · Meeting people/ }).click();
  await expect(page.getByText('10 left')).toBeVisible();
  await expect(page.locator('.spk')).toHaveCount(0);
});
