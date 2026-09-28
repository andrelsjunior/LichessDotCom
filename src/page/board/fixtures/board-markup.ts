import type { Color } from '#shared/chess/types.ts';
import { createElement } from '#shared/dom.ts';
import type { Frame } from './schema.ts';

// An analysis board with chessground's shapes svg, built the way chessground
// builds it (by script, so `cgHash` keeps its case).

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface BoardMarkup {
  readonly orientation: Color;
  readonly shapes?: Frame['shapes'];
  readonly viewBox?: string | null | undefined;
}

export function renderBoard({ orientation, shapes = [], viewBox }: BoardMarkup): Element {
  const main = createElement('main', { className: 'analyse' });
  const board = createElement('div', { className: 'analyse__board main-board' });
  const wrap = createElement('div', { className: `cg-wrap orientation-${orientation}` });
  const container = createElement('cg-container');
  main.append(board);
  board.append(wrap);
  wrap.append(container);
  container.append(createElement('cg-board'));
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'cg-shapes');
  if (viewBox !== null) svg.setAttribute('viewBox', viewBox ?? '-4 -4 8 8');
  const group = document.createElementNS(SVG_NS, 'g');
  svg.append(document.createElementNS(SVG_NS, 'defs'), group);
  for (const shape of shapes) {
    const holder = document.createElementNS(SVG_NS, 'g');
    holder.setAttribute('cgHash', shape.hash ?? '800,800,false,e2,e4,green');
    const element = document.createElementNS(SVG_NS, shape.tag);
    for (const [name, value] of Object.entries(shape.attrs)) element.setAttribute(name, value);
    holder.append(element);
    group.append(holder);
  }
  container.append(svg);
  document.body.replaceChildren(main);
  return container;
}
