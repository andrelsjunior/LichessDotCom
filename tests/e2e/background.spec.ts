import type { Worker } from '@playwright/test';
import { DevCheckResponseSchema } from '#shared/dev-check.ts';
import { expect, test } from './fixtures.ts';
import { evaluateInContentScript } from './support/content-world.ts';
import { openLichess } from './support/lichess.ts';

// The background worker. The dev auto-reload itself needs a real rebuild and
// is out of scope; its bookkeeping and its answer to the tabs are in.

const LOADED_KEY = 'dev:loaded';

test('the background worker starts, and tells a tab its files haven’t changed', async ({
  context,
  page,
}) => {
  const worker: Worker =
    context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  const workerUrl = new URL(worker.url());
  expect(workerUrl.pathname).toBe('/background.js');
  const errors: string[] = [];
  worker.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  // The install cleanup, and in an unpacked install the dev reload's listener.
  const listening = await worker.evaluate(() => ({
    installed: chrome.runtime.onInstalled.hasListeners(),
    message: chrome.runtime.onMessage.hasListeners(),
  }));
  expect(listening).toEqual({ installed: true, message: true });
  // Once installed, it keeps a digest of the code it runs: a SHA-1, in base64.
  const loaded = (): Promise<unknown> =>
    worker.evaluate(async key => (await chrome.storage.session.get(key))[key], LOADED_KEY);
  await expect.poll(loaded).toMatch(/^[A-Za-z0-9+/]{27}=$/);

  // A Lichess tab asks, as its content script does on focus.
  await openLichess(page, '/');
  const answer = await evaluateInContentScript(
    page,
    "chrome.runtime.sendMessage({ type: 'cdc:dev-check' })",
  );
  expect(DevCheckResponseSchema.parse(answer)).toEqual({ reload: false });
  expect(errors).toEqual([]);
});
