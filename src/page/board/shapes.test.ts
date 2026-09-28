import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { queryOne } from '#shared/dom.ts';
import { renderBoard } from './fixtures/board-markup.ts';
import { shapes } from './index.ts';
import { setReviewArrows } from './review-arrows.ts';
import labels from './fixtures/legacy-label.json' with { type: 'json' };

const layer = (): HTMLElement | null => queryOne(document, '#cdc-shapes', HTMLElement);
async function nextFrame(): Promise<void> {
  await vi.advanceTimersByTimeAsync(20);
}

const FOOLS_MATE = {
  id: 'Cd',
  ply: 4,
  fen: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
  san: 'Qh4#',
  children: [],
};

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'Date'] });
  // The label is picked in the page's language when the script starts.
  document.documentElement.lang = 'fr';
  shapes.start();
  document.documentElement.lang = '';
});

afterAll(() => {
  vi.useRealTimers();
});

describe('shapes', () => {
  it('draws on the next frame once a board appears', async () => {
    renderBoard({ orientation: 'white', shapes: [] });
    expect(layer()).toBeNull();
    await nextFrame();
    expect(layer()?.parentElement?.tagName).toBe('CG-CONTAINER');
    expect(document.querySelector('cg-container > svg.cdc-marks')).not.toBeNull();
  });

  it('draws the review’s arrows as soon as they change', async () => {
    setReviewArrows([{ orig: 'e2', dest: 'e4', brush: 'best' }]);
    expect(layer()?.innerHTML).toBe('');
    await nextFrame();
    expect(layer()?.querySelectorAll('polygon')).toHaveLength(1);
    setReviewArrows([]);
    await nextFrame();
    expect(layer()?.innerHTML).toBe('');
  });

  it('draws again when the board turns round', async () => {
    Object.assign(window, { site: { analysis: { node: FOOLS_MATE } } });
    document.querySelector('.cg-wrap')?.classList.replace('orientation-white', 'orientation-black');
    await nextFrame();
    expect(layer()?.innerHTML).toContain('left:50%;top:0%');
  });

  it('brings the checkmate label in, in the page’s language, after a moment', async () => {
    await vi.advanceTimersByTimeAsync(2500);
    expect(layer()?.querySelector('.cdc-mate__label')?.textContent).toBe(labels.fr);
    Reflect.deleteProperty(window, 'site');
  });
});
