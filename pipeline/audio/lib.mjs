// Shared helpers for the audio pipeline (PLAN.md §6).
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/** Must match src/lib/text.ts normalise(…, "af") — it's the key the app looks audio up by. */
export function audioKey(s) {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”"]/g, "")
    .replace(/[.,!?;:()¿¡…-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const fileId = (text) => createHash("sha1").update(audioKey(text)).digest("hex").slice(0, 16);

export const VOICES = {
  // Azure AI Speech neural voices (af-ZA): clear and controllable. Used for words and example sentences.
  "azure-adri": { engine: "azure", voice: "af-ZA-AdriNeural", name: "Adri (female)", gender: "female" },
  "azure-willem": { engine: "azure", voice: "af-ZA-WillemNeural", name: "Willem (male)", gender: "male" },
  // ElevenLabs: most expressive. Used for dialogues, phrasebook and slang. Set the voice IDs you picked in the bake-off.
  "eleven-f": { engine: "elevenlabs", voice: process.env.ELEVENLABS_VOICE_FEMALE, name: "ElevenLabs (female)", gender: "female" },
  "eleven-m": { engine: "elevenlabs", voice: process.env.ELEVENLABS_VOICE_MALE, name: "ElevenLabs (male)", gender: "male" },
};

/** Everything in the app that needs audio, with a kind that decides which voices read it. */
export function collectTexts(root) {
  const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
  const items = new Map(); // key -> { text, kind }
  const add = (text, kind) => {
    if (!text) return;
    const k = audioKey(text);
    if (!k || items.has(k)) return;
    items.set(k, { text: text.replace(/\s*\([^)]*\)\s*/g, " ").trim(), kind });
  };
  const course = read("public/data/course.json");
  const dict = read("public/data/dictionary.json");
  const extras = read("public/data/extras.json");
  const byHead = new Map(dict.entries.map((e) => [e.headword.toLowerCase(), e]));
  for (const u of course.units)
    for (const l of u.lessons) {
      for (const v of l.vocab) add(v, "word");
      for (const ex of l.examples) add(ex.af, u.street || u.id.startsWith("b1-15") ? "expressive" : "sentence");
      for (const ex of l.exercises) {
        if (ex.type === "translate" && ex.from === "af") add(ex.prompt, "sentence");
        if (ex.type === "transform") add(ex.from, "sentence");
        if (ex.type === "rude") add(ex.af, "expressive");
      }
    }
  for (const g of extras.phrasebook) for (const p of g.phrases) add(p.af, "expressive");
  for (const s of extras.pronunciation) for (const w of s.example.split(" / ")) add(w, "word");
  // Dictionary: curated entries and the most frequent words first
  const ranked = [...dict.entries].sort((a, b) => (a.frequencyRank ?? 1e9) - (b.frequencyRank ?? 1e9));
  for (const e of ranked) {
    if (e.senses.every((s) => s.register === "offensive-slur")) continue; // never auto-play slurs
    if (e.verification.confidence === "unverified" && !e.verification.sources.includes("editorial")) continue;
    add(e.headword, "word");
    for (const s of e.senses) for (const ex of s.examples ?? []) add(ex.af, "sentence");
  }
  void byHead;
  return [...items.values()];
}

export function loadOverrides(root) {
  const p = join(root, "content", "pronunciation-overrides.json");
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
}

/** Word error rate between expected and recognised text (after normalisation and accent folding). */
export function wer(expected, heard) {
  const fold = (s) => audioKey(s).normalize("NFD").replace(/\p{M}/gu, "");
  const a = fold(expected).split(" ").filter(Boolean);
  const b = fold(heard).split(" ").filter(Boolean);
  if (!a.length) return b.length ? 1 : 0;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length] / a.length;
}
