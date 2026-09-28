import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod/mini';
import { fakeLayout } from '#shared/charts/fake-layout.ts';
import { queryOne } from '#shared/dom.ts';
import { StorageKey } from '#shared/storage.ts';
import { ratingChart } from './index.ts';
// The original script's chart through the same clicks, hovers and resizes.
import legacy from './fixtures/legacy-chart.json' with { type: 'json' };

const ActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('mount') }),
  z.object({ type: z.literal('resize'), width: z.number() }),
  z.object({ type: z.literal('range'), key: z.string() }),
  z.object({ type: z.literal('chip'), i: z.number() }),
  z.object({ type: z.literal('hover'), clientX: z.number() }),
  z.object({ type: z.literal('leave') }),
]);
type Action = z.infer<typeof ActionSchema>;

let plotWidth = 640;

// The sizes the original's recording used.
const RANGE_KEYS = ['1M', '3M', '6M', 'YTD', '1Y', 'ALL'];

// The sizes the original's recording used.
function stubLayout() {
  return fakeLayout((element, metric) => {
    const range = element.dataset.range;
    if (metric === 'clientWidth') return element.matches('.cdc-rchart__plot') ? plotWidth : 0;
    if (metric === 'offsetWidth' && element.matches('.cdc-rchart__tip')) return 120;
    if (range === undefined) return 0;
    if (metric === 'offsetWidth') return 30 + 4 * range.length;
    if (metric === 'offsetHeight') return 28;
    if (metric === 'offsetLeft') return 3 + 44 * RANGE_KEYS.indexOf(range);
    return metric === 'offsetTop' ? 3 : 0;
  });
}

function click(root: Element, selector: string): void {
  root.querySelector(selector)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function act(action: Action, host: Element, resize: () => void): void {
  const root = queryOne(host, '.cdc-rchart', HTMLElement);
  const svg = root?.querySelector('svg');
  if (!root || !svg) throw new Error('no chart');
  switch (action.type) {
    case 'mount':
      return;
    case 'resize':
      plotWidth = action.width;
      resize();
      return;
    case 'range':
      click(root, `[data-range="${action.key}"]`);
      return;
    case 'chip':
      click(root, `.cdc-rchart__chip[data-i="${action.i}"]`);
      return;
    case 'hover':
      svg.dispatchEvent(new PointerEvent('pointermove', { clientX: action.clientX }));
      return;
    case 'leave':
      svg.dispatchEvent(new PointerEvent('pointerleave'));
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(legacy.now);
  plotWidth = 640;
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
  document.documentElement.lang = '';
  document.body.replaceChildren();
});

describe('the rating chart', () => {
  it.each(legacy.scenarios.map(scenario => [scenario.name, scenario]))(
    'draws the %s scenario as the original did',
    (_, { lang, json, stored, snapshots }) => {
      const { resize } = stubLayout();
      document.documentElement.lang = lang;
      if (stored !== null) localStorage.setItem(StorageKey.ratingChartRange, stored);
      document.body.innerHTML =
        '<div class="rating-history-container"><div class="rating-history-container"><canvas></canvas></div></div>' +
        `<script id="page-init-data" type="application/json">${JSON.stringify(json)}</script>`;
      ratingChart.start();
      const host = document.querySelector('.rating-history-container');
      if (!host) throw new Error('no host');
      let expected = '';
      for (const snapshot of snapshots) {
        act(ActionSchema.parse(snapshot.action), host, resize);
        expected = snapshot.html ?? expected;
        expect(host.outerHTML).toBe(expected);
        expect(localStorage.getItem(StorageKey.ratingChartRange)).toBe(snapshot.stored);
      }
    },
  );
});
