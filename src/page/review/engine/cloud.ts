import { z } from 'zod/mini';
import { normalizeUci } from '#page/review/chess/notation.ts';
import type { EngineLine, EngineResult } from './uci.ts';

// Lichess's cloud evaluations (/api/cloud-eval?fen=…&multiPv=2): positions
// someone already analyzed deep, which in a game means its opening.

const CloudLineSchema = z.union([
  z.object({ moves: z.string(), mate: z.number() }),
  z.object({ moves: z.string(), cp: z.number() }),
]);

export const CloudEvalSchema = z.object({ pvs: z.optional(z.array(CloudLineSchema)) });
export type CloudEval = z.infer<typeof CloudEvalSchema>;

/**
 * The cloud's lines as the engine's: scored from the side to move's view,
 * castling as the king's two-square step. Null when it has none (a miss).
 */
export function fromCloud(fen: string, cloud: CloudEval): EngineResult | null {
  if (!cloud.pvs?.length) return null;
  // The cloud's scores are from White's view, its castling king takes rook.
  const sign = fen.split(' ')[1] === 'w' ? 1 : -1;
  const lines = cloud.pvs.map((line): EngineLine => {
    const pv = line.moves.split(' ').map(uci => normalizeUci(uci, false));
    return 'mate' in line ? { mate: line.mate * sign, pv } : { cp: line.cp * sign, pv };
  });
  return { lines };
}
