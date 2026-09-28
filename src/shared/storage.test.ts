import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod/mini';
import {
  readStored,
  readStoredJson,
  removeStored,
  SessionKey,
  StorageKey,
  writeStored,
  writeStoredJson,
} from './storage.ts';

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('storage', () => {
  it('names every key with the cdc prefix', () => {
    expect(StorageKey.reviewCache('abcd1234', 80, 3)).toBe('cdc-review:abcd1234:80:v3');
    expect(SessionKey.gameStarted('abcd1234')).toBe('cdc-started:abcd1234');
    const names = [...Object.values(StorageKey), ...Object.values(SessionKey)].filter(
      (key): key is string => typeof key === 'string',
    );
    for (const name of names) expect(name).toMatch(/^cdc-/);
  });

  it('reads back what it wrote, in either area, through a schema', () => {
    writeStored(StorageKey.boardZoom, 80);
    writeStored(SessionKey.lateReload, 5, 'session');
    expect(readStored(StorageKey.boardZoom, z.coerce.number())).toBe(80);
    expect(readStored(SessionKey.lateReload, z.string(), 'session')).toBe('5');
    expect(readStored(SessionKey.lateReload, z.string())).toBeNull();
    removeStored(StorageKey.boardZoom);
    expect(localStorage.getItem(StorageKey.boardZoom)).toBeNull();
  });

  it('reads JSON, and a value that fails its schema as missing', () => {
    writeStoredJson('cdc-test', { a: 1 });
    expect(readStoredJson('cdc-test', z.object({ a: z.number() }))).toEqual({ a: 1 });
    expect(readStoredJson('cdc-test', z.object({ a: z.string() }))).toBeNull();
    localStorage.setItem('cdc-test', '{');
    expect(readStoredJson('cdc-test', z.unknown())).toBeNull();
  });

  it('loses only the value when the storage is full or blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(() => writeStored(StorageKey.coach, 2)).not.toThrow();
  });
});
