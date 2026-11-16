import { expect, test } from '@playwright/test';

test('a deck session teaches ten cards and puts them in the review queue', async ({ page }) => {
  await page.goto('./#/review');
  await page.getByRole('link', { name: /Survival phrases/ }).click();

  // First card: say "still learning" once, so it has to come back later in the session.
  await page.getByRole('button', { name: 'Show meaning' }).click();
  await page.getByRole('button', { name: 'Still learning' }).click();
  await expect(page.getByText('10 left')).toBeVisible();

  for (let i = 0; i < 10; i++) {
    await page.getByRole('button', { name: 'Show meaning' }).click();
    await page.getByRole('button', { name: 'Got it' }).click();
  }
  await expect(page.getByText('10 new cards learned')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next 8 cards' })).toBeVisible();

  await page.getByRole('link', { name: 'Back to decks' }).click();
  await expect(page.getByText('10 of 18 cards learned')).toBeVisible();
});

test('Italian decks show the Portuguese warning on the back', async ({ page }) => {
  await page.goto('./#/deck/it-deck-falsi-amici');
  await expect(page.getByText('squisito', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Show meaning' }).click();
  await expect(page.getByText('delicious')).toBeVisible();
  await expect(page.getByText(/esquisito/)).toBeVisible();
});
