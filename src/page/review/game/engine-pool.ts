import type { Analysis } from '#page/lichess/analysis.ts';
import { Stockfish } from '#page/review/engine/stockfish.ts';
import type { LiveState } from '#page/review/session.ts';

/**
 * One engine for the page, booted once: the game's analysis and the moves
 * played off it share it, one position at a time. A failed boot stays failed.
 */
export function engineFor(live: LiveState, analysis: Analysis): Promise<Stockfish> {
  live.booting ??= (async () => {
    const engine = new Stockfish({ chess960: analysis.chess960 });
    await engine.boot();
    return engine;
  })();
  return live.booting;
}
