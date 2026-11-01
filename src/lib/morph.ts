// Afrikaans morphology helpers for dictionary lookup:
//  - lemmaCandidates("geëet") -> ["eet", ...]  (inflected form -> base form)
//  - splitCompound("kombuistafel", has) -> ["kombuis", "tafel"]

/** Possible base forms for an inflected Afrikaans word, most likely first. */
export function lemmaCandidates(word: string): string[] {
  const w = word.toLowerCase().trim();
  const out = new Set<string>();
  const add = (s: string) => s.length >= 2 && s !== w && out.add(s);
  const undouble = (s: string) => (/([bdfgklmnprst])\1$/.test(s) ? s.slice(0, -1) : s);

  // past participle: ge- prefix (geëet -> eet, gespeel -> speel, opgestaan -> opstaan)
  if (w.startsWith("geë")) add("e" + w.slice(3));
  if (w.startsWith("ge") && w.length > 4) add(w.slice(2));
  const mid = /^(aan|af|in|oop|op|toe|uit|terug|weg|saam|skoon|na|om|oor|deur|mee|by|voor|agter)ge(.+)$/.exec(w);
  if (mid) add(mid[1] + mid[2]);

  // diminutives (+ plural -s)
  const dim = w.replace(/s$/, "");
  for (const suf of ["etjie", "tjie", "jie", "pie", "kie", "ie"]) {
    if (dim.endsWith(suf) && dim.length > suf.length + 1) {
      const stem = dim.slice(0, -suf.length);
      add(stem);
      add(undouble(stem));
    }
  }
  // plurals
  if (w.endsWith("'s")) add(w.slice(0, -2));
  if (w.endsWith("ers")) add(w.slice(0, -3)); // kinders -> kind
  if (w.endsWith("ens")) add(w.slice(0, -3)); // beddens -> bed, ouens -> ou
  if (w.endsWith("e")) {
    const s = w.slice(0, -1);
    add(s);
    add(undouble(s)); // katte -> kat
    // long vowel restored: bome -> boom, strate -> straat, vrae -> vraag, dae -> dag
    add(s.replace(/([^aeiou])([aeou])([^aeiou])$/, "$1$2$2$3"));
    if (s.endsWith("a")) add(s + "g");
    if (s.endsWith("ae")) add(s.slice(0, -1) + "g");
  }
  if (w.endsWith("s")) add(w.slice(0, -1));
  // comparative / superlative / attributive
  if (w.endsWith("ste")) {
    add(w.slice(0, -3));
    add(w.slice(0, -4));
  }
  if (w.endsWith("er")) {
    add(w.slice(0, -2));
    add(undouble(w.slice(0, -2)));
    add(w.slice(0, -2).replace(/([^aeiou])([aeou])([^aeiou])$/, "$1$2$2$3")); // groter -> groot
  }
  if (w.endsWith("de") || w.endsWith("te")) add(w.slice(0, -1));
  return [...out];
}

/** Split a compound into known words. Allows linking -s- and -e- between parts.
 *  Returns the split with the fewest parts, or null if none. */
export function splitCompound(word: string, has: (w: string) => boolean, minPart = 3): string[] | null {
  const w = word.toLowerCase();
  if (w.length < minPart * 2) return null;
  const best: (string[] | null)[] = Array(w.length + 1).fill(null);
  best[0] = [];
  for (let i = 0; i < w.length; i++) {
    const cur = best[i];
    if (!cur) continue;
    for (let j = i + minPart; j <= w.length; j++) {
      const part = w.slice(i, j);
      if (!has(part)) continue;
      const candidates: [number, string[]][] = [[j, [...cur, part]]];
      // linking morpheme after a part, if more follows
      if (j < w.length - minPart && (w[j] === "s" || w[j] === "e")) candidates.push([j + 1, [...cur, part]]);
      for (const [end, parts] of candidates) {
        const existing = best[end];
        if (!existing || parts.length < existing.length) best[end] = parts;
      }
    }
  }
  const result = best[w.length];
  return result && result.length >= 2 ? result : null;
}
