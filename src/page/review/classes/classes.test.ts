import { describe, expect, it } from 'vitest';
import {
  CLASS_COLORS,
  classMood,
  COUNTED,
  GOOD,
  GRAPH_DOTS,
  isError,
  LIST_BADGES,
  MOVE_CLASSES,
  RANK,
  SUMMARY_ROWS,
} from './classes.ts';
import { classIcon, classImage, classSvg } from './icon-svg.ts';
// The original script's class table, icons and sets.
import legacy from './fixtures/legacy.json' with { type: 'json' };

describe('move classes', () => {
  it('come in the original’s order and colors', () => {
    expect(MOVE_CLASSES).toEqual(legacy.classes.map(({ key }) => key));
    for (const { key, color } of legacy.classes) {
      const cls = MOVE_CLASSES.find(candidate => candidate === key);
      expect(cls && CLASS_COLORS[cls]).toBe(color);
    }
  });

  it('draw the original’s icons, inline and as a CSS image', () => {
    for (const { key, svg, img } of legacy.classes) {
      const cls = MOVE_CLASSES.find(candidate => candidate === key);
      if (!cls) throw new Error(`unknown class ${key}`);
      expect(classSvg(cls).value).toBe(svg);
      expect(classImage(cls)).toBe(img);
      expect(classIcon(cls).value).toBe(`<span class="cdc-cls-icon">${svg}</span>`);
    }
  });

  it('keep the original’s sets', () => {
    const { sets } = legacy;
    expect(COUNTED).toEqual(sets.COUNTED);
    expect([...SUMMARY_ROWS]).toEqual(sets.SUMMARY_ROWS);
    expect([...GRAPH_DOTS]).toEqual(sets.GRAPH_DOTS);
    expect([...LIST_BADGES]).toEqual(sets.LIST_BADGES);
    expect([...GOOD]).toEqual(sets.GOOD);
    expect(RANK).toEqual(sets.RANK);
    const moods = Object.fromEntries(
      MOVE_CLASSES.flatMap(cls => {
        const mood = classMood(cls);
        return mood ? [[cls, mood]] : [];
      }),
    );
    expect(moods).toEqual(sets.MOODS);
  });

  it('tell the errors apart', () => {
    expect(MOVE_CLASSES.filter(isError)).toEqual(['inaccuracy', 'mistake', 'miss', 'blunder']);
  });
});
