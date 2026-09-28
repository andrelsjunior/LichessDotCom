import { z } from 'zod/mini';
import { DevCheckRequestSchema, type DevCheckResponse } from '#shared/dev-check.ts';
import { fingerprint } from './fingerprint.ts';

// Unpacked installs only. A build (`pnpm dev`, `pnpm build`) rewrites the
// folder Chrome loads, so when a Lichess tab asks, the files on disk are
// compared with the ones running and the extension reloads if they changed.
// The running fingerprint is kept in chrome.storage, which the store's package
// goes without: loaded unpacked, that package just doesn't reload itself.

const LOADED_KEY = 'dev:loaded';
const LoadedSchema = z.object({ [LOADED_KEY]: z.optional(z.string()) });

// Lets the answer reach the tab before the extension goes down.
const RELOAD_DELAY_MS = 50;

let reloading = false;

// Session storage is cleared on every extension reload, so it holds the
// fingerprint of the code actually running, across worker restarts.
async function loadedFingerprint(): Promise<string> {
  const stored = LoadedSchema.safeParse(await chrome.storage.session.get(LOADED_KEY)).data;
  const loaded = stored?.[LOADED_KEY];
  if (loaded) return loaded;
  const current = await fingerprint();
  await chrome.storage.session.set({ [LOADED_KEY]: current });
  return current;
}

async function answer(sendResponse: (response: DevCheckResponse) => void): Promise<void> {
  const [loaded, current] = await Promise.all([loadedFingerprint(), fingerprint()]);
  const stale = reloading || loaded !== current;
  sendResponse({ reload: stale });
  if (!stale || reloading) return;
  reloading = true;
  setTimeout(() => chrome.runtime.reload(), RELOAD_DELAY_MS);
}

function remember(): void {
  void loadedFingerprint();
}

export function startDevReload(): void {
  chrome.runtime.onInstalled.addListener(remember);
  chrome.runtime.onStartup.addListener(remember);
  chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    if (!DevCheckRequestSchema.safeParse(message).success) return false;
    void answer(sendResponse);
    // Keeps the channel open for the answer.
    return true;
  });
}
