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
// Device voices, best first:
//   1. natural (neural/online) Afrikaans voices, e.g. Edge's "Microsoft Adri Online (Natural)"
//   2. any other Afrikaans voice on the device (e.g. Android's Google Afrikaans voice)
//   3. only if the learner turns it on: a Dutch voice (Afrikaans grew from Dutch: close, not exact)
const NATURAL = /natural|neural|online|premium|enhanced/i;

function voicesWhere(test: (v: SpeechSynthesisVoice) => boolean): SpeechSynthesisVoice[] {
  try {
    if (!("speechSynthesis" in window)) return [];
    return window.speechSynthesis.getVoices().filter(test);
  } catch {
    return [];
  }
}
const isAf = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace("_", "-").startsWith("af");
const isNl = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace("_", "-").startsWith("nl");
const naturalFirst = (a: SpeechSynthesisVoice, b: SpeechSynthesisVoice) => Number(NATURAL.test(b.name)) - Number(NATURAL.test(a.name));

function useVoices(test: (v: SpeechSynthesisVoice) => boolean): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState(() => voicesWhere(test).sort(naturalFirst));
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const on = () => setVoices(voicesWhere(test).sort(naturalFirst));
    window.speechSynthesis.addEventListener?.("voiceschanged", on);
    on();
    const t = setTimeout(on, 800); // some browsers load voices late without firing the event
    return () => {
      clearTimeout(t);
      window.speechSynthesis.removeEventListener?.("voiceschanged", on);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return voices;
}

const isEn = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace("_", "-").startsWith("en");
/** English voices, natural ones first, preferring South African / British / US English. */
export const useEnglishVoices = () => {
  const vs = useVoices(isEn);
  const pref = (v: SpeechSynthesisVoice) => (/en-za/i.test(v.lang) ? 0 : /en-gb/i.test(v.lang) ? 1 : /en-us/i.test(v.lang) ? 2 : 3) - (NATURAL.test(v.name) || /google/i.test(v.name) ? 10 : 0);
  return [...vs].sort((a, b) => pref(a) - pref(b));
};

/** Afrikaans voices on this device, natural ones first. */
export const useDeviceVoices = () => useVoices(isAf);
/** Dutch voices: an optional, clearly-labelled fallback when there's no Afrikaans voice. */
export const useDutchVoices = () => {
  const vs = useVoices(isNl);
  const pref = (v: SpeechSynthesisVoice) => (NATURAL.test(v.name) || /google|xander|claire|ellen|fenna|colette/i.test(v.name) ? 0 : 1) + (/nl-be/i.test(v.lang) ? 0.5 : 0);
  return [...vs].sort((a, b) => pref(a) - pref(b));
};
export const isNaturalVoice = (v: SpeechSynthesisVoice) => NATURAL.test(v.name);

/** Ask the app to explain how to get audio (shown when a speaker is tapped with no voice). */
export const NO_VOICE_EVENT = "leer-afrikaans:no-voice";

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

/** Respell Afrikaans so a Dutch voice says it (nearly) right. Dutch already reads g, ui, oe, ie,
 *  eu, ou, ei and -ig the Afrikaans way; these fix the main differences. */
export function dutchSpelling(text: string): string {
  return text
    .replace(/'n\b/gi, "un")
    .replace(/tjie/gi, (m) => (m[0] === "T" ? "Kie" : "kie"))
    .replace(/y/g, "ij").replace(/Y/g, "IJ")
    .replace(/ê/g, "è").replace(/ô/g, "o").replace(/û/g, "u").replace(/î/g, "i")
    .replace(/\bv/g, "f").replace(/\bV/g, "F");
}

export function speak(text: string, voice: SpeechSynthesisVoice, slow = false) {
  try {
    window.speechSynthesis.cancel();
    const dutch = voice.lang.toLowerCase().startsWith("nl");
    const u = new SpeechSynthesisUtterance(speakable(dutch ? dutchSpelling(text) : text));
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
