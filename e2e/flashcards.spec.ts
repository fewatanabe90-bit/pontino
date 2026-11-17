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

test('learned cards can be read again under My flashcards', async ({ page }) => {
  await page.goto('./#/deck/it-deck-viaggio');
  for (let i = 0; i < 10; i++) {
    await page.getByRole('button', { name: 'Show meaning' }).click();
    await page.getByRole('button', { name: 'Got it' }).click();
  }
  await page.getByRole('link', { name: 'Back to decks' }).click();
  await page.getByRole('link', { name: /My flashcards/ }).click();
  await expect(page.getByText('10 cards collected')).toBeVisible();

  // Meanings stay hidden until a card is tapped.
  await expect(page.getByText('platform (track)', { exact: true })).toHaveCount(0);
  await page.locator('.word').filter({ hasText: 'il binario' }).click();
  await expect(page.getByText('platform (track)', { exact: true })).toBeVisible();

  await page.getByRole('searchbox').fill('biglietto');
  await expect(page.locator('.item')).toHaveCount(1);
});

test('the words of a story become flashcards when it is finished', async ({ page }) => {
  await page.goto('./#/profile');
  await page.getByRole('group', { name: 'Course' }).getByRole('button', { name: 'Italiano' }).click();
  await page.goto('./#/lesson/it-r2/it-r2.l5');
  await page.getByRole('button', { name: 'Answer the questions' }).click();
  for (let i = 0; i < 6; i++) {
    await page.locator('.opt').first().click();
    await page.getByRole('button', { name: 'Check' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
  }
  await expect(page.getByText('Bridge crossed!')).toBeVisible();
  await page.goto('./#/cards');
  await expect(page.getByText('5 cards collected')).toBeVisible();
  await expect(page.locator('.word').filter({ hasText: "l'asciugamano" })).toBeVisible();
});
