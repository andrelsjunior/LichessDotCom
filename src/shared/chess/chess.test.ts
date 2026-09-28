import { describe, expect, it } from 'vitest';
import {
  attackers,
  isAttacked,
  parseFen,
  parsePlacement,
  parseSquare,
  squareAt,
  squareCoords,
} from './index.ts';

describe('squares', () => {
  it('maps coordinates to names and back', () => {
    expect(squareAt(0, 0)).toBe('a1');
    expect(squareAt(7, 7)).toBe('h8');
    expect(squareAt(8, 0)).toBeNull();
    expect(squareAt(0, -1)).toBeNull();
    expect(squareCoords('e4')).toEqual([4, 3]);
    expect(parseSquare('e2e4')).toBe('e2');
    expect(parseSquare('z9')).toBeNull();
  });
});

describe('parseFen', () => {
  it('reads the placement and the side to move', () => {
    const { board, turn } = parseFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
    expect(turn).toBe('black');
    expect(board.size).toBe(32);
    expect(board.get('e4')).toEqual({ color: 'white', role: 'pawn' });
    expect(board.get('e2')).toBeUndefined();
    expect(board.get('d8')).toEqual({ color: 'black', role: 'queen' });
  });
});

describe('attackers', () => {
  it('finds pawns on the side they capture from', () => {
    const board = parsePlacement('8/8/8/3p4/4P3/8/8/8');
    expect(attackers(board, 'd5', 'white')).toEqual(['pawn']);
    expect(attackers(board, 'e4', 'black')).toEqual(['pawn']);
    expect(attackers(board, 'e5', 'white')).toEqual([]);
  });

  it('stops sliders at the first piece in the way', () => {
    const board = parsePlacement('4k3/8/8/8/4p3/8/8/4R3');
    expect(attackers(board, 'e4', 'white')).toEqual(['rook']);
    expect(isAttacked(board, 'e8', 'white')).toBe(false);
  });

  it('counts knights, kings and queens', () => {
    const board = parsePlacement('8/8/8/8/3N4/8/4K3/Q7');
    expect(attackers(board, 'e6', 'white')).toEqual(['knight']);
    expect(attackers(board, 'd1', 'white').toSorted()).toEqual(['king', 'queen']);
    expect(attackers(board, 'd3', 'white')).toEqual(['king']);
  });
});
