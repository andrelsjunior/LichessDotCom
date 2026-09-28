import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { boards } from './index.ts';
import { PIECE_CODES } from './catalog.ts';
// What the original script did with the same storage and the same clicks.
import legacy from './fixtures/legacy.json' with { type: 'json' };

const PROPERTIES = [
  '--cdc-board-img',
  '--cdc-sq-light',
  '--cdc-sq-dark',
  ...PIECE_CODES.map(code => `--cdc-piece-${code}`),
];

const root = document.documentElement;

function rootState(): {
  dataset: Record<string, string | undefined>;
  properties: Record<string, string>;
} {
  const properties: Record<string, string> = {};
  for (const name of PROPERTIES) {
    const value = root.style.getPropertyValue(name);
    if (value !== '') properties[name] = value;
  }
  return { dataset: Object.fromEntries(Object.entries(root.dataset)), properties };
}

const dataOf = (element: Element, key: string): string | null =>
  element instanceof HTMLElement ? (element.dataset[key] ?? null) : null;

function panelSummary(app: Element): unknown[] {
  return [...app.querySelectorAll('.sub')].map(panel => ({
    classes: panel.className,
    srcOn: dataOf(panel, 'cdcSrcOn'),
    view: dataOf(panel, 'cdcView'),
    tabs: panel.querySelectorAll(':scope > .cdc-src-tabs').length,
    lists: panel.querySelectorAll(':scope > .cdc-src-list').length,
    activeTabs: [...panel.querySelectorAll('.cdc-src-tabs button.active')].map(tab =>
      dataOf(tab, 'view'),
    ),
    activeItems: [...panel.querySelectorAll('.cdc-src-item.active')].map(item =>
      dataOf(item, 'id'),
    ),
  }));
}

const boardPanel = (dimension = 'd2'): string =>
  `<div class="sub board ${dimension}"><button class="head text" data-icon="x">Board</button>` +
  `<div class="selector"><button class="active">2D</button><button>3D</button></div>` +
  `<div class="list"><button title="brown" class="active"><span class="color-brown"></span></button><button title="blue"><span class="color-blue"></span></button></div></div>`;
const piecePanel = (): string =>
  `<div class="sub piece d2"><button class="head text" data-icon="x">Piece set</button>` +
  `<div class="list"><button title="cburnett" class="active"><piece class="white knight cburnett"></piece></button><button title="merida"><piece class="white knight merida"></piece></button></div></div>`;
const headless = (): string =>
  `<div class="sub board d2"><div class="list"><button title="brown"></button></div></div>`;
const SHELL =
  '<header id="top"><div class="dasher"><button id="user_tag">u</button><div id="dasher_app" class="dropdown"></div></div></header>';

const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

function app(): HTMLElement {
  const element = document.getElementById('dasher_app');
  if (!element) throw new Error('no menu');
  return element;
}

function click(selector: string): void {
  app()
    .querySelector(selector)
    ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

async function draw(markup: string): Promise<void> {
  app().innerHTML = markup;
  await flush();
}

function setReadyState(state: DocumentReadyState): void {
  Object.defineProperty(document, 'readyState', { value: state, configurable: true });
}

// Every start adds a click listener to the document: remove them between tests.
let removeListeners = (): void => {};
beforeEach(() => {
  const spy = vi.spyOn(document, 'addEventListener');
  removeListeners = () => {
    for (const [type, listener, options] of spy.mock.calls)
      document.removeEventListener(type, listener, options);
  };
  vi.stubGlobal('chrome', {
    runtime: { getURL: (path: string) => `chrome-extension://abc/${path}` },
  });
  for (const name of root.getAttributeNames()) root.removeAttribute(name);
  localStorage.clear();
  document.body.innerHTML = '';
  setReadyState('complete');
});
afterEach(() => removeListeners());

function start(stored: Readonly<Record<string, string>>): void {
  for (const [key, value] of Object.entries(stored)) localStorage.setItem(key, value);
  boards.start();
}

describe('the pick on <html>', () => {
  it.each(legacy.roots)('matches the original for $stored', ({ stored, dataset, properties }) => {
    start(stored);
    expect(rootState()).toEqual({ dataset, properties });
  });
});

describe('the user menu', () => {
  it('adds the tabs and lists, and follows the clicks, as the original did', async () => {
    document.body.innerHTML = SHELL;
    start({ 'cdc-board': 'lichess', 'cdc-pieces': 'glass' });
    const steps: unknown[] = [];
    const markup: Record<string, string> = {};
    const record = (step: string): void => {
      steps.push({
        step,
        panels: panelSummary(app()),
        ...rootState(),
        storage: {
          board: localStorage.getItem('cdc-board'),
          pieces: localStorage.getItem('cdc-pieces'),
        },
      });
    };

    await draw(boardPanel());
    markup['board'] = app().innerHTML;
    record('board panel opens');
    click('.cdc-src-item[data-id="walnut"] .cdc-src-name');
    record('walnut picked');
    click('.cdc-src-tabs button[data-view="lichess"]');
    record('lichess tab');
    await draw(boardPanel('d3'));
    record('switched to 3D');
    click('.list > button[title="blue"] span');
    record('a 3D board clicked');
    await draw(boardPanel('d2'));
    record('back to 2D');
    click('.list > button[title="blue"] span');
    record('lichess board picked');
    click('.list > button[title="brown"]');
    record('lichess board picked again');
    click('.cdc-src-tabs button[data-view="cdc"]');
    record('extension tab');
    click('.selector > button');
    record('selector clicked');
    click('.cdc-src-item[data-id="green"]');
    record('green picked');
    await draw(piecePanel());
    markup['piece'] = app().innerHTML;
    record('piece panel opens');
    click('.cdc-src-item[data-id="neo"]');
    record('neo picked');
    click('.list > button[title="merida"]');
    record('lichess pieces picked');
    await draw('');
    record('menu closed');
    await draw(piecePanel());
    record('piece panel opens again');
    await draw(headless());
    record('a panel without a head');
    await draw(boardPanel() + piecePanel());
    record('both panels');
    click('.sub.piece .cdc-src-item[data-id="8qetl"]');
    record('8qetl picked');
    // Snabbdom replaces the menu's own node.
    const replacement = document.createElement('div');
    replacement.id = 'dasher_app';
    replacement.innerHTML = boardPanel();
    app().replaceWith(replacement);
    await flush();
    record('menu node replaced');

    expect(markup).toEqual(legacy.markup);
    expect(steps).toEqual(legacy.steps);
  });

  it('looks for the menu once the page is parsed', async () => {
    setReadyState('loading');
    start({});
    document.body.innerHTML = SHELL;
    app().innerHTML = boardPanel();
    await flush();
    const beforeReady = panelSummary(app());
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect({ beforeReady, afterReady: panelSummary(app()) }).toEqual(legacy.parsing);
  });

  it('does nothing without a menu', async () => {
    document.body.innerHTML = '<div class="sub board d2"><div class="head"></div></div>';
    start({});
    await flush();
    expect(document.querySelector('.cdc-src-tabs')).toBeNull();
  });
});
