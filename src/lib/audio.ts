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

const QUESTION_WORDS = /^(wie|wat|waar|wanneer|hoekom|waarom|hoe|hoeveel|watter|waarheen|praat|is|het|kan|mag|wil|moet|sal)\b/i;

/** Make text sound natural when read aloud: speech engines give lower-case fragments with no
 *  punctuation a flat or rising, "list-like" intonation. A capital and a full stop (or question
 *  mark) give normal sentence intonation. 'n at the start stays lower-case, as Afrikaans requires. */
export function speakable(text: string): string {
  let t = text.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  if (!t) return t;
  if (!/[.!?…]$/.test(t)) t += QUESTION_WORDS.test(t) && t.split(" ").length > 1 ? "?" : ".";
  if (t.startsWith("'n ")) return "'n " + t.charAt(3).toUpperCase() + t.slice(4);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function speak(text: string, voice: SpeechSynthesisVoice, slow = false) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(speakable(text));
    u.voice = voice;
    u.lang = voice.lang;
    // Natural neural voices sound best at their own pace; slow mode is clearly slower.
    u.rate = slow ? 0.72 : 1;
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
