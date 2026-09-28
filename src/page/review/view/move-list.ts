import { queryAll, queryOne, setData, setStyleProperty } from '#shared/dom.ts';
import type { Analysis } from '#page/lichess/analysis.ts';
import { firstChild } from '#page/lichess/tree.ts';
import { CLASS_COLORS, LIST_BADGES, type MoveClass } from '#page/review/classes/classes.ts';
import { classImage } from '#page/review/classes/icon-svg.ts';
import { bookAt, judgeAt } from '#page/review/live/judging.ts';
import type { LiveState, Review } from '#page/review/session.ts';

// Badges in Lichess's move list. We only set attributes on its moves and
// lines (snabbdom owns them); review.css draws the rest.

function markClass(move: HTMLElement, cls: MoveClass, badge: boolean): void {
  setData(move, 'cdcCls', cls);
  setStyleProperty(move, '--c', CLASS_COLORS[cls]);
  setStyleProperty(move, '--i', classImage(cls));
  setData(move, 'cdcBadge', badge ? '' : null);
}

/** The game's moves, from the review's draft; a book badge only on the last book move. */
function mainlineBadges(tree: Element, review: Review): void {
  const moves = queryAll(tree, ':scope > move:not(.empty)', HTMLElement);
  for (const [i, element] of moves.entries()) {
    const move = review.draft[i];
    // Only a new verdict is written: the badge is decided with it.
    if (!move || element.dataset.cdcCls === move.cls) continue;
    const lastBook = !(move.cls === 'book' && review.draft[i + 1]?.cls === 'book');
    markClass(element, move.cls, LIST_BADGES.has(move.cls) && lastBook);
  }
}

// Rows striped per move number, so a variation in between doesn't shift the stripes.
function stripes(tree: Element): void {
  let even = false;
  for (const child of tree.children) {
    if (!(child instanceof HTMLElement)) continue;
    if (child.tagName === 'INDEX') even = Number.parseInt(child.textContent, 10) % 2 === 0;
    if (child.tagName !== 'INTERRUPT') setData(child, 'cdcEven', even ? '' : null);
  }
}

// The variations played here show, not Lichess's computer lines. A class,
// not a data attribute: review.css reads it in a `:has()`, where an
// attribute selector slows every move.
function ownVariations(tree: Element, analysis: Analysis): void {
  for (const line of queryAll(tree, 'interrupt line', Element)) {
    const path = line.querySelector('move[p]')?.getAttribute('p');
    const own = Boolean(path) && !analysis.nodeAtPath(path ?? '').comp;
    line.classList.toggle('cdc-var', own);
  }
}

/** Each move's verdict as it's judged, variations included: every move carries its path. */
export function liveBadges(
  live: LiveState,
  analysis: Analysis,
  moves: readonly HTMLElement[],
): void {
  for (const element of moves) {
    const path = element.getAttribute('p') ?? '';
    const move = judgeAt(live, analysis, path);
    if (!move) {
      setData(element, 'cdcCls', null);
      setData(element, 'cdcBadge', null);
      continue;
    }
    const next = firstChild(analysis.nodeAtPath(path));
    const bookGoesOn = next !== null && bookAt(live, analysis, path + next.id) === true;
    const badge = LIST_BADGES.has(move.cls) && !(move.cls === 'book' && bookGoesOn);
    if (element.dataset.cdcCls === move.cls && 'cdcBadge' in element.dataset === badge) continue;
    markClass(element, move.cls, badge);
  }
}

export const treeMoves = (): HTMLElement[] =>
  queryAll(document, 'main.analyse .tview2 move[p]', HTMLElement);

/** The review's marks on the game's move list, and on the variations played off it. */
export function reviewBadges(live: LiveState, analysis: Analysis, review: Review): void {
  const tree = queryOne(document, 'main.analyse .tview2', Element);
  if (!tree) return;
  mainlineBadges(tree, review);
  stripes(tree);
  ownVariations(tree, analysis);
  liveBadges(live, analysis, queryAll(tree, 'interrupt line.cdc-var move[p]', HTMLElement));
}
