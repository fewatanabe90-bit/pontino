import { expect, test } from '@playwright/test';

test('a wrong answer does not come back in the lesson; it waits in Review and leaves once fixed', async ({ page }) => {
  await page.goto('./#/lesson/ja-a1-01/ja-a1-01.l1');
  await page.getByRole('button', { name: 'Start practice' }).click();

  // Exercise 1 of 8: answer wrong on purpose.
  await page.getByRole('radio', { name: /It means "is"/ }).click();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText('Not quite')).toBeVisible();
  await expect(page.getByText(/Review → Mistakes/)).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  // The lesson moves on to the next exercise and the progress bar counts the missed one as done.
  await expect(page.getByRole('heading', { name: 'Fill the gap.' })).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');

  await page.goto('./#/review');
  await page.getByRole('link', { name: /1 mistake to fix/ }).click();
  await page.getByRole('radio', { name: /It marks the topic/ }).click();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText('Correct')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Mistakes cleared!')).toBeVisible();

  await page.getByRole('link', { name: 'Continue' }).click();
  await expect(page.getByText('Flashcard decks')).toBeVisible();
  await expect(page.getByRole('link', { name: /to fix/ })).toHaveCount(0);
});
