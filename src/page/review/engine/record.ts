import { type PositionRecord, winPercent } from '#page/review/evaluation/score.ts';
import type { EngineLine, EngineResult } from './uci.ts';

type WhiteScore =
  | { readonly cp: number; readonly wp: number }
  | { readonly mate: number; readonly wp: number };

function whiteScore(line: EngineLine, whiteToMove: boolean): WhiteScore {
  const sign = whiteToMove ? 1 : -1;
  if ('mate' in line) {
    // Mate 0: the side to move is mated.
    if (line.mate === 0) return { mate: 0, wp: whiteToMove ? 0 : 100 };
    const mate = line.mate * sign;
    return { mate, wp: mate > 0 ? 100 : 0 };
  }
  const cp = line.cp * sign;
  return { cp, wp: winPercent(cp) };
}

/** One position's engine result, turned into a record from White's view. */
export function toRecord(fen: string, result: EngineResult): PositionRecord {
  const whiteToMove = fen.split(' ')[1] === 'w';
  const [first, second] = result.lines;
  const head = first?.pv[0];
  const best = head === undefined || head === '' ? null : head;
  const wp2 = second ? whiteScore(second, whiteToMove).wp : null;
  // No line at all: stalemate, or no legal move.
  const score = first ? whiteScore(first, whiteToMove) : { cp: 0, wp: 50 };
  // Keys in this order: the cache stores records as they are.
  return 'mate' in score
    ? { mate: score.mate, wp: score.wp, wp2, best }
    : { cp: score.cp, wp: score.wp, wp2, best };
}
