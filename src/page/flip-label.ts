import { isParsing, setData } from '#shared/dom.ts';
import type { Feature } from '#shared/features.ts';
import { translate } from '#page/lichess/globals.ts';

// The game page's flip button (content script) is labelled in Lichess's
// words, which only the page world can read: copied onto <html>.

const RETRY_MS = 250;
const GIVE_UP_MS = 30_000;

function shareFlipLabel(started: number): void {
  const label = translate('flipBoard', '');
  if (label) {
    setData(document.documentElement, 'cdcFlipLabel', label);
    return;
  }
  // The translations may still be on their way to a game page.
  const mayCome = isParsing() || document.querySelector('main.round') !== null;
  if (mayCome && Date.now() - started < GIVE_UP_MS) {
    setTimeout(() => shareFlipLabel(started), RETRY_MS);
  }
}

export const flipLabel: Feature = {
  name: 'flip label',
  start: () => shareFlipLabel(Date.now()),
};
