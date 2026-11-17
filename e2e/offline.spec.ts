import { expect, test } from '@playwright/test';

test('installable: manifest and icons are served', async ({ page, request }) => {
  await page.goto('./');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = await (await request.get(new URL(href!, page.url()).href)).json();
  expect(manifest.display).toBe('standalone');
  for (const icon of manifest.icons) {
    expect((await request.get(new URL(icon.src, page.url()).href)).ok()).toBe(true);
  }
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
});

test('works offline after the first load, including a lesson', async ({ page, context }) => {
  await page.goto('./');
  await expect(page.getByRole('link', { name: 'Start lesson' })).toBeVisible();
  // The service worker activates only after it has cached everything; it takes over on the next load.
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('link', { name: 'Start lesson' })).toBeVisible();

  // The lesson content is a separate file; it must come from the cache too.
  await page.getByRole('link', { name: 'Start lesson' }).click();
  await expect(page.getByRole('button', { name: 'Start practice' })).toBeVisible();
  // Translations stay hidden until a line is tapped.
  await expect(page.getByText('Nice to meet you. I\'m Nakamura.')).toHaveCount(0);
  await page.locator('.say').first().click();
  await expect(page.getByText('Nice to meet you. I\'m Nakamura.')).toBeVisible();
});

test('romaji under kana can be switched off', async ({ page }) => {
  await page.goto('./#/lesson/ja-a1-01/ja-a1-01.l1');
  await expect(page.locator('.ro').first()).toBeVisible();
  await page.goto('./#/profile');
  await page.getByRole('group', { name: 'Romaji under kana' }).getByRole('button', { name: 'Hide' }).click();
  await page.goto('./#/lesson/ja-a1-01/ja-a1-01.l1');
  await expect(page.getByRole('button', { name: 'Start practice' })).toBeVisible();
  await expect(page.locator('.ro')).toHaveCount(0);
});
