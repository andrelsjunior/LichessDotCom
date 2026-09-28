import { extensionUrl } from '#content/platform/runtime.ts';
import { setData, setStyleProperty } from '#shared/dom.ts';
import { BOARDS, boardPath, PIECE_CODES, PIECE_SETS, piecePath } from './catalog.ts';

// The pick goes on <html> for styles/board.css. The default green board is
// board.css's own drawing, crisper than an image, and the Neo pieces are its
// fallbacks: only the other boards and sets set variables.

type Variables = Readonly<Record<string, string | null>>;

const cssUrl = (path: string): string => `url('${extensionUrl(path)}')`;

/** The board's CSS variables, null for each one to remove. */
export function boardVariables(id: string): Variables {
  const board = BOARDS.find(entry => entry.id === id);
  if (board === undefined || board === BOARDS[0])
    return { '--cdc-board-img': null, '--cdc-sq-light': null, '--cdc-sq-dark': null };
  return {
    '--cdc-board-img': cssUrl(boardPath(board.id)),
    '--cdc-sq-light': board.light,
    '--cdc-sq-dark': board.dark,
  };
}

/** A CSS variable per piece, null for each one to remove. */
export function pieceVariables(id: string): Variables {
  const set = PIECE_SETS.find(entry => entry.id === id);
  const custom = set === PIECE_SETS[0] ? undefined : set;
  return Object.fromEntries(
    PIECE_CODES.map(code => [
      `--cdc-piece-${code}`,
      custom === undefined ? null : cssUrl(piecePath(custom.id, code)),
    ]),
  );
}

function applyVariables(variables: Variables): void {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(variables)) setStyleProperty(root, name, value);
}

export function applyBoard(id: string): void {
  setData(document.documentElement, 'cdcBoard', id);
  applyVariables(boardVariables(id));
}

export function applyPieces(id: string): void {
  setData(document.documentElement, 'cdcPieces', id);
  applyVariables(pieceVariables(id));
}
