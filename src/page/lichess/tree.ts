import { z } from 'zod/mini';
import { createGuard } from '#shared/guards.ts';

// A node of Lichess's analysis tree (ui/lib/src/tree). Only the fields we read.
const TreeNodeSchema = z.object({
  id: z.string(),
  ply: z.number(),
  fen: z.string(),
  uci: z.optional(z.string()),
  san: z.optional(z.string()),
  // Set on the engine's lines in the move list ("computer" variations).
  comp: z.optional(z.boolean()),
  children: z.array(z.unknown()),
});

export type TreeNode = z.infer<typeof TreeNodeSchema>;

export const isTreeNode = createGuard(TreeNodeSchema);

/** The node's first child: the next move on its line. */
export function firstChild(node: TreeNode): TreeNode | null {
  const child = node.children[0];
  return isTreeNode(child) ? child : null;
}
