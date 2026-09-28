import { opposite, type Color } from '#shared/chess/types.ts';
import { queryOne } from '#shared/dom.ts';
import type { Feature } from '#shared/features.ts';
import { onEveryTick } from '#content/sync-loop.ts';
import { createOwnedElement } from '#content/ui/owned-element.ts';
import { fillPlayerBar } from './player-bar.ts';

// The analysis board's player bars, like the game page's. Lichess names the
// players only in the game info, which analysis.css hides, so each one is
// copied into a bar of ours.

/** A sync task keeping the two bars in step with the game info and the board's orientation. */
export function createPlayersSync(): () => void {
  const topBar = createOwnedElement('cdc-player cdc-player--top');
  const bottomBar = createOwnedElement('cdc-player cdc-player--bottom');
  let lastKey = '';
  return () => {
    const main = queryOne(document, 'main.analyse', HTMLElement);
    const wrap = main && queryOne(main, '.analyse__board > .cg-wrap', Element);
    const meta = main && queryOne(main, '.game__meta__players', Element);
    if (!main || !wrap || !meta || main.querySelector('.practice__side')) return;
    const top = topBar(main);
    const bottom = bottomBar(main);
    if (top.isNew || bottom.isNew) lastKey = '';
    // Flipping the board swaps them.
    const bottomColor: Color = wrap.classList.contains('orientation-black') ? 'black' : 'white';
    const key = bottomColor + meta.innerHTML;
    if (key === lastKey) return;
    lastKey = key;
    fillPlayerBar(top.element, meta.querySelector(`.player.${opposite(bottomColor)}`));
    fillPlayerBar(bottom.element, meta.querySelector(`.player.${bottomColor}`));
  };
}

export const analysisPlayers: Feature = {
  name: 'analysis players',
  start: () => onEveryTick('analysis players', createPlayersSync()),
};
