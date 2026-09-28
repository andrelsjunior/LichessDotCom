// Prints the version this commit gets, for the CI: node scripts/version.ts
//
// Unlike a build, it fails rather than guess: a shallow clone counts too few
// commits, and without git there's nothing to count.

import { execFileSync } from 'node:child_process';
import { ROOT } from '#scripts/lib/paths.ts';
import { currentVersion } from '#scripts/lib/version.ts';

const shallow = execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
  cwd: ROOT,
  encoding: 'utf8',
}).trim();
if (shallow !== 'false') {
  console.error('A shallow clone: fetch the whole history (fetch-depth: 0) to count the commits.');
  process.exit(1);
}
console.log(currentVersion());
