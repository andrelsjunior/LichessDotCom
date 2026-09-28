import { z } from 'zod/mini';
import { readStoredJson, StorageKey, writeStoredJson } from '#shared/storage.ts';
import { type PositionRecord, PositionRecordSchema } from '#page/review/evaluation/score.ts';

// Each game's records at full depth, kept once its analysis is complete:
// opening the game again shows its review at once.

/** Bump to drop every cached review, when the records' meaning changes. */
const CACHE_VERSION = 1;

const CachedSchema = z.array(PositionRecordSchema);

const cacheKey = (gameId: string, positions: number): string =>
  StorageKey.reviewCache(gameId, positions, CACHE_VERSION);

export function readCachedRecords(gameId: string, positions: number): PositionRecord[] | null {
  const records = readStoredJson(cacheKey(gameId, positions), CachedSchema);
  return records?.length === positions ? records : null;
}

export function cacheRecords(
  gameId: string,
  positions: number,
  records: readonly (PositionRecord | undefined)[],
): void {
  writeStoredJson(cacheKey(gameId, positions), records);
}
