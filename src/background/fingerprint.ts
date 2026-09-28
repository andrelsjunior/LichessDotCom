import { z } from 'zod/mini';

// A digest of the code the extension loads, read back from its own folder: it
// changes when a ship rewrites the files Chrome loads unpacked.

const RunningManifestSchema = z.object({
  background: z.optional(
    z.object({
      service_worker: z.optional(z.string()),
      scripts: z.optional(z.array(z.string())),
    }),
  ),
  content_scripts: z.optional(
    z.array(
      z.object({
        css: z.optional(z.array(z.string())),
        js: z.optional(z.array(z.string())),
      }),
    ),
  ),
});

/** The manifest and every script and stylesheet it names. */
export function loadedFiles(manifest: unknown): string[] {
  const { background, content_scripts: contentScripts = [] } =
    RunningManifestSchema.parse(manifest);
  // A service worker in Chrome, background scripts in Firefox.
  const worker = background?.service_worker;
  const workers = background?.scripts ?? (worker === undefined ? [] : [worker]);
  const pageFiles = contentScripts.flatMap(script => (script.css ?? []).concat(script.js ?? []));
  return ['manifest.json', ...workers, ...pageFiles];
}

export async function digest(texts: readonly string[]): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(texts.join('\0')));
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

// A file that can't be fetched counts as empty.
const readText = (path: string): Promise<string> =>
  fetch(chrome.runtime.getURL(path), { cache: 'no-store' }).then(
    response => response.text(),
    () => '',
  );

export async function fingerprint(): Promise<string> {
  const files = loadedFiles(chrome.runtime.getManifest());
  return digest(await Promise.all(files.map(readText)));
}
