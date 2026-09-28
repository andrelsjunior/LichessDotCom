import { expect, test } from './fixtures.ts';

test('the extension styles the home page', async ({ page }) => {
  await page.goto('https://lichess.org/', { waitUntil: 'load' });
  const panel = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--cdc-bg-panel').trim(),
  );
  expect(panel).toBe('#262522');
});
