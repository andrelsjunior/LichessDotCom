import type { SoundFiles } from '#shared/protocol.ts';
import { SOUND_NAMES } from '#shared/sounds.ts';
import type { SoundName } from '#shared/sounds.ts';
import { soundPlayer, type SoundPlayer } from '#page/lichess/sound.ts';

const POLL_MS = 50;
const GIVE_UP_MS = 30_000;

// Lichess's CSP lets audio load from blob: URLs, not from the extension.
export function toBlobUrls(files: SoundFiles): Map<SoundName, string> {
  const urls = new Map<SoundName, string>();
  for (const name of SOUND_NAMES) {
    const bytes = files[name];
    if (bytes) urls.set(name, URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' })));
  }
  return urls;
}

/** Hands over Lichess's sound player once it's set up, for up to 30 seconds. */
export function whenSoundPlayerReady(callback: (sound: SoundPlayer) => void): void {
  const started = Date.now();
  const check = (): void => {
    const sound = soundPlayer();
    if (sound) callback(sound);
    else if (Date.now() - started < GIVE_UP_MS) setTimeout(check, POLL_MS);
  };
  check();
}
