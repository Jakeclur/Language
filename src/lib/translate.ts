// Built-in translator.
//  1. Sentence memory: exact matches from the phrasebook, lessons and dictionary examples.
//  2. Offline word-by-word: longest dictionary phrase first, inflected forms recognised.
//  3. Optional online translation (MyMemory, free, no key) for whole sentences.
import type { AppData } from "./data";
import type { Entry } from "../types";
import { fold, normalise } from "./text";
import { lemmaCandidates } from "./morph";

export type Lang = "af" | "en";
export interface WordGloss { source: string; target: string; entry?: Entry; known: boolean }
export interface OfflineResult { text: string; memory: boolean; words: WordGloss[] }

interface Memory { af: Map<string, string>; en: Map<string, string> }
interface ReverseIndex { byGloss: Map<string, Entry[]>; maxWords: number }
let memo: { data: AppData; memory: Memory; reverse: ReverseIndex; afMax: number } | null = null;

const key = (s: string, lang: Lang) => fold(normalise(s, lang)).replace(/[.!?]+$/, "").trim();
const isOffensive = (e: Entry) => e.senses.every((s) => s.register === "offensive-slur" || (s.severity ?? 0) >= 3);

function prepare(data: AppData) {
  if (memo?.data === data) return memo;
  const memory: Memory = { af: new Map(), en: new Map() };
  const addPair = (af: string, en: string) => {
    const a = key(af, "af"), e = key(en, "en");
    if (a && !memory.af.has(a)) memory.af.set(a, en);
    if (e && !memory.en.has(e)) memory.en.set(e, af);
  };
  for (const g of data.extras.phrasebook) for (const p of g.phrases) addPair(p.af, p.en.replace(/\s*\([^)]*\)/g, ""));
  for (const u of data.units) for (const l of u.lessons) for (const ex of l.examples) addPair(ex.af, ex.en);
  for (const e of data.dictionary.entries) for (const s of e.senses) for (const ex of s.examples ?? []) addPair(ex.af, ex.en);

  // English gloss -> Afrikaans entries, best first (curated, verified, common)
  const raw = new Map<string, { e: Entry; r: number }[]>();
  let maxWords = 1;
  const rank = (e: Entry) =>
    (e.verification.sources.includes("editorial") ? 0 : 1e6) + (e.verification.confidence === "verified" ? 0 : e.verification.confidence === "checked" ? 1e5 : 5e5) + (e.frequencyRank ?? 9e4);
  for (const e of data.dictionary.entries) {
    if (isOffensive(e)) continue;
    e.senses.forEach((s, si) => {
      if ((s.severity ?? 0) >= 2 || s.register === "offensive-slur") return;
      s.translations.forEach((t, ti) => {
        const g = key(t.replace(/\([^)]*\)/g, "").replace(/^to /i, ""), "en");
        if (!g || g.length > 40) return;
        maxWords = Math.max(maxWords, Math.min(4, g.split(" ").length));
        raw.set(g, [...(raw.get(g) ?? []), { e, r: rank(e) + si * 1000 + ti * 10 }]);
      });
    });
  }
  const byGloss = new Map<string, Entry[]>();
  for (const [g, list] of raw) byGloss.set(g, list.sort((a, b) => a.r - b.r).map((x) => x.e));
  const afMax = Math.min(4, Math.max(...data.dictionary.entries.map((e) => e.headword.split(" ").length)));
  memo = { data, memory, reverse: { byGloss, maxWords }, afMax };
  return memo;
}

/** The main English meaning of an Afrikaans entry (first curated/common translation). */
export function mainGloss(e: Entry): string {
  const s = e.senses.find((x) => (x.severity ?? 0) < 2 && x.register !== "offensive-slur") ?? e.senses[0];
  return s.translations[0].replace(/\s*\([^)]*\)/g, "").replace(/^to /, "");
}

function lookupAf(data: AppData, word: string): Entry | undefined {
  const w = word.toLowerCase();
  const direct = data.byHeadword.get(w) ?? data.formIndex.get(w)?.[0];
  if (direct) return direct;
  for (const c of lemmaCandidates(w)) {
    const e = data.byHeadword.get(c);
    if (e) return e;
  }
  return undefined;
}

/** English verb agreement after a word-by-word pass: "ek is" -> "I am", "hulle het" -> "they have". */
function agree(parts: string[], srcs: string[]) {
  const toks = srcs;
  const subj: Record<string, "1s" | "3s" | "pl"> = { ek: "1s", hy: "3s", sy: "3s", dit: "3s", jy: "pl", u: "pl", ons: "pl", julle: "pl", hulle: "pl" };
  for (let i = 0; i < parts.length; i++) {
    const t = toks[i]?.toLowerCase();
    if (t !== "is" && t !== "het" && t !== "was") continue;
    // nearest pronoun just before (normal order) or just after (question / verb-second)
    const near = [toks[i - 1], toks[i + 1]].map((x) => x?.toLowerCase()).find((x) => x && subj[x]);
    const p = near ? subj[near] : "3s";
    if (t === "is") parts[i] = p === "1s" ? "am" : p === "pl" ? "are" : "is";
    if (t === "het") parts[i] = p === "3s" ? "has" : "have";
    if (t === "was") parts[i] = p === "pl" ? "were" : "was";
  }
  if (parts.length && toks[0]?.toLowerCase() === "ek") parts[0] = "I";
}

/** Offline translation: sentence memory first, then longest-phrase word-by-word. */
export function translateOffline(data: AppData, text: string, from: Lang): OfflineResult {
  const m = prepare(data);
  const words: WordGloss[] = [];
  const out: string[] = [];
  // sentence by sentence, so memory matches work inside longer text
  const sentences = text.match(/[^.!?\n]+[.!?]*|\n/g) ?? [];
  let allMemory = sentences.length > 0;
  for (const sentence of sentences) {
    if (sentence === "\n") { out.push("\n"); continue; }
    const hit = (from === "af" ? m.memory.af : m.memory.en).get(key(sentence, from));
    const toks = sentence.match(/'n|[\p{L}\p{M}'-]+|\d+/gu) ?? [];
    if (hit) {
      out.push(hit);
      // still give the learner a word breakdown
      if (from === "af") for (const t of toks) { const e = lookupAf(data, t); words.push({ source: t, target: e ? mainGloss(e) : t, entry: e, known: !!e }); }
      continue;
    }
    allMemory = false;
    const parts: string[] = [];
    const srcs: string[] = []; // source phrase for each part (parts and srcs stay aligned)
    const firstWord = words.length;
    for (let i = 0; i < toks.length; ) {
      let matched = false;
      const max = from === "af" ? m.afMax : m.reverse.maxWords;
      for (let n = Math.min(max, toks.length - i); n >= 1 && !matched; n--) {
        const phrase = toks.slice(i, i + n).join(" ");
        if (/^\d+$/.test(phrase)) { parts.push(phrase); srcs.push(phrase); words.push({ source: phrase, target: phrase, known: true }); i += 1; matched = true; break; }
        if (from === "af") {
          const e = n === 1 ? lookupAf(data, phrase) : data.byHeadword.get(phrase.toLowerCase());
          if (e && !isOffensive(e)) { const g = mainGloss(e); parts.push(g); srcs.push(phrase); words.push({ source: phrase, target: g, entry: e, known: true }); i += n; matched = true; }
        } else {
          let g = key(phrase, "en");
          let list = m.reverse.byGloss.get(g);
          if (!list && n === 1) { // plurals and verb forms: dogs -> dog, eats -> eat, playing -> play
            for (const v of [g.replace(/ies$/, "y"), g.replace(/es$/, ""), g.replace(/s$/, ""), g.replace(/ing$/, ""), g.replace(/ed$/, "")]) {
              if (v !== g && m.reverse.byGloss.has(v)) { list = m.reverse.byGloss.get(v); g = v; break; }
            }
          }
          if (list?.length) { const e = list[0]; parts.push(e.headword); srcs.push(phrase); words.push({ source: phrase, target: e.headword, entry: e, known: true }); i += n; matched = true; }
        }
      }
      if (!matched) { parts.push(toks[i]); srcs.push(toks[i]); words.push({ source: toks[i], target: toks[i], known: false }); i += 1; }
    }
    if (from === "af") {
      agree(parts, srcs);
      parts.forEach((pt, j) => { if (words[firstWord + j]) words[firstWord + j].target = pt; });
    }
    let sentenceOut = parts.join(" ");
    if (from === "en") sentenceOut = sentenceOut.replace(/^'n /, "'n ").replace(/^(\p{Ll})/u, (c) => c.toUpperCase());
    const end = sentence.trim().match(/[.!?]+$/)?.[0] ?? "";
    out.push(sentenceOut + end);
  }
  return { text: out.join(" ").replace(/ \n /g, "\n").trim(), memory: allMemory, words };
}

/** Online translation via MyMemory (free, no key, ~5000 characters per day). */
export async function translateOnline(text: string, from: Lang, signal?: AbortSignal): Promise<string | null> {
  const to = from === "af" ? "en" : "af";
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 480))}&langpair=${from}|${to}`, { signal });
    if (!res.ok) return null;
    const json = await res.json();
    const t: string | undefined = json?.responseData?.translatedText;
    if (!t || json.responseStatus !== 200 || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(t)) return null;
    return t;
  } catch {
    return null;
  }
}
