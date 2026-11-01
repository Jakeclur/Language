import { describe, expect, it } from "vitest";
import { checkGrammar, tokenize } from "./grammar.mjs";

const rulesHit = (s) => checkGrammar(s).filter((i) => i.level === "error").map((i) => i.rule);

describe("grammar rules", () => {
  it("tokenizes Afrikaans with diacritics and 'n", () => {
    expect(tokenize("'n Man sê: Môre!")).toEqual(["'n", "man", "sê", "môre"]);
  });
  it("accepts correct double negation", () => {
    expect(rulesHit("Ek praat nie Afrikaans nie.")).toEqual([]);
    expect(rulesHit("Ek weet nie.")).toEqual([]);
    expect(rulesHit("Hy het niks gesê nie.")).toEqual([]);
    expect(rulesHit("Moenie so raas nie!")).toEqual([]);
  });
  it("flags a missing second nie", () => {
    expect(rulesHit("Ek praat nie Afrikaans.")).toContain("double-negation");
    expect(rulesHit("Niemand het gekom.")).toContain("double-negation");
  });
  it("flags verb-second violations", () => {
    expect(rulesHit("Vandag ek gaan skool toe.")).toContain("verb-second");
    expect(rulesHit("Vandag gaan ek skool toe.")).toEqual([]);
  });
  it("flags verb-final violations in subordinate clauses", () => {
    expect(rulesHit("Ek slaap, omdat ek is moeg.")).toContain("verb-final");
    expect(rulesHit("Ek slaap omdat ek moeg is.")).toEqual([]);
  });
  it("flags a missing apostrophe in 'n", () => {
    expect(rulesHit("Ek het n hond.")).toContain("article-n");
    expect(rulesHit("Ek het 'n hond.")).toEqual([]);
  });
});
