import { z } from 'zod/mini';
import { createGuard } from '../../shared/guards.ts';
import { readSite } from './globals.ts';
import { isTreeNode, type TreeNode } from './tree.ts';

// Lichess's analysis controller (ui/analyse/src/ctrl.ts), `site.analysis` on
// analysis pages only. Only what the extension uses is described here.

const SiteSchema = z.object({ analysis: z.object({ node: z.unknown() }) });
const hasAnalysis = createGuard(SiteSchema);

/** The raw controller, if this page has one. */
export function analysisController(): { readonly node: unknown } | null {
  const site = readSite();
  return hasAnalysis(site) ? site.analysis : null;
}

/** The node on the board, if this page has an analysis controller. */
export function currentNode(): TreeNode | null {
  const node = analysisController()?.node;
  return isTreeNode(node) ? node : null;
}
