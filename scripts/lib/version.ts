import { execFileSync } from 'node:child_process';
import { BASE_VERSION } from '../../src/manifest.ts';
import { ROOT } from './paths.ts';

/**
 * `<major>.<minor>.<commits>`: every commit on main gets a higher version
 * than the one before, so nobody bumps it by hand.
 */
export function currentVersion(): string {
  try {
    const count = execFileSync('git', ['rev-list', '--count', 'HEAD'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return `${BASE_VERSION}.${count.trim()}`;
  } catch {
    return `${BASE_VERSION}.0`;
  }
}
