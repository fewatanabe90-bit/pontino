import { expect, test } from '@playwright/test';

declare global {
  interface Window {
    __playing: string[];
  }
}

test('a flashcard plays its recorded clip', async ({ page }) => {
  // Note every clip that really starts playing.
  await page.addInitScript(() => {
    window.__playing = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      this.addEventListener('playing', () => window.__playing.push(this.src), { once: true });
      return play.call(this);
    };
  });
  await page.goto('./#/review');
  await page.getByRole('link', { name: /Survival phrases/ }).click();
  await expect(page.getByRole('button', { name: 'Show meaning' })).toBeVisible();

  await page.getByRole('button', { name: /Play audio/ }).click();
  await expect.poll(() => page.evaluate(() => window.__playing.filter((s) => /\/audio\/[a-z0-9]+\.mp3$/.test(s)).length)).toBeGreaterThan(0);
});

test('the speaker button is available even without a device voice', async ({ page }) => {
  // Hide the browser's own voices: recorded clips must still make audio available.
  await page.addInitScript(() => {
    Object.defineProperty(window.speechSynthesis, 'getVoices', { value: () => [] });
  });
  await page.goto('./#/deck/it-deck-viaggio');
  await expect(page.getByRole('button', { name: /Play audio/ })).toBeVisible();
});
