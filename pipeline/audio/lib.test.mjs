import { describe, expect, it } from "vitest";
import { audioKey, wer } from "./lib.mjs";
import { normalise } from "../../src/lib/text.ts";

describe("audio pipeline", () => {
  it("audioKey matches the app's lookup key", () => {
    for (const s of ["Goeie môre!", "Ja-nee, dit is warm vandag.", "Ek het ’n hond.", "Hoe gaan dit?"]) expect(audioKey(s)).toBe(normalise(s, "af"));
  });
  it("computes word error rate with accent folding", () => {
    expect(wer("Goeie môre, hoe gaan dit?", "goeie more hoe gaan dit")).toBe(0);
    expect(wer("Ek praat nie Afrikaans nie", "ek praat nie afrikaans")).toBeCloseTo(0.2);
  });
});
