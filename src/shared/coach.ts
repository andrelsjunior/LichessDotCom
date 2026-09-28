import { z } from 'zod/mini';

/** The Game Review's coaches: one portrait each, in public/img/coaches. */
export const COACH_COUNT = 4;

export const CoachIdSchema = z.coerce.number().check(z.int(), z.minimum(1), z.maximum(COACH_COUNT));

/** How the coach looks at a move, from a verdict (see the review's move classes). */
export const CoachMoodSchema = z.enum(['neutral', 'happy', 'delight', 'doubt', 'worry', 'shock']);
export type CoachMood = z.infer<typeof CoachMoodSchema>;
export const COACH_MOODS: readonly CoachMood[] = CoachMoodSchema.options;
