import { COACH_COUNT, CoachIdSchema } from '#shared/coach.ts';
import { setData } from '#shared/dom.ts';
import type { Feature } from '#shared/features.ts';
import { readStored, StorageKey, writeStored } from '#shared/storage.ts';

// The coach who reads a practice drill's goal (styles/practice-run/drill.css):
// the Game Review's coach, kept by the review under the same key, or one picked
// at random the first time.

export function chooseCoach(): number {
  const stored = readStored(StorageKey.coach, CoachIdSchema);
  if (stored !== null) return stored;
  const coach = 1 + Math.floor(Math.random() * COACH_COUNT);
  writeStored(StorageKey.coach, coach);
  return coach;
}

export const coachChoice: Feature = {
  name: 'coach choice',
  start: () => setData(document.documentElement, 'cdcCoach', String(chooseCoach())),
};
