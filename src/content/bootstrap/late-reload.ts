import { z } from 'zod/mini';
import { isParsing } from '#shared/dom.ts';
import { readStored, SessionKey, writeStored } from '#shared/storage.ts';

// Firefox injects the content scripts into the open tabs when the extension is
// installed, updated or reloaded, into a finished page: its init data read and
// gone, an older copy's page-world scripts still running. Start it afresh.

// Once per window, so a page that somehow always finishes first can't loop.
const RELOAD_WINDOW_MS = 30_000;

/** True when it reloaded the page: the content script should then stop. */
export function reloadIfInjectedLate(): boolean {
  // A document_start script always finds the page parsing.
  if (isParsing()) return false;
  const last = readStored(SessionKey.lateReload, z.coerce.number(), 'session') ?? 0;
  if (Date.now() - last <= RELOAD_WINDOW_MS) return false;
  writeStored(SessionKey.lateReload, Date.now(), 'session');
  location.reload();
  return true;
}
