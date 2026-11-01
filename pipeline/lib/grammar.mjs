// Rule-based checks for Afrikaans sentences. These catch the most common
// grammar errors in example sentences and exercises without a human reviewer.
// Each rule returns issues: { rule, level: "error" | "warning", message }.

export const NEGATORS = ["nie", "niks", "niemand", "nooit", "geen", "nêrens", "moenie", "hoef"];
export const PRONOUNS = ["ek", "jy", "u", "hy", "sy", "ons", "julle", "hulle", "dit", "mens"];
const FRONT_ADVERBS = ["vandag", "môre", "gister", "nou", "hier", "daar", "toe", "dan", "soms", "altyd", "gewoonlik", "eers", "later", "vanaand", "vanoggend", "netnou", "miskien"];
const SUBORDINATORS = ["omdat", "dat", "as", "wanneer", "terwyl", "hoewel", "sodat", "voordat", "nadat", "totdat", "indien", "aangesien"];
const FINITE_SIMPLE = ["is", "het", "was"];

/** Split a sentence into lower-case word tokens (keeps ê, ë, ' and -). */
export function tokenize(sentence) {
  return (sentence.toLowerCase().match(/'n|[\p{L}\p{M}'-]+/gu) ?? []).filter(Boolean);
}

/** Split into clauses on commas, semicolons and sentence punctuation. */
function clauses(sentence) {
  return sentence.split(/[,;:.!?]+/).map((c) => tokenize(c)).filter((c) => c.length);
}

const rules = [
  {
    id: "double-negation",
    check(sentence) {
      const issues = [];
      for (const words of sentence.split(/[.!?,;]+/).map(tokenize).filter((w) => w.length)) {
        const hasNegator = words.some((w, i) => NEGATORS.includes(w) && !(w === "hoef" && words[i + 1] !== "nie") );
        if (!hasNegator) continue;
        // Short answers like "Nee, dankie" or a lone "Nie!" are fine.
        if (words.length <= 2) continue;
        const last = words[words.length - 1];
        if (last !== "nie" && last !== "moenie")
          issues.push({
            level: "error",
            message: `Negative sentence should end with "nie" (double negation): "${words.join(" ")}"`,
          });
      }
      return issues;
    },
  },
  {
    id: "verb-second",
    check(sentence) {
      const issues = [];
      for (const words of clauses(sentence)) {
        if (words.length >= 3 && FRONT_ADVERBS.includes(words[0]) && PRONOUNS.includes(words[1]) && words[1] !== "dit")
          issues.push({
            level: "error",
            message: `Verb must come second: after "${words[0]}" the verb goes before "${words[1]}" (e.g. "${words[0]} [verb] ${words[1]}…")`,
          });
      }
      return issues;
    },
  },
  {
    id: "verb-final",
    check(sentence) {
      const issues = [];
      for (const words of clauses(sentence)) {
        for (let i = 0; i < words.length - 3; i++) {
          if (SUBORDINATORS.includes(words[i]) && PRONOUNS.includes(words[i + 1]) && FINITE_SIMPLE.includes(words[i + 2]))
            issues.push({
              level: "error",
              message: `After "${words[i]}" the verb "${words[i + 2]}" moves to the end of the clause`,
            });
        }
      }
      return issues;
    },
  },
  {
    id: "article-n",
    check(sentence) {
      return /(^|\s)n\s/.test(sentence)
        ? [{ level: "error", message: `The indefinite article is written 'n (with an apostrophe)` }]
        : [];
    },
  },
  {
    id: "capital-after-n",
    check(sentence) {
      // A sentence starting with 'n capitalises the next word: "'n Hond blaf."
      return /^'N\s/.test(sentence) ? [{ level: "warning", message: `Sentence-initial 'n stays lower-case: "'n Hond…"` }] : [];
    },
  },
];

/** Run every grammar rule on a sentence. */
export function checkGrammar(sentence) {
  return rules.flatMap((r) => r.check(sentence).map((i) => ({ rule: r.id, ...i })));
}

/** Words in the sentence that the spellchecker doesn't know.
 *  Skips names (capitalised words after the first), English hints in (brackets),
 *  numbers, and contractions like hy's / dis. */
export function unknownWords(sentence, wordSet, extra = new Set()) {
  const clean = sentence.replace(/\([^)]*\)/g, " ");
  const raw = clean.match(/'n|[\p{L}\p{M}'-]+/gu) ?? [];
  const out = [];
  raw.forEach((tok, i) => {
    if (tok === "'n") return;
    if (i > 0 && /^\p{Lu}/u.test(tok)) return; // a name
    for (let part of tok.toLowerCase().split("-")) {
      part = part.replace(/'s$/, "");
      if (!part || /^\d/.test(part)) continue;
      if (!wordSet.has(part) && !extra.has(part)) out.push(part);
    }
  });
  return out;
}
