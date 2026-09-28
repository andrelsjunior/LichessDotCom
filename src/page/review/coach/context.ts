import type { ReviewLanguage } from '#page/review/i18n/types.ts';
import type { MoveReview } from '#page/review/judge/types.ts';

/** Who comments on which game: the picks hash both, so each coach words things their own way. */
export interface CoachContext {
  /** Lichess's game id (`synthetic` on the free analysis board). */
  readonly gameId: string;
  /** The coach's number, 1 to COACH_COUNT. */
  readonly coach: number;
  readonly language: ReviewLanguage;
}

/** The seed of a move's picks: stable across redraws. */
export const moveSeed = (move: MoveReview, { gameId, coach }: CoachContext): string =>
  `${gameId}:${move.ply}:${move.uci}:${coach}`;
