import type { z } from 'zod/mini';

/**
 * A type guard backed by a schema, for live objects that must keep their
 * identity (a zod parse returns a copy). An object that passed once is
 * remembered, so checking it again is free.
 */
export function createGuard<T>(schema: z.ZodMiniType<T>): (value: unknown) => value is T {
  const passed = new WeakSet<object>();
  return (value: unknown): value is T => {
    const isObject = typeof value === 'object' && value !== null;
    if (isObject && passed.has(value)) return true;
    if (!schema.safeParse(value).success) return false;
    if (isObject) passed.add(value);
    return true;
  };
}
