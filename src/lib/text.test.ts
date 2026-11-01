import { describe, expect, it } from "vitest";
import { checkAnswer, fold, normalise, tiles } from "./text";

describe("normalise / fold", () => {
  it("folds Afrikaans diacritics", () => {
    expect(fold("môre sê geëet")).toBe("more se geeet");
  });
  it("strips punctuation but keeps 'n", () => {
    expect(normalise("Ek het ’n hond!")).toBe("ek het 'n hond");
  });
  it("expands English contractions", () => {
    expect(normalise("I don't know.", "en")).toBe(normalise("I do not know", "en"));
  });
});

describe("checkAnswer", () => {
  it("accepts exact answers regardless of case and punctuation", () => {
    expect(checkAnswer("ek weet nie", ["Ek weet nie."], "af").status).toBe("correct");
  });
  it("accepts missing accents with a note", () => {
    const r = checkAnswer("Goeie more!", ["Goeie môre!"], "af");
    expect(r.status).toBe("correct");
    expect(r.status === "correct" && r.note).toContain("accents");
  });
  it("tolerates one typo in longer answers", () => {
    expect(checkAnswer("Ek praat Afrikans", ["Ek praat Afrikaans."], "af").status).toBe("correct");
  });
  it("gives targeted feedback for a missing second nie", () => {
    const r = checkAnswer("Ek praat nie Afrikaans", ["Ek praat nie Afrikaans nie."], "af");
    expect(r.status).toBe("wrong");
    expect(r.status === "wrong" && r.hint).toContain("second nie");
  });
  it("gives word-order feedback", () => {
    const r = checkAnswer("Vandag ek gaan skool toe", ["Vandag gaan ek skool toe."], "af");
    expect(r.status === "wrong" && r.hint).toContain("word order");
  });
  it("rejects wrong answers", () => {
    expect(checkAnswer("Ek is honger", ["Ek is dors."], "af").status).toBe("wrong");
  });
  it("accepts English contractions both ways", () => {
    expect(checkAnswer("I'm fine, thanks", ["I am fine, thanks."], "en").status).toBe("correct");
  });
});

describe("tiles", () => {
  it("keeps 'n as a tile and drops punctuation", () => {
    expect(tiles("'n Man en 'n vrou.")).toEqual(["'n", "Man", "en", "'n", "vrou"]);
  });
});
