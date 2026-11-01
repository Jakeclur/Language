import { useEffect, useState } from "react";
import type { AudioManifest } from "./data";
import { normalise } from "./text";

/** Key used by the audio pipeline to name clips. Must match pipeline/audio/lib.mjs. */
export const audioKey = (text: string) => normalise(text, "af");

export function audioFor(manifest: AudioManifest, text: string): { voice: string; url: string }[] {
  const item = manifest.items[audioKey(text)];
  if (!item) return [];
  return Object.entries(item).map(([voice, file]) => ({ voice, url: `./audio/${file}` }));
}

// ---------------------------------------------------------------------------------------------
// Device voices. Only NATURAL (neural/online) Afrikaans voices are allowed, e.g. Microsoft Edge's
// "Microsoft Adri Online (Natural) - Afrikaans (South Africa)". Classic robotic system voices are
// never used (PLAN.md §6).
const NATURAL = /natural|neural|online|premium|enhanced/i;

let cached: SpeechSynthesisVoice[] | null = null;
function naturalAfrikaansVoices(): SpeechSynthesisVoice[] {
  try {
    if (!("speechSynthesis" in window)) return [];
    const all = window.speechSynthesis.getVoices();
    if (!all.length) return cached ?? [];
    cached = all.filter((v) => v.lang.toLowerCase().startsWith("af") && NATURAL.test(v.name));
    return cached;
  } catch {
    return [];
  }
}

/** React hook: the natural Afrikaans device voices (voices load asynchronously in most browsers). */
export function useDeviceVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState(naturalAfrikaansVoices);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const on = () => setVoices(naturalAfrikaansVoices());
    window.speechSynthesis.addEventListener?.("voiceschanged", on);
    on();
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", on);
  }, []);
  return voices;
}

export function speak(text: string, voice: SpeechSynthesisVoice, slow = false) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = slow ? 0.7 : 0.95;
    window.speechSynthesis.speak(u);
  } catch {
    /* not available */
  }
}

let current: HTMLAudioElement | null = null;
export function playClip(url: string) {
  try {
    current?.pause();
    current = new Audio(url);
    current.play().catch(() => {});
  } catch {
    /* blocked */
  }
}
