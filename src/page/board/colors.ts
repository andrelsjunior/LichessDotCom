// Our colors for Lichess's brushes, as "r,g,b". Keyed by the stroke
// chessground paints with: the brush names don't make it into the svg.

const GREEN = '#15781B';
const RED = '#882020';
const BLUE = '#003088';

// Lichess's default green is our orange, and its yellow our green.
const ARROWS: ReadonlyMap<string, string> = new Map([
  [GREEN, '255,170,0'],
  [RED, '248,85,63'],
  [BLUE, '72,193,249'],
  ['#e68f00', '159,207,63'],
  ['#4a4a4a', '200,200,200'],
  ['#68217a', '170,110,210'],
  ['#ee2080', '238,32,128'],
  ['#ffffff', '255,255,255'],
]);

// Squares start from the red they're highlighted with: the default brush
// takes it, and Lichess's red the orange it frees.
const SQUARES: ReadonlyMap<string, string> = new Map([
  ...ARROWS,
  [GREEN, '235,97,80'],
  [RED, '255,170,0'],
]);

const DEFAULT_ARROW = '255,170,0';
const DEFAULT_SQUARE = '235,97,80';

export const arrowColor = (stroke: string | null): string =>
  ARROWS.get(stroke ?? '') ?? DEFAULT_ARROW;

export const squareColor = (stroke: string | null): string =>
  SQUARES.get(stroke ?? '') ?? DEFAULT_SQUARE;

/** The Game Review's best move, in green. */
export const REVIEW_COLOR = '159,207,63';
/** The engine's move after one played off the game, in Lichess's pale blue. */
export const ENGINE_COLOR = '72,193,249';
