// Parser for Apertium bilingual .dix files: <e><p><l>eng<s n="n"/></l><r>afr<s n="n"/></r></p></e>
const POS = { n: "noun", np: "proper noun", vblex: "verb", vaux: "verb", vbmod: "verb", adj: "adj", adv: "adv", preadv: "adv", cnjadv: "conj", cnjcoo: "conj", cnjsub: "conj", pr: "prep", prn: "pron", det: "det", num: "num", ij: "interj" };

const clean = (s) =>
  s
    .replace(/<s [^>]*\/>/g, "")
    .replace(/<b\/>/g, " ")
    .replace(/<g>|<\/g>|<#\/>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/’/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

/** @returns {{ en: string, af: string, pos?: string }[]} */
export function parseDix(xml) {
  const out = [];
  for (const m of xml.matchAll(/<e(?:\s[^>]*)?>\s*<p>\s*<l>([\s\S]*?)<\/l>\s*<r>([\s\S]*?)<\/r>\s*<\/p>/g)) {
    const tag = /<s n="([a-z]+)"\/>/.exec(m[1])?.[1];
    const en = clean(m[1]);
    const af = clean(m[2]);
    if (!en || !af || tag === "np") continue; // skip proper nouns
    out.push({ en, af, pos: POS[tag] });
  }
  return out;
}
