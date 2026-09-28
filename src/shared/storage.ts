import type { z } from 'zod/mini';
import { parseJson } from './json.ts';

// Everything we keep in the page's storage, prefixed `cdc` so it can't clash
// with Lichess's own keys.
export const StorageKey = {
  board: 'cdc-board',
  pieces: 'cdc-pieces',
  coach: 'cdc-coach',
  boardZoom: 'cdc-board-zoom',
  ratingChartRange: 'cdc-rchart:range',
  reviewCache: (gameId: string, positions: number, version: number): string =>
    `cdc-review:${gameId}:${positions}:v${version}`,
} satisfies Record<string, string | ((...args: never[]) => string)>;

export const SessionKey = {
  lateReload: 'cdc-late-reload',
  gameStarted: (gameId: string): string => `cdc-started:${gameId}`,
} satisfies Record<string, string | ((...args: never[]) => string)>;

type Area = 'local' | 'session';

const area = (name: Area): Storage => (name === 'local' ? localStorage : sessionStorage);

/**
 * A stored value that passes `schema`, or null. A blocked storage throws, as
 * the original's did: read as missing, a once-per-game check could never hold
 * there, as the writes are lost. So read before changing the page.
 */
export function readStored<T>(
  key: string,
  schema: z.ZodMiniType<T>,
  from: Area = 'local',
): T | null {
  const result = schema.safeParse(area(from).getItem(key));
  return result.success ? result.data : null;
}

/** Like `readStored`, for a JSON value: a blocked storage throws too. */
export function readStoredJson<T>(
  key: string,
  schema: z.ZodMiniType<T>,
  from: Area = 'local',
): T | null {
  return parseJson(area(from).getItem(key), schema);
}

/** Stores a value; a full or blocked storage only costs the value. */
export function writeStored(key: string, value: string | number, to: Area = 'local'): void {
  try {
    area(to).setItem(key, String(value));
  } catch {
    // Quota exceeded, or storage disabled.
  }
}

export function writeStoredJson(key: string, value: unknown, to: Area = 'local'): void {
  writeStored(key, JSON.stringify(value), to);
}

/** Removes a value; like a write, a blocked storage only costs the value. */
export function removeStored(key: string, from: Area = 'local'): void {
  try {
    area(from).removeItem(key);
  } catch {
    // Storage disabled.
  }
}
