import type { Color } from '#shared/chess/index.ts';
import type { MoveClass } from '#page/review/classes/classes.ts';

// The summary's figures, over the moves judged so far.

interface JudgedMove {
  readonly color: Color;
  readonly cls: MoveClass;
  readonly accuracy: number;
}

/**
 * A player's accuracy: the mean of the arithmetic and harmonic means of
 * their moves', so a few bad moves weigh more than an average would give.
 */
export function playerAccuracy(moves: readonly JudgedMove[], color: Color): number | null {
  const accuracies = moves.filter(move => move.color === color).map(move => move.accuracy);
  if (accuracies.length === 0) return null;
  const mean = accuracies.reduce((sum, accuracy) => sum + accuracy, 0) / accuracies.length;
  const harmonic =
    accuracies.length / accuracies.reduce((sum, accuracy) => sum + 1 / Math.max(accuracy, 1), 0);
  return (mean + harmonic) / 2;
}

export type ClassCounts = Record<Color, Partial<Record<MoveClass, number>>>;

/** How many moves of each class each player made. */
export function classCounts(moves: readonly JudgedMove[]): ClassCounts {
  const counts: ClassCounts = { white: {}, black: {} };
  for (const { color, cls } of moves) counts[color][cls] = (counts[color][cls] ?? 0) + 1;
  return counts;
}
