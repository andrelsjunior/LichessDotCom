// Release builds of every target, zipped into dist/ for the GitHub release
// and the stores, plus the sources Firefox Add-ons' reviewers rebuild the
// Firefox zip from.
//
//   node scripts/package.ts [--version x.y.z]

import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { buildTarget, TARGETS } from '#scripts/lib/build-target.ts';
import {
  isPackageName,
  listPackageFiles,
  listSourceFiles,
  packageName,
  type PackageKind,
} from '#scripts/lib/package-files.ts';
import { fromRoot, ROOT } from '#scripts/lib/paths.ts';
import { currentVersion } from '#scripts/lib/version.ts';
import { createZip, type ZipEntry } from '#scripts/lib/zip.ts';

const { values } = parseArgs({ options: { version: { type: 'string' } } });
const version = values.version ?? currentVersion();
const DIST = fromRoot('dist');

function readEntries(dir: string, files: readonly string[]): Promise<ZipEntry[]> {
  return Promise.all(
    files.map(async file => ({ path: file, data: await readFile(path.join(dir, file)) })),
  );
}

async function writePackage(kind: PackageKind, entries: readonly ZipEntry[]): Promise<void> {
  const file = path.join(DIST, packageName(kind, version));
  const zip = createZip(entries);
  await writeFile(file, zip);
  const size = (zip.length / 1024 / 1024).toFixed(1);
  console.log(`  ${path.relative(ROOT, file)}  ${entries.length} files, ${size} MB`);
}

// An older version's zips would otherwise go out with this one's.
async function removeOldPackages(): Promise<void> {
  await mkdir(DIST, { recursive: true });
  const old = (await readdir(DIST)).filter(isPackageName);
  await Promise.all(old.map(name => rm(path.join(DIST, name))));
}

const started = performance.now();
await removeOldPackages();
for (const target of TARGETS) {
  const out = path.join(DIST, target);
  await buildTarget({ target, out, version, release: true });
  await writePackage(target, await readEntries(out, await listPackageFiles(out)));
}
await writePackage('source', await readEntries(ROOT, listSourceFiles()));
console.log(`Packaged ${version} in ${Math.round(performance.now() - started)} ms`);
