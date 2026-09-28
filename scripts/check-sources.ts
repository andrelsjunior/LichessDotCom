// Rules the linters can't express, checked over every source file:
// - no type assertion of any kind, const assertions included (oxlint allows those),
// - no comment that switches a check off,
// - stylesheets short enough to read, and no asset loaded from another site.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fromRoot, ROOT } from './lib/paths.ts';

const MAX_CSS_LINES = 400;
// Lichess's own assets are fine: they're the page's.
const REMOTE_URL = /url\(\s*['"]?https?:\/\/(?!lichess1?\.org\/)/;

interface Rule {
  readonly files: RegExp;
  readonly check: (text: string) => string | null;
}

const RULES: readonly Rule[] = [
  {
    files: /\.ts$/,
    check: text =>
      /\bas\s+const\b/.test(text) ? 'uses a const assertion: annotate the type instead' : null,
  },
  {
    files: /\.ts$/,
    check: text =>
      /@ts-(ignore|expect-error|nocheck)|(oxlint|eslint)-disable/.test(text)
        ? 'switches a check off with a comment'
        : null,
  },
  {
    files: /\.css$/,
    check: text => {
      const lines = text.split('\n').length - 1;
      return lines > MAX_CSS_LINES ? `has ${lines} lines (at most ${MAX_CSS_LINES})` : null;
    },
  },
  {
    files: /\.css$/,
    check: text => (REMOTE_URL.test(text) ? 'loads an asset from another site: bundle it' : null),
  },
];

const DIRS = ['src', 'scripts', 'tests'];

async function files(dir: string): Promise<string[]> {
  const entries = await readdir(fromRoot(dir), { recursive: true, withFileTypes: true });
  return entries
    .filter(entry => entry.isFile())
    .map(entry => path.relative(ROOT, path.join(entry.parentPath, entry.name)));
}

const problems: string[] = [];
for (const file of (await Promise.all(DIRS.map(files))).flat()) {
  const rules = RULES.filter(rule => rule.files.test(file));
  if (rules.length === 0) continue;
  const text = await readFile(fromRoot(file), 'utf8');
  for (const rule of rules) {
    const problem = rule.check(text);
    if (problem !== null) problems.push(`${file} ${problem}`);
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}
console.log('Sources check out.');
