// Reads the NWU/CTexT Afrikaans pronunciation dictionary and converts it to IPA.
// Line format: word POS stress syllable-lengths phone phone ...
//   lekker None 10 23 l qaeq k q r  ->  ˈlæ.kər

export function parsePronunciations(dict, phonemeMap) {
  const toIpa = new Map();
  for (const line of phonemeMap.split(/\r?\n/)) {
    const [ipa, sym] = line.split("\t");
    if (ipa && sym) toIpa.set(sym.trim(), ipa.trim());
  }
  const out = new Map();
  for (const line of dict.split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) continue;
    const [word, , stress, sylls, ...phones] = parts;
    const lengths = sylls.split("").map(Number);
    if (lengths.reduce((a, b) => a + b, 0) !== phones.length) continue;
    let i = 0;
    const syllables = lengths.map((len, s) => {
      const ipa = phones.slice(i, i + len).map((p) => toIpa.get(p) ?? p).join("");
      i += len;
      return (stress[s] === "1" && lengths.length > 1 ? "ˈ" : "") + ipa;
    });
    const key = word.toLowerCase();
    if (!out.has(key)) out.set(key, syllables.join(".").replace(/\.ˈ/g, "ˈ"));
  }
  return out;
}
