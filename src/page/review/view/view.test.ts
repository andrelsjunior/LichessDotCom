import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod/mini';
import { PositionRecordSchema } from '#page/review/evaluation/score.ts';
import { en } from '#page/review/i18n/en.ts';
import { UNIT_CASES } from '#page/review/fixtures/unit-cases.ts';
import { builtSession } from '#page/review/fixtures/unit-review.ts';
import { badgeMarkup, landingSquare, reviewArrowsFor, screenCoords } from './board-badge.ts';
import { barPosition, type BarInput } from './eval-bar.ts';
import { indexAt } from './graph.ts';
import { graphMarkup, knownRuns } from './graph-markup.ts';
import { evalChip, header } from './markup.ts';
import { openingMarkup } from './opening.ts';
import { overflows } from './stream.ts';
import { playerName } from './summary-panel.ts';
import { tipPlacement } from './tooltip.ts';
// What the original script drew for the same inputs.
import legacy from './fixtures/legacy.json' with { type: 'json' };

afterEach(() => {
  Reflect.deleteProperty(window, 'site');
});

describe('the graph', () => {
  const drawn = UNIT_CASES.builds.flatMap(build => {
    const { review } = builtSession(build).view;
    return build.graphs.map(size => ({ review, size }));
  });

  it.each(drawn.map(({ review, size }, i) => [i, review, size, legacy.graphs[i]]))(
    'draws graph %i as the original did',
    (_, review, { ply, width, height }, expected) => {
      if (!review) throw new Error('no review');
      expect(graphMarkup(review, ply, { width, height }).value).toBe(expected);
    },
  );

  it('splits the known positions into runs', () => {
    const record = { cp: 0, wp: 50, wp2: null, best: null };
    expect(knownRuns([record, record, null, record, null, null, record])).toEqual([
      [0, 1],
      [3],
      [6],
    ]);
    expect(knownRuns([null, null])).toEqual([]);
  });

  it('finds the position under the pointer, within the game', () => {
    const box = { padX: 16, width: 300, height: 88 };
    expect(indexAt(8, box, 30)).toBe(0);
    expect(indexAt(158, box, 30)).toBe(15);
    expect(indexAt(1000, box, 30)).toBe(30);
    expect(indexAt(-50, box, 30)).toBe(0);
  });
});

describe('markup', () => {
  const RecordSchema = z.nullable(PositionRecordSchema);

  it.each(UNIT_CASES.chips.map((record, i) => [i, record, legacy.chips[i]]))(
    'draws score chip %i as the original did',
    (_, record, expected) => {
      expect(evalChip(RecordSchema.parse(record)).value).toBe(expected);
    },
  );

  it.each(UNIT_CASES.headers.map(([title = '', back = ''], i) => [title, back, legacy.headers[i]]))(
    'draws the header “%s” (back to %s) as the original did',
    (title, back, expected) => {
      expect(header(title, back, en).value).toBe(expected);
    },
  );

  const PlayerSchema = z.nullable(
    z.object({
      user: z.optional(z.object({ username: z.optional(z.string()) })),
      name: z.optional(z.string()),
      ai: z.optional(z.number()),
    }),
  );

  it.each(UNIT_CASES.players.map((player, i) => [i, player, legacy.names[i]]))(
    'names player %i as the original did',
    (_, player, expected) => {
      const parsed = PlayerSchema.parse(player);
      expect(playerName(parsed ? { color: 'white', ...parsed } : undefined, en)).toBe(expected);
    },
  );

  it('names the opening’s family in bold, then its variation', () => {
    expect(openingMarkup({ name: 'Ruy Lopez: Morphy Defense: Norwegian', eco: 'C70' }).value).toBe(
      '<i class="cdc-opening__icon"></i><span class="cdc-opening__eco">C70</span><span class="cdc-opening__name"><b>Ruy Lopez</b>: Morphy Defense: Norwegian</span>',
    );
    expect(openingMarkup({ name: 'Start <position>', eco: '' }).value).toBe(
      '<i class="cdc-opening__icon"></i><span class="cdc-opening__name"><b>Start &lt;position&gt;</b></span>',
    );
  });
});

const record = (wp: number): { cp: number; wp: number; wp2: null; best: null } => ({
  cp: 0,
  wp,
  wp2: null,
  best: null,
});

const bar = (input: Partial<BarInput>): ReturnType<typeof barPosition> =>
  barPosition({
    review: { positions: [record(50), record(60)] },
    reviewing: true,
    live: false,
    onMainline: true,
    ply: 1,
    bestBefore: null,
    offGame: undefined,
    last: null,
    ...input,
  });

describe('the board', () => {
  it('puts the badge on the square the piece landed on, the king’s for a castle', () => {
    expect(landingSquare('e2e4', 'e4')).toBe('e4');
    expect(landingSquare('e1h1', 'O-O')).toBe('g1');
    expect(landingSquare('e8a8', 'O-O-O+')).toBe('c8');
    expect(screenCoords('a1', 'white')).toEqual([0, 7]);
    expect(screenCoords('a1', 'black')).toEqual([7, 0]);
    expect(
      badgeMarkup({ cls: 'best', uci: 'g1f3', san: 'Nf3', orientation: 'white' }).value,
    ).toMatch(/^<div class="cdc-badge" style="left:75%;top:62\.5%">/);
  });

  it('draws the best move for a move that needed it, and the engine’s off the game', () => {
    expect(reviewArrowsFor({ cls: 'mistake', best: 'e2e4', engine: null })).toEqual([
      { orig: 'e2', dest: 'e4', brush: 'best' },
    ]);
    expect(reviewArrowsFor({ cls: 'best', best: 'e2e4', engine: 'g8f6' })).toEqual([
      { orig: 'g8', dest: 'f6', brush: 'engine' },
    ]);
    expect(reviewArrowsFor({ cls: null, best: null, engine: 'zz' })).toEqual([]);
  });

  it('shows the eval bar’s score for the position on the board', () => {
    expect(bar({})?.wp).toBe(60);
    expect(bar({ bestBefore: record(10) })?.wp).toBe(10);
    expect(bar({ onMainline: false, offGame: record(70) })?.wp).toBe(70);
    // A move off the game waits for its engine with the last score.
    expect(bar({ onMainline: false, last: record(33) })?.wp).toBe(33);
    expect(
      bar({ reviewing: false, onMainline: false, offGame: record(70), last: record(33) }),
    ).toBeNull();
    expect(bar({ live: true })).toBeNull();
    expect(bar({ review: null, last: record(33) })).toBeNull();
  });
});

describe('the panel', () => {
  it('places the tooltip over its anchor, inside the window', () => {
    expect(
      tipPlacement({
        anchor: { left: 100, top: 200, width: 40 },
        width: 120,
        height: 30,
        viewportWidth: 1000,
      }),
    ).toEqual({
      left: 60,
      top: 160,
      tail: 60,
    });
    expect(
      tipPlacement({
        anchor: { left: 0, top: 50, width: 20 },
        width: 120,
        height: 30,
        viewportWidth: 1000,
      }).left,
    ).toBe(8);
    expect(
      tipPlacement({
        anchor: { left: 990, top: 50, width: 20 },
        width: 120,
        height: 30,
        viewportWidth: 1000,
      }),
    ).toEqual({
      left: 872,
      top: 10,
      tail: 128,
    });
  });

  it('drops a sentence only when a whole line overflows', () => {
    expect(overflows({ scrollHeight: 45, clientHeight: 36, lineHeight: '18px' })).toBe(false);
    expect(overflows({ scrollHeight: 46, clientHeight: 36, lineHeight: '18px' })).toBe(true);
    expect(overflows({ scrollHeight: 46, clientHeight: 36, lineHeight: 'normal' })).toBe(true);
  });
});
