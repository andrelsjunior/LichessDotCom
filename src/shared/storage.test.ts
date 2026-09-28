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

const AREAS = ['localStorage', 'sessionStorage'];
const originals = new Map(AREAS.map(name => [name, Object.getOwnPropertyDescriptor(window, name)]));

// Chrome blocks site data by throwing from the storage getters themselves.
function blockStorage(): void {
  for (const name of AREAS) {
    Object.defineProperty(window, name, {
      configurable: true,
      get: () => {
        throw new DOMException('denied', 'SecurityError');
      },
    });
  }
}

afterEach(() => {
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(window, name, descriptor);
    else Reflect.deleteProperty(window, name);
  }
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

  it('loses only the value when the storage is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(() => writeStored(StorageKey.coach, 2)).not.toThrow();
  });

  it('writes and removes quietly on a blocked storage, but reads throw', () => {
    blockStorage();
    expect(() => writeStored(StorageKey.coach, 2)).not.toThrow();
    expect(() => writeStoredJson('cdc-test', { a: 1 }, 'session')).not.toThrow();
    expect(() => removeStored(StorageKey.coach)).not.toThrow();
    // Read as missing, a once-per-game check could never hold there.
    expect(() => readStored(StorageKey.coach, z.string())).toThrow('denied');
    expect(() => readStoredJson('cdc-test', z.unknown(), 'session')).toThrow('denied');
  });
});
