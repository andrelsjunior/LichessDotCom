import { afterEach, describe, expect, it } from 'vitest';
import { queryOne } from '#shared/dom.ts';
import { createPuzzleSync, gaugeScore } from './puzzle.ts';
// The eval bar's label and side per engine score, as the original wrote them.
import legacy from './fixtures/legacy-puzzle.json' with { type: 'json' };

afterEach(() => {
  document.body.innerHTML = '';
});

describe('eval gauge', () => {
  it.each(legacy.scores)('reads $score as the original did', ({ score, eval: label, lead }) => {
    document.body.innerHTML = `<main class="puzzle"><div class="eval-gauge"></div><div class="ceval"><pearl>${score}</pearl></div></main>`;
    createPuzzleSync()();
    const gauge = queryOne(document, '.eval-gauge', HTMLElement);
    expect(gauge?.dataset.cdcEval ?? null).toBe(label);
    expect(gauge?.dataset.cdcLead).toBe(lead);
  });

  it('clears a label once the engine line is gone', () => {
    document.body.innerHTML =
      '<main class="analyse"><div class="eval-gauge" data-cdc-eval="3.1" data-cdc-lead="black"></div></main>';
    createPuzzleSync()();
    expect(document.querySelector('.eval-gauge')?.outerHTML).toBe(legacy.cleared);
  });

  it('reads a mate and its side', () => {
    expect(gaugeScore('#−3')).toEqual({ label: 'M3', lead: 'black' });
  });
});

describe('session chips', () => {
  it('scrolls to the latest chip when one is added', () => {
    document.body.innerHTML =
      '<main class="puzzle"><div class="puzzle__session"><a></a></div></main>';
    const session = document.querySelector('.puzzle__session');
    if (!(session instanceof HTMLElement)) throw new Error('no session');
    Object.defineProperty(session, 'scrollWidth', { value: 500 });
    const sync = createPuzzleSync();
    sync();
    expect(session.scrollLeft).toBe(500);
    session.scrollLeft = 20;
    sync();
    expect(session.scrollLeft).toBe(20);
    session.append(document.createElement('a'));
    sync();
    expect(session.scrollLeft).toBe(500);
  });
});
