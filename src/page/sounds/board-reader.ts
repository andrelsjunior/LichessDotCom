import { COLORS, ROLES } from '#shared/chess/types.ts';
import type { Color, Piece, Square } from '#shared/chess/types.ts';
import { queryAll, queryOne } from '#shared/dom.ts';
import { cgKey } from '#page/lichess/chessground.ts';

// The main board as chessground draws it: its pieces and highlighted squares.

export interface BoardState {
  readonly pieces: Map<Square, Piece>;
  readonly lastMove: readonly Square[];
}

export const mainBoardWrap = (): HTMLElement | null =>
  queryOne(document, '.main-board .cg-wrap', HTMLElement) ??
  queryOne(document, '.cg-wrap', HTMLElement);

export const boardOrientation = (): Color =>
  mainBoardWrap()?.classList.contains('orientation-black') ? 'black' : 'white';

export const mainCgBoard = (): Element | null => mainBoardWrap()?.querySelector('cg-board') ?? null;

// A ghost marks a dragged piece's square, and a fading piece is one just taken.
function readPiece(element: Element): Piece | null {
  const { classList } = element;
  if (classList.contains('ghost') || classList.contains('fading')) return null;
  const color = COLORS.find(name => classList.contains(name));
  const role = ROLES.find(name => classList.contains(name));
  return color && role ? { color, role } : null;
}

const isKeyed = (square: Square | null): square is Square => square !== null;

/** The squares chessground marks with `className` (`current-premove`, `selected`…). */
export const markedSquares = (board: Element, className: string): Square[] =>
  queryAll(board, `square.${className}`, Element).map(cgKey).filter(isKeyed);

export function readBoard(wrap: Element | null): BoardState | null {
  const board = wrap?.querySelector('cg-board');
  if (!board) return null;
  const pieces = new Map<Square, Piece>();
  for (const element of board.children) {
    if (element.tagName !== 'PIECE') continue;
    const square = cgKey(element);
    const piece = square && readPiece(element);
    if (square && piece) pieces.set(square, piece);
  }
  return { pieces, lastMove: markedSquares(board, 'last-move') };
}
