import { describe, expect, it } from 'vitest';
import { setHtml } from '#shared/html.ts';
import { bounds, plotPoints, vertex } from './geometry.ts';
import { radarMarkup } from './render.ts';
import { DashboardInitSchema } from './schema.ts';
// What the original script (before the TypeScript port) drew for INIT.
import legacy from './fixtures/legacy.json' with { type: 'json' };

const INIT = {
  radar: {
    labels: ['Fork', 'Pin', 'Mate in 1', 'Endgame <x>', 'Opening'],
    datasets: [{ data: [1520, '1480', 1610.4, 1400, 1555] }],
  },
};

describe('DashboardInitSchema', () => {
  it('reads the labels and the values, numbers or numeric strings', () => {
    expect(DashboardInitSchema.parse(INIT).radar).toEqual({
      labels: INIT.radar.labels,
      values: [1520, 1480, 1610.4, 1400, 1555],
    });
  });

  it.each([
    ['fewer than three themes', { labels: ['a', 'b'], datasets: [{ data: [1, 2] }] }],
    ['a value per theme missing', { labels: ['a', 'b', 'c'], datasets: [{ data: [1, 2] }] }],
    [
      'a value that is not a number',
      { labels: ['a', 'b', 'c'], datasets: [{ data: [1, 2, 'x'] }] },
    ],
    ['no dataset', { labels: ['a', 'b', 'c'], datasets: [] }],
  ])('refuses %s', (_, radar) => {
    expect(DashboardInitSchema.safeParse({ radar }).success).toBe(false);
  });
});

describe('geometry', () => {
  it('starts at the top and goes clockwise', () => {
    const [x, y] = vertex(0, 4, 10);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(-10);
    expect(vertex(1, 4, 10)[0]).toBeCloseTo(10);
  });

  it('keeps every point inside the rim, even a flat set', () => {
    expect(bounds([5, 5, 5])).toEqual([-5, 15]);
    for (const [px, py] of plotPoints([100, 2000, 1500])) {
      expect(Math.hypot(px, py)).toBeLessThanOrEqual(100.0001);
    }
  });
});

describe('radarMarkup', () => {
  it('draws what the original script drew, escaping the names', () => {
    const host = document.createElement('div');
    setHtml(host, radarMarkup(DashboardInitSchema.parse(INIT).radar));
    expect(host.innerHTML).toBe(legacy.markup);
    expect(host.innerHTML).toContain('Endgame &lt;x&gt;');
  });
});
