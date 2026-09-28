/**
 * `from`, then every `step` (> 0) up to `to`. Summed one step at a time, so
 * fractional steps drift exactly as a plain loop's would.
 */
export function steps(from: number, to: number, step: number): number[] {
  const values: number[] = [];
  for (let value = from; value <= to; value += step) values.push(value);
  return values;
}
