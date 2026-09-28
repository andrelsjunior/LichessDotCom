import { COLORS, ROLES, type Color, type Piece } from '#shared/chess/types.ts';

// Chessground's board as its classes say, readable from either world. The
// square a piece stands on is a property chessground's script sets, which
// only the page world sees (#page/lichess/chessground.ts).

/** The side at the bottom of a board's `.cg-wrap`. */
export const wrapOrientation = (wrap: Element): Color =>
  wrap.classList.contains('orientation-black') ? 'black' : 'white';

/** The piece a `piece` element shows, or null for one that isn't on the board. */
export function pieceOf(element: Element): Piece | null {
  const { classList } = element;
  // A ghost marks a dragged piece's square, and a fading piece is one just taken.
  if (classList.contains('ghost') || classList.contains('fading')) return null;
  const color = COLORS.find(name => classList.contains(name));
  const role = ROLES.find(name => classList.contains(name));
  return color && role ? { color, role } : null;
}
