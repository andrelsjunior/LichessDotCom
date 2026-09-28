// Prints the version this commit gets, for the CI: node scripts/version.ts
//
// Unlike a dev build, it fails rather than guess: a shallow clone counts too
// few commits, and without git there's nothing to count.

import { releaseVersion } from './lib/version.ts';

console.log(releaseVersion());
