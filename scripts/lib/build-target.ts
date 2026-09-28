import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'rolldown';
import { createManifest, ManifestSchema, OUTPUT, type Target } from '../../src/manifest.ts';
import { bundleCss } from './css-bundle.ts';
import { assertNoChromeUrls, toFirefoxCss } from './firefox.ts';
import { fromRoot } from './paths.ts';

export const TARGETS: readonly Target[] = ['chrome', 'chrome-store', 'firefox'];

const SCRIPTS = [
  { input: 'src/background/index.ts', output: OUTPUT.background },
  { input: 'src/content/index.ts', output: OUTPUT.content },
  { input: 'src/page/index.ts', output: OUTPUT.page },
];

// Third-party code bundled into the scripts ships with its license.
const LICENSES = [{ from: 'node_modules/lottie-web/LICENSE.md', to: 'licenses/lottie-web.md' }];

export interface BuildOptions {
  readonly target: Target;
  readonly out: string;
  readonly version: string;
  /** No source maps: what the stores get. */
  readonly release: boolean;
}

async function bundleScripts({ out, release }: BuildOptions): Promise<void> {
  await Promise.all(
    SCRIPTS.map(({ input, output }) =>
      build({
        input: fromRoot(input),
        platform: 'browser',
        logLevel: 'warn',
        output: { file: path.join(out, output), format: 'iife', sourcemap: !release },
      }),
    ),
  );
}

async function bundleStyles({ target, out }: BuildOptions): Promise<void> {
  const css = await bundleCss(fromRoot('src/styles/index.css'));
  await writeFile(path.join(out, OUTPUT.styles), target === 'firefox' ? toFirefoxCss(css) : css);
}

async function checkFirefoxBuild(out: string): Promise<void> {
  const files = new Map<string, string>();
  for (const name of Object.values(OUTPUT)) {
    files.set(name, await readFile(path.join(out, name), 'utf8'));
  }
  assertNoChromeUrls(files);
}

/** Builds one target into `out`, from scratch. */
export async function buildTarget(options: BuildOptions): Promise<void> {
  const { target, out, version } = options;
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await cp(fromRoot('public'), out, { recursive: true });
  for (const { from, to } of LICENSES) await cp(fromRoot(from), path.join(out, to));
  await Promise.all([bundleScripts(options), bundleStyles(options)]);
  const manifest = ManifestSchema.parse(createManifest(target, version));
  await writeFile(path.join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  if (target === 'firefox') await checkFirefoxBuild(out);
}
