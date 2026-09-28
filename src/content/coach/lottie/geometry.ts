import type { BezierPath, Point } from './types.ts';

export type Rgb = readonly [red: number, green: number, blue: number];

export const lerp = (from: number, to: number, share: number): number => from + (to - from) * share;

/** A tenth of a pixel is finer than the portraits, and keeps the data small. */
const roundTenth = (value: number): number => Math.round(value * 10) / 10;

const roundPoints = (points: readonly Point[]): Point[] =>
  points.map(([x, y]) => [roundTenth(x), roundTenth(y)]);

/** An item of a list the rig's schema has checked the length of. */
export function valueAt<T>(list: readonly T[], index: number): T {
  const value = list[index];
  if (value === undefined) throw new RangeError(`no item ${index} in a list of ${list.length}`);
  return value;
}

/** A `#rrggbb` colour's channels, 0 to 1. */
export function hexToRgb(hex: string): Rgb {
  const channel = (start: number): number => Number.parseInt(hex.slice(start, start + 2), 16) / 255;
  return [channel(1), channel(3), channel(5)];
}

export const mixRgb = (
  [red, green, blue]: Rgb,
  [toRed, toGreen, toBlue]: Rgb,
  share: number,
): Rgb => [lerp(red, toRed, share), lerp(green, toGreen, share), lerp(blue, toBlue, share)];

export interface Tangents {
  readonly ins: readonly Point[];
  readonly outs: readonly Point[];
}

/** Catmull-Rom tangents through an open curve's points; its ends stay sharp. */
export function spline(points: readonly Point[]): Tangents {
  const last = points.length - 1;
  const tangents = points.map(([x, y], k): Point => {
    if (k === 0 || k === last) return [0, 0];
    const [beforeX, beforeY] = points[k - 1] ?? [x, y];
    const [afterX, afterY] = points[k + 1] ?? [x, y];
    return [(afterX - beforeX) / 6, (afterY - beforeY) / 6];
  });
  return {
    ins: tangents.map(([x, y]) => [-x, -y]),
    outs: tangents,
  };
}

interface PathParts {
  readonly vertices: readonly Point[];
  readonly ins: readonly Point[];
  readonly outs: readonly Point[];
  readonly closed: boolean;
}

const bezierPath = ({ vertices, ins, outs, closed }: PathParts): BezierPath => ({
  i: roundPoints(ins),
  o: roundPoints(outs),
  v: roundPoints(vertices),
  c: closed,
});

/**
 * A closed shape from a top curve (left to right) and a bottom one sharing
 * its ends, the corners: each curve smooth, the corners sharp.
 */
export function outline(top: readonly Point[], bottom: readonly Point[]): BezierPath {
  const back = bottom.toReversed();
  const topTangents = spline(top);
  const backTangents = spline(back);
  return bezierPath({
    vertices: [...top, ...back.slice(1, -1)],
    ins: [...topTangents.ins, ...backTangents.ins.slice(1, -1)],
    outs: [...topTangents.outs, ...backTangents.outs.slice(1, -1)],
    closed: true,
  });
}

export function openPath(points: readonly Point[]): BezierPath {
  return bezierPath({ vertices: points, ...spline(points), closed: false });
}
