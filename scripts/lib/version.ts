import { execFileSync } from 'node:child_process';
import { BASE_VERSION } from '#manifest';
import { ROOT } from './paths.ts';

const git = (args: readonly string[], cwd: string): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

/**
 * `<major>.<minor>.<commits>`: every commit on main gets a higher version
 * than the one before, so nobody bumps it by hand. Good enough for a dev
 * build, which gets `.0` without git.
 */
export function currentVersion(cwd: string = ROOT): string {
  try {
    return `${BASE_VERSION}.${git(['rev-list', '--count', 'HEAD'], cwd)}`;
  } catch {
    return `${BASE_VERSION}.0`;
  }
}

/**
 * The same, for a release, which must not guess: a shallow clone counts too
 * few commits, and without git there's nothing to count.
 */
export function releaseVersion(cwd: string = ROOT): string {
  let shallow: string;
  try {
    shallow = git(['rev-parse', '--is-shallow-repository'], cwd);
  } catch (error) {
    throw new Error('no git history to count the commits', { cause: error });
  }
  if (shallow !== 'false') {
    throw new Error('a shallow clone counts too few commits: fetch the whole history');
  }
  return `${BASE_VERSION}.${git(['rev-list', '--count', 'HEAD'], cwd)}`;
}
