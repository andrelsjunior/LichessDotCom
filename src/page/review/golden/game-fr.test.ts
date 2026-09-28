import { afterEach, expect, it, vi } from 'vitest';
import { reviewArrows } from '#page/board/review-arrows.ts';
import { portAgainstLegacy } from '#page/review/fixtures/review-script.ts';
import { GAME_FR } from '#page/review/fixtures/review-scenarios.ts';
import { review } from '#page/review/index.ts';
// What the original script showed after each step of the same script.
import legacy from './fixtures/legacy-game-fr.json' with { type: 'json' };

afterEach(() => {
  vi.useRealTimers();
});

it('shows what the original showed, step by step', async () => {
  const steps = await portAgainstLegacy(
    GAME_FR,
    { boot: review.start, arrows: reviewArrows },
    legacy,
  );
  for (const { step, port, legacy: recorded } of steps)
    expect({ step, ...Object(port) }).toEqual({ step, ...Object(recorded) });
}, 30_000);
