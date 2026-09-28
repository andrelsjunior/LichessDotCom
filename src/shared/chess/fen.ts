import { squareAt } from './squares.ts';
import type { Color, Piece, Role, Square } from './types.ts';

const ROLE_BY_LETTER: Readonly<Record<string, Role>> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

/** The pieces of a FEN's placement field ("rnbqkbnr/pppppppp/8/…"). */
export function parsePlacement(placement: string): Map<Square, Piece> {
  const board = new Map<Square, Piece>();
  for (const [i, row] of placement.split('/').entries()) {
    let file = 0;
    for (const char of row) {
      if (/\d/.test(char)) {
        file += Number(char);
        continue;
      }
      const role = ROLE_BY_LETTER[char.toLowerCase()];
      const square = squareAt(file, 7 - i);
      if (role && square)
        board.set(square, { color: char === char.toUpperCase() ? 'white' : 'black', role });
      file++;
    }
  }
  return board;
}

export interface Position {
  readonly board: Map<Square, Piece>;
  readonly turn: Color;
}

export function parseFen(fen: string): Position {
  const [placement = '', turn] = fen.split(' ');
  return { board: parsePlacement(placement), turn: turn === 'b' ? 'black' : 'white' };
}

/** The side to move, from a FEN. */
export const fenTurn = (fen: string): Color => (fen.split(' ')[1] === 'b' ? 'black' : 'white');
