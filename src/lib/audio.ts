import type { AudioManifest } from "./data";
import { normalise } from "./text";

/** Key used by the audio pipeline to name clips. Must match pipeline/audio/lib.mjs. */
export const audioKey = (text: string) => normalise(text, "af");

export function audioFor(manifest: AudioManifest, text: string): { voice: string; url: string }[] {
  const item = manifest.items[audioKey(text)];
  if (!item) return [];
  return Object.entries(item).map(([voice, file]) => ({ voice, url: `./audio/${file}` }));
}
