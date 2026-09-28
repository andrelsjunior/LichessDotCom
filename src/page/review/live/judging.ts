import type { Analysis } from '#page/lichess/analysis.ts';
import type { TreeNode } from '#page/lichess/tree.ts';
import { formatEval } from '#page/review/evaluation/format.ts';
import { judge } from '#page/review/judge/judge.ts';
import type { PlayedPosition } from '#page/review/judge/types.ts';
import type { BookEntry, LiveState, ReviewMove } from '#page/review/session.ts';

// The free board's tree grows as the user plays: every position is analyzed
// once, by FEN, and every move judged from its two positions once they're in.

/** Deeper than this, no move is "book". */
export const BOOK_PLIES = 30;
/** Master games a position needs to be "book". */
export const BOOK_GAMES = 10;

/**
 * Whether the move to `path` is a book move: every move up to it is played
 * in master games. Undefined while that's still being looked up.
 */
export function bookAt(live: LiveState, analysis: Analysis, path: string): boolean | undefined {
  let book: boolean | undefined = true;
  for (let i = 2; i <= path.length && book === true; i += 2) {
    const node = analysis.nodeAtPath(path.slice(0, i));
    if (live.noBook || node.ply > BOOK_PLIES) return false;
    book = live.books.get(node.fen)?.book;
  }
  return book;
}

/** The last named opening along `path`: a move out of the book keeps the line's name. */
export function openingAt(live: LiveState, analysis: Analysis, path: string): BookEntry | null {
  for (let at = path; at; at = at.slice(0, -2)) {
    const entry = live.books.get(analysis.nodeAtPath(at).fen);
    if (entry?.name) return entry;
  }
  return null;
}

/** A node reached by a move: every node but the root. */
export const isPlayed = (node: TreeNode): node is TreeNode & PlayedPosition =>
  node.uci !== undefined && node.san !== undefined;

function judgeNode(live: LiveState, analysis: Analysis, path: string): ReviewMove | null {
  const node = analysis.nodeAtPath(path);
  const up = path.slice(0, -2);
  const previous = analysis.nodeAtPath(up);
  const before = live.evals.get(previous.fen);
  const after = live.evals.get(node.fen);
  const book = bookAt(live, analysis, path);
  if (!before || !after || book === undefined || !isPlayed(node)) return null;
  const move = judge({
    previousPosition: previous,
    position: node,
    before,
    after,
    previousMove: judgeAt(live, analysis, up),
    book,
    chess960: analysis.chess960,
  });
  return { ...move, opening: openingAt(live, analysis, path)?.name ?? '' };
}

/** The move to `path`, judged, or null until its positions are analyzed. */
export function judgeAt(live: LiveState, analysis: Analysis, path: string): ReviewMove | null {
  if (!path) return null;
  const node = analysis.nodeAtPath(path);
  // A stale path, which Lichess answers with the deepest node it found.
  if (node.id !== path.slice(-2)) return null;
  const hit = live.judged.get(path);
  if (hit?.node === node) return hit.move;
  const move = judgeNode(live, analysis, path);
  live.judged.set(path, { node, move });
  return move;
}

/** What the coach's bubble shows of a move, to draw it again only when that changes. */
export function liveDigest(move: ReviewMove | null): string {
  if (!move) return '';
  return [
    move.cls,
    formatEval(move.after),
    move.after.best ?? '',
    move.best ?? '',
    move.opening ?? '',
    move.previousMove?.cls ?? '',
  ].join(',');
}
