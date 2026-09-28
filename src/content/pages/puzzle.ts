import type { Color } from '#shared/chess/types.ts';
import { queryOne, setData, setDataText } from '#shared/dom.ts';
import type { Feature } from '#shared/features.ts';
import { onEveryTick } from '#content/sync-loop.ts';

// Lichess's eval bar drawn like the Game Review's
// (styles/board/coordinates.css), and the puzzle's session chips.

export interface GaugeScore {
  /** Short: "1.2", "M3", or '' when there's no score. */
  readonly label: string;
  readonly lead: Color;
}

// Lichess writes a negative score with a minus sign (U+2212), or a hyphen.
const MINUS = '\u2212';

/** The score of the engine line's pearl ("+1.2", "#-3"). */
export function gaugeScore(pearl: string): GaugeScore {
  const match = /^(#)?([+\-\u2212])?(\d+(?:\.\d+)?)$/.exec(pearl.trim());
  if (!match) return { label: '', lead: 'white' };
  const [, mate, sign, value = ''] = match;
  const lead = sign === '-' || sign === MINUS ? 'black' : 'white';
  return { label: mate ? `M${value}` : value, lead };
}

function syncGauge(main: HTMLElement): void {
  const gauge = queryOne(main, '.eval-gauge', HTMLElement);
  if (!gauge) return;
  const { label, lead } = gaugeScore(main.querySelector('.ceval pearl')?.textContent ?? '');
  setDataText(gauge, 'cdcEval', label);
  setData(gauge, 'cdcLead', lead);
}

/** A sync task for the eval bar's score and the session chips. */
export function createPuzzleSync(): () => void {
  let lastChips = 0;
  // The chips are one sideways-scrolling row: keep the latest in view.
  const syncSession = (main: HTMLElement): void => {
    const session = queryOne(main, '.puzzle__session', HTMLElement);
    const chips = session?.childElementCount ?? 0;
    if (chips === lastChips) return;
    lastChips = chips;
    if (session) session.scrollLeft = session.scrollWidth;
  };
  return () => {
    const main = queryOne(document, 'main.puzzle, main.analyse', HTMLElement);
    if (!main) return;
    syncGauge(main);
    syncSession(main);
  };
}

export const puzzle: Feature = {
  name: 'puzzle',
  start: () => onEveryTick('puzzle', createPuzzleSync()),
};
