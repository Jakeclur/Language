// Text normalisation and answer checking (PLAN.md §7.4).

const FOLD: Record<string, string> = {
  ê: "e", ë: "e", é: "e", è: "e", ô: "o", ö: "o", ó: "o", û: "u", ü: "u", ú: "u", î: "i", ï: "i", í: "i", â: "a", ä: "a", á: "a",
};

/** Remove Afrikaans diacritics: "môre" -> "more" */
export const fold = (s: string) => s.replace(/[êëéèôöóûüúîïíâäá]/g, (c) => FOLD[c] ?? c);

const EN_CONTRACTIONS: [RegExp, string][] = [
  [/\bi'm\b/g, "i am"], [/\byou're\b/g, "you are"], [/\bwe're\b/g, "we are"], [/\bthey're\b/g, "they are"],
  [/\bhe's\b/g, "he is"], [/\bshe's\b/g, "she is"], [/\bit's\b/g, "it is"], [/\bthat's\b/g, "that is"],
  [/\bwhat's\b/g, "what is"], [/\bwhere's\b/g, "where is"], [/\bhow's\b/g, "how is"], [/\bdon't\b/g, "do not"],
  [/\bdoesn't\b/g, "does not"], [/\bdidn't\b/g, "did not"], [/\bisn't\b/g, "is not"], [/\baren't\b/g, "are not"],
  [/\bcan't\b/g, "cannot"], [/\bcouldn't\b/g, "could not"], [/\bwon't\b/g, "will not"], [/\bi'll\b/g, "i will"],
  [/\bi'd\b/g, "i would"], [/\bi've\b/g, "i have"], [/\bwe'll\b/g, "we will"], [/\bthe water's\b/g, "the water is"],
];

/** Lower-case, unify apostrophes, strip punctuation and extra spaces. */
export function normalise(s: string, lang: "af" | "en" = "af"): string {
  let t = s.toLowerCase().replace(/[’‘`´]/g, "'").replace(/[“”"]/g, "");
  if (lang === "en") for (const [re, rep] of EN_CONTRACTIONS) t = t.replace(re, rep);
  // keep the apostrophe in 'n, drop other punctuation
  t = t.replace(/[.,!?;:()¿¡…-]/g, " ").replace(/\s+/g, " ").trim();
  if (lang === "en") t = t.replace(/\bcan not\b/g, "cannot");
  return t;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

export type CheckResult =
  | { status: "correct"; note?: string; matched: string }
  | { status: "wrong"; hint?: string; expected: string };

/** Compare a learner's answer with the accepted answers. */
export function checkAnswer(input: string, answers: string[], lang: "af" | "en"): CheckResult {
  const given = normalise(input, lang);
  if (!given) return { status: "wrong", expected: answers[0] };
  for (const a of answers) if (normalise(a, lang) === given) return { status: "correct", matched: a };
  // missing diacritics: correct, but point it out
  for (const a of answers)
    if (fold(normalise(a, lang)) === fold(given)) return { status: "correct", matched: a, note: `Watch the accents: **${a}**` };
  // small typos: 1 in answers of 6+ letters, 2 in answers of 20+ letters
  for (const a of answers) {
    const n = fold(normalise(a, lang));
    const allowed = n.length >= 20 ? 2 : n.length >= 6 ? 1 : 0;
    if (allowed && levenshtein(n, fold(given)) <= allowed) return { status: "correct", matched: a, note: `Small typo. The answer is **${a}**` };
  }
  // English answers: a/an/the and "very/really" are often added or dropped, which is fine
  if (lang === "en") {
    const loose = (s: string) => normalise(s, "en").replace(/\b(a|an|the|very|really|so)\b/g, " ").replace(/\s+/g, " ").trim();
    for (const a of answers) if (loose(a) === loose(input)) return { status: "correct", matched: a, note: `Also correct: **${a}**` };
  }
  // targeted Afrikaans feedback
  if (lang === "af") {
    for (const a of answers) {
      const n = normalise(a, "af");
      if (n.endsWith(" nie") && given === n.replace(/ nie$/, ""))
        return { status: "wrong", expected: a, hint: "Remember the **second nie** at the end of a negative sentence." };
      const aw = n.split(" ");
      const gw = given.split(" ");
      if (aw.length === gw.length && [...aw].sort().join(" ") === [...gw].sort().join(" "))
        return { status: "wrong", expected: a, hint: "All the right words, but the **word order** is off. Check where the verb goes." };
      if (aw.some((w) => w.startsWith("ge")) && gw.length === aw.length && !gw.some((w) => w.startsWith("ge")))
        return { status: "wrong", expected: a, hint: "Past tense needs **het + ge-** (e.g. *gespeel*)." };
    }
  }
  return { status: "wrong", expected: answers[0] };
}

/** Split an Afrikaans sentence into word tiles, keeping 'n as one tile. */
export function tiles(sentence: string): string[] {
  return sentence.replace(/[.,!?;:]/g, "").split(/\s+/).filter(Boolean);
}

export function shuffle<T>(arr: T[], rand = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
