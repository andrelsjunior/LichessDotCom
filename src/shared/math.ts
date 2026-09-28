/** `value`, kept between `low` and `high` (`low` wins if they cross). */
export const clamp = (value: number, low: number, high: number): number =>
  Math.max(low, Math.min(high, value));

/** Rounded to a tenth: as fine as a pixel coordinate needs, and short to write. */
export const roundTenth = (value: number): number => Math.round(value * 10) / 10;
