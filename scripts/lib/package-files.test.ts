import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  isPackageName,
  isPackaged,
  listPackageFiles,
  packageName,
  selectSourceFiles,
} from './package-files.ts';

const fixtures: string[] = [];

async function fixture(files: readonly string[]): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'cdc-package-'));
  fixtures.push(dir);
  for (const name of files) {
    await mkdir(path.dirname(path.join(dir, name)), { recursive: true });
    await writeFile(path.join(dir, name), name);
  }
  return dir;
}

afterAll(async () => {
  await Promise.all(fixtures.map(dir => rm(dir, { recursive: true, force: true })));
});

describe('packageName', () => {
  it('keeps the names the releases have always had', () => {
    expect(packageName('chrome', '0.1.295')).toBe('LichessDotCom-v0.1.295.zip');
    expect(packageName('chrome-store', '0.1.295')).toBe('LichessDotCom-v0.1.295-store.zip');
    expect(packageName('firefox', '0.1.295')).toBe('LichessDotCom-v0.1.295-firefox.zip');
    expect(packageName('source', '0.1.295')).toBe('LichessDotCom-v0.1.295-source.zip');
  });

  it('recognizes its own names only', () => {
    expect(isPackageName(packageName('firefox', '0.1.3'))).toBe(true);
    expect(isPackageName('LichessDotCom-v0.1.3.zip')).toBe(true);
    expect(isPackageName('notes.zip')).toBe(false);
    expect(isPackageName('LichessDotCom-v0.1.3.zip.part')).toBe(false);
  });
});

describe('isPackaged', () => {
  it('leaves out source maps and desktop litter', () => {
    expect(isPackaged('content.js')).toBe(true);
    expect(isPackaged('content.js.map')).toBe(false);
    expect(isPackaged('img/.DS_Store')).toBe(false);
    expect(isPackaged('.DS_Store')).toBe(false);
    expect(isPackaged('img/Thumbs.db')).toBe(false);
    expect(isPackaged('sitemap.json')).toBe(true);
  });
});

describe('listPackageFiles', () => {
  it('lists every file below the folder, sorted, with forward slashes', async () => {
    const dir = await fixture([
      'manifest.json',
      'content.js',
      'content.js.map',
      'img/pieces/neo/wp.webp',
      'img/boards/green.webp',
      'img/.DS_Store',
      '_locales/en/messages.json',
    ]);
    expect(await listPackageFiles(dir)).toEqual([
      '_locales/en/messages.json',
      'content.js',
      'img/boards/green.webp',
      'img/pieces/neo/wp.webp',
      'manifest.json',
    ]);
  });
});

describe('selectSourceFiles', () => {
  it('keeps the listed files that exist, once each, sorted', () => {
    const listing = ['src/b.ts', 'README.md', 'src/deleted.ts', 'src/a.ts', 'README.md', ''].join(
      '\0',
    );
    expect(selectSourceFiles(listing, file => file !== 'src/deleted.ts')).toEqual([
      'README.md',
      'src/a.ts',
      'src/b.ts',
    ]);
  });

  it('keeps a path with spaces or newlines whole', () => {
    expect(selectSourceFiles('a b.txt\0c\nd.txt\0', () => true)).toEqual(['a b.txt', 'c\nd.txt']);
  });
});
