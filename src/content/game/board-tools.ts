import { closestTo, createElement, queryOne, setData } from '#shared/dom.ts';
import type { Feature } from '#shared/features.ts';
import { onEveryTick } from '#content/sync-loop.ts';
import { nonEmpty } from '#content/ui/text.ts';

// The game page's board tools (styles/game.css): a cog right of the board's
// top corner, and under it a flip button that shows while the pointer is on
// the board. They press Lichess's own keys: `h` for its board menu (game.css
// hides its button), `f` to flip.

const HOVER = 'cdc-board-tools--hover';

interface BoardTools {
  readonly root: HTMLElement;
  readonly menu: HTMLButtonElement;
  readonly flip: HTMLButtonElement;
}

function toolButton(name: string, key: string): HTMLButtonElement {
  const button = createElement('button', {
    attrs: { type: 'button', class: `cdc-board-tools__btn cdc-board-tools__btn--${name}` },
  });
  button.addEventListener('click', () =>
    button.dispatchEvent(new KeyboardEvent('keypress', { key, bubbles: true })),
  );
  return button;
}

function buildTools(): BoardTools {
  const root = createElement('div', { className: 'cdc-board-tools' });
  const menu = toolButton('menu', 'h');
  const flip = toolButton('flip', 'f');
  root.append(menu, flip);
  return { root, menu, flip };
}

function setTip(button: HTMLButtonElement, label: string | undefined): void {
  if (!label || button.dataset.cdcTip === label) return;
  setData(button, 'cdcTip', label);
  button.setAttribute('aria-label', label);
}

let tools: BoardTools | null = null;

function toolsIn(main: HTMLElement): BoardTools {
  if (tools?.root.parentNode === main) return tools;
  tools = buildTools();
  main.append(tools.root);
  return tools;
}

export function syncBoardTools(): void {
  const main = queryOne(document, 'main.round', HTMLElement);
  if (!main) return;
  const { menu, flip } = toolsIn(main);
  // Our tooltips move a hovered button's title to data-cdc-tip.
  const lichessMenu = queryOne(main, '.board-menu-toggle-btn', HTMLElement);
  setTip(menu, nonEmpty(lichessMenu?.title) ?? lichessMenu?.dataset.cdcTip);
  setTip(flip, document.documentElement.dataset.cdcFlipLabel);
  menu.classList.toggle(
    'cdc-board-tools__btn--on',
    lichessMenu?.classList.contains('active') ?? false,
  );
}

function onMouseOver(event: MouseEvent): void {
  if (!tools?.root.isConnected) return;
  const target = closestTo(
    event.target,
    'main.round :is(.round__app__board, .cdc-board-tools)',
    Element,
  );
  tools.root.classList.toggle(HOVER, target !== null);
}

// Leaving the window.
function onMouseOut(event: MouseEvent): void {
  if (!event.relatedTarget) tools?.root.classList.toggle(HOVER, false);
}

export const boardTools: Feature = {
  name: 'board tools',
  start: () => {
    onEveryTick('board tools', syncBoardTools);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
  },
};
