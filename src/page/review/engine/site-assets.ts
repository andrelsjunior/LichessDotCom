import { z } from 'zod/mini';
import { createGuard } from '#shared/guards.ts';
import { readSite } from '#page/lichess/globals.ts';

// Lichess's asset helper, `site.asset.url`: where its own files (the engine,
// its networks) are served from.

const AssetOptionsSchema = z.object({ documentOrigin: z.boolean() });

const SiteAssetsSchema = z.object({
  asset: z.object({
    url: z.function({ input: [z.string(), z.optional(AssetOptionsSchema)], output: z.string() }),
  }),
});

const hasAssets = createGuard(SiteAssetsSchema);

export type AssetOptions = z.infer<typeof AssetOptionsSchema>;

/** The URL of one of Lichess's assets; throws on a page without the helper. */
export function assetUrl(path: string, options?: AssetOptions): string {
  const site = readSite();
  if (!hasAssets(site)) throw new Error('Lichess’s asset helper is missing');
  return options ? site.asset.url(path, options) : site.asset.url(path);
}
