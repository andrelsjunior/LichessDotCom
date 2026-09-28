import { describe, expect, it } from 'vitest';
import { barLabel, formatEval } from './format.ts';
import { forColor, moveAccuracy, PositionRecordSchema, winPercent } from './score.ts';
// What the original script printed and computed.
import legacy from './fixtures/legacy.json' with { type: 'json' };

describe('formatEval and barLabel', () => {
  it('print scores as the original did', () => {
    for (const [score, text, label] of legacy.formats) {
      const value = score === null || typeof score !== 'object' ? null : score;
      expect(formatEval(value)).toBe(text);
      expect(barLabel(value)).toBe(label);
    }
  });
});

describe('win probability and accuracy', () => {
  it('follow Lichess’s curves', () => {
    for (const [cp, win] of legacy.numbers) expect(winPercent(cp ?? 0)).toBe(win);
    for (const [loss, accuracy] of legacy.accuracies)
      expect(moveAccuracy(loss ?? 0)).toBe(accuracy);
    expect(forColor(70, 'white')).toBe(70);
    expect(forColor(70, 'black')).toBe(30);
  });
});

describe('PositionRecordSchema', () => {
  it('reads the cache’s records, and nothing else', () => {
    const cp = { cp: 20, wp: 51.8, wp2: null, best: 'e2e4' };
    const mate = { mate: -2, wp: 0, wp2: 12.5, best: null };
    expect(PositionRecordSchema.parse(cp)).toEqual(cp);
    expect(PositionRecordSchema.parse(mate)).toEqual(mate);
    expect(PositionRecordSchema.safeParse({ wp: 50, wp2: null, best: null }).success).toBe(false);
    expect(
      PositionRecordSchema.safeParse({ cp: '20', wp: 50, wp2: null, best: null }).success,
    ).toBe(false);
  });
});
