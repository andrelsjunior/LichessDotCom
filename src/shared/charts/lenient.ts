import { z } from 'zod/mini';

/** An optional field that reads as absent when malformed, rather than failing the whole parse. */
export function lenient<T extends z.ZodMiniType>(schema: T): z.ZodMiniCatch<z.ZodMiniOptional<T>> {
  return z.catch(z.optional(schema), undefined);
}
