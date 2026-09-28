import { describe, expect, it } from 'vitest';
import { COACH_MOODS } from '#shared/coach.ts';
import { buildCoachAnimations } from './build.ts';
import { eulerianCircuit } from './circuit.ts';
import { CURLS } from './constants.ts';
import { hexToRgb, openPath, outline, spline } from './geometry.ts';
import { lidShapes } from './lid.ts';
import { mouthShapes } from './mouth.ts';
import { MOUTH_POSES, REST_MOUTH, type MouthPose } from './poses.ts';
import { RigFileSchema, type CoachRig } from './rig.ts';
import { easeOut, numberTrack, pathTrack, vectorTrack } from './track.ts';
import type { Point } from './types.ts';
// The rig the original builder ran on, what it built from it (a SHA-256 of
// each animation, in canonical JSON, and the timeline in full), and what its
// helpers returned on the inputs below.
import rigFile from './fixtures/rig.json' with { type: 'json' };
import legacy from './fixtures/legacy.json' with { type: 'json' };
import helpers from './fixtures/legacy-helpers.json' with { type: 'json' };

const rigs = RigFileSchema.parse(rigFile);

function rigOf(coach: number): CoachRig {
  const rig = rigs[String(coach)];
  if (!rig) throw new Error(`no rig for coach ${coach}`);
  return rig;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** JSON with sorted keys, so objects built in another order compare equal (and -0 is 0). */
const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, item: unknown) =>
    isRecord(item)
      ? Object.fromEntries(
          Object.entries(item).toSorted(([first], [second]) => (first < second ? -1 : 1)),
        )
      : item,
  );

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/** How many objects are reachable more than once: lottie-web breaks on shared ones. */
function sharedObjects(roots: readonly unknown[]): number {
  const seen = new Set<object>();
  let shared = 0;
  const visit = (value: unknown): void => {
    if (typeof value !== 'object' || value === null) return;
    if (seen.has(value)) {
      shared += 1;
      return;
    }
    seen.add(value);
    for (const child of Object.values(value)) visit(child);
  };
  for (const root of roots) visit(root);
  return shared;
}

const posed = (pose: Partial<MouthPose>): MouthPose => ({ ...REST_MOUTH, ...pose });
const { top, bottom } = helpers.inputs;
const topPoints = top.map(([x = 0, y = 0]): Point => [x, y]);
const bottomPoints = bottom.map(([x = 0, y = 0]): Point => [x, y]);

describe('buildCoachAnimations', () => {
  it.each(Object.entries(legacy.coaches))(
    'builds what the original built for coach %s',
    async (key, expected) => {
      const coach = Number(key);
      const built = buildCoachAnimations(rigOf(coach), coach);
      expect(await sha256(canonical(built.face))).toBe(expected.face);
      expect(await sha256(canonical(built.lids))).toBe(expected.lids);
      expect(await sha256(canonical(built.blink))).toBe(expected.blink);
      expect(built.meta).toEqual(expected.meta);
      expect(built.face.layers.map(layer => layer.nm)).toEqual(expected.layers.face);
    },
  );

  it('shares no object within or between the animations', () => {
    const { face, lids, blink } = buildCoachAnimations(rigOf(1), 1);
    expect(sharedObjects([face, lids, blink])).toBe(0);
    const reused = { x: [1] };
    expect(sharedObjects([{ a: reused }, [reused]])).toBe(1);
  });
});

describe('RigFileSchema', () => {
  const rig = rigOf(1);

  it.each([
    [
      'a mouth curve of another length',
      { ...rig, mouth: { ...rig.mouth, curves: { ...rig.mouth.curves, lo: [1, 2] } } },
    ],
    [
      'a colour that is not #rrggbb',
      { ...rig, mouth: { ...rig.mouth, colors: { teeth: 'white', line: null } } },
    ],
    ['a third brow', { ...rig, brows: [...rig.brows, rig.brows[0]] }],
    ['an eye without its bottom', { ...rig, eyes: [{ ...rig.eyes[0], bottom: [] }, rig.eyes[1]] }],
  ])('refuses %s', (_, broken) => {
    expect(RigFileSchema.safeParse({ 1: broken }).success).toBe(false);
  });
});

describe('eulerianCircuit', () => {
  it('goes through every ordered pair once, as the original did', () => {
    expect(eulerianCircuit(['a', 'b', 'c'])).toEqual(helpers.circuitLetters);
    const circuit = eulerianCircuit(COACH_MOODS);
    expect(circuit).toEqual(helpers.circuitMoods);
    const pairs = circuit.slice(1).map((mood, i) => `${circuit[i]}>${mood}`);
    expect(new Set(pairs).size).toBe(COACH_MOODS.length * (COACH_MOODS.length - 1));
    expect(pairs).toHaveLength(COACH_MOODS.length * (COACH_MOODS.length - 1));
  });

  it('is empty without nodes', () => {
    expect(eulerianCircuit([])).toEqual([]);
  });
});

describe('geometry', () => {
  it('draws the splines and outlines the original drew', () => {
    const { ins, outs } = spline(topPoints);
    expect(canonical([ins, outs])).toBe(canonical(helpers.spline));
    const short = spline([
      [0, 0],
      [3, 4],
    ]);
    expect(canonical([short.ins, short.outs])).toBe(canonical(helpers.spline2));
    expect(canonical(outline(topPoints, bottomPoints))).toBe(canonical(helpers.outline));
    expect(canonical(openPath(topPoints))).toBe(canonical(helpers.openPath));
  });

  it('keeps an open curve sharp at its ends', () => {
    const { ins, outs } = spline(topPoints);
    expect([ins[0], outs[0], ins.at(-1), outs.at(-1)].flat().every(value => value === 0)).toBe(
      true,
    );
  });

  it('reads #rrggbb colours as 0 to 1', () => {
    expect(hexToRgb('#de8664')).toEqual(helpers.rgb);
    expect(hexToRgb('#ff0000')).toEqual([1, 0, 0]);
  });
});

describe('tracks', () => {
  it('keys a property as the original did', () => {
    const numbers = numberTrack([
      [0, 5],
      [10.004, 7],
      [3.456, 1],
      [10.001, 9],
      [20, 5],
    ]);
    expect(canonical(numbers)).toBe(canonical(helpers.trackNumbers));
    expect(
      canonical(
        vectorTrack([
          [0, [1, 2]],
          [5, [1, 2]],
          [9, [1, 2]],
        ]),
      ),
    ).toBe(canonical(helpers.trackSame));
    const vectors = vectorTrack(
      [
        [4, [100, 0, 100]],
        [0, [100, 100, 100]],
      ],
      easeOut,
    );
    expect(canonical(vectors)).toBe(canonical(helpers.trackVectors));
    const paths = pathTrack([
      [0, openPath(topPoints)],
      [6, openPath(bottomPoints)],
    ]);
    expect(canonical(paths)).toBe(canonical(helpers.trackShapes));
  });

  it('keeps one key per hundredth of a frame, the last written', () => {
    expect(
      numberTrack([
        [1, 3],
        [1.001, 4],
        [2, 5],
      ]),
    ).toMatchObject({
      a: 1,
      k: [
        { t: 1, s: [4] },
        { t: 2, s: [5] },
      ],
    });
  });

  it('refuses a property without keys', () => {
    expect(() => numberTrack([])).toThrow(RangeError);
  });
});

const shapesOf = (coach: number, pose: Partial<MouthPose>): Map<string, unknown> =>
  mouthShapes({ mouth: rigOf(coach).mouth, pose: posed(pose), curl: CURLS.get(coach) ?? null });
const shapes = (coach: number, pose: Partial<MouthPose>): string =>
  canonical(Object.fromEntries(shapesOf(coach, pose)));

describe('features in a pose', () => {
  it('shapes the mouth as the original did', () => {
    expect(shapes(1, MOUTH_POSES.shock)).toBe(canonical(helpers.mouthShock1));
    expect(shapes(3, MOUTH_POSES.happy)).toBe(canonical(helpers.mouthHappy3));
    const talking = { ...MOUTH_POSES.doubt, open: 2.1, width: 0.8, close: 0.7, round: 0.15 };
    expect(shapes(3, talking)).toBe(canonical(helpers.mouthDoubt3Talking));
  });

  it('gives the corners hooks on the coaches who have them only', () => {
    expect([...shapesOf(1, {}).keys()]).toEqual([
      'upper',
      'lower',
      'inside',
      'teeth',
      'tongue',
      'curlL',
      'curlR',
    ]);
    expect([...shapesOf(2, {}).keys()]).toEqual(['upper', 'lower', 'inside', 'teeth', 'tongue']);
  });

  it('shapes the lids as the original did', () => {
    const doubt = lidShapes(rigOf(2).eyes[1], 0.42);
    expect(canonical([doubt.lid, doubt.edge])).toBe(canonical(helpers.lidsDoubt2));
    const shut = lidShapes(rigOf(4).eyes[0], 1);
    expect(canonical([shut.lid, shut.edge])).toBe(canonical(helpers.lidsShut4));
  });
});
