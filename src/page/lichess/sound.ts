import { z } from 'zod/mini';
import { createGuard } from '#shared/guards.ts';
import { readSite } from './globals.ts';

// Lichess's sound player, `site.sound` (ui/lib/src/sound.ts). Lichess calls
// it from untyped code, so what it passes is unknown until read.

export type PlaySound = (name: unknown, volume?: unknown) => unknown;
type PlayMoveSound = (options?: unknown) => unknown;

const isFunction = (value: unknown): boolean => typeof value === 'function';

const SoundPlayerSchema = z.object({
  paths: z.instanceof(Map),
  play: z.custom<PlaySound>(isFunction),
  move: z.custom<PlayMoveSound>(isFunction),
  theme: z.optional(z.unknown()),
  // Set once our hooks are in, so another copy of the page script leaves them be.
  cdcHooked: z.optional(z.boolean()),
});

export type SoundPlayer = z.infer<typeof SoundPlayerSchema>;

const isSoundPlayer = createGuard(SoundPlayerSchema);
const hasSound = createGuard(z.object({ sound: z.unknown() }));

/** The page's sound player, once Lichess has set it up. */
export function soundPlayer(): SoundPlayer | null {
  const site = readSite();
  if (!hasSound(site)) return null;
  const { sound } = site;
  return isSoundPlayer(sound) ? sound : null;
}

// A field of another type counts as missing.
const optionalString = z.optional(
  z.pipe(
    z.unknown(),
    z.transform((value): string | undefined => (typeof value === 'string' ? value : undefined)),
  ),
);
const optionalNumber = z.optional(
  z.pipe(
    z.unknown(),
    z.transform((value): number | undefined => (typeof value === 'number' ? value : undefined)),
  ),
);

// What `move()` is called with: a move from the server (with its SAN), an
// analysis node, or a named sound.
const MoveOptionsSchema = z.object({
  san: optionalString,
  ply: optionalNumber,
  name: optionalString,
  filter: optionalString,
  volume: optionalNumber,
});

export type MoveOptions = z.infer<typeof MoveOptionsSchema>;

export function readMoveOptions(options: unknown): MoveOptions {
  const result = MoveOptionsSchema.safeParse(options);
  return result.success ? result.data : {};
}
