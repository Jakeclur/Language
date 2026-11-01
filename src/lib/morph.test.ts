import { describe, expect, it } from "vitest";
import { lemmaCandidates, splitCompound } from "./morph";

describe("lemmaCandidates", () => {
  const cases: [string, string][] = [
    ["geëet", "eet"], ["gespeel", "speel"], ["opgestaan", "opstaan"], ["honde", "hond"], ["katte", "kat"],
    ["boeke", "boek"], ["kinders", "kind"], ["tafels", "tafel"], ["hondjie", "hond"], ["boompie", "boom"],
    ["tafeltjie", "tafel"], ["groter", "groot"], ["mooiste", "mooi"], ["bome", "boom"], ["strate", "straat"], ["ma's", "ma"],
  ];
  for (const [form, base] of cases) it(`${form} -> ${base}`, () => expect(lemmaCandidates(form)).toContain(base));
});

describe("splitCompound", () => {
  const words = new Set(["kombuis", "tafel", "skool", "boek", "werk", "tuin", "huis", "deur", "slaap", "kamer"]);
  const has = (w: string) => words.has(w);
  it("splits two-part compounds", () => expect(splitCompound("kombuistafel", has)).toEqual(["kombuis", "tafel"]));
  it("handles a linking -s-", () => expect(splitCompound("werkskamer", has)).toEqual(["werk", "kamer"]));
  it("splits three parts", () => expect(splitCompound("skoolboektafel", has)).toEqual(["skool", "boek", "tafel"]));
  it("returns null when it can't split", () => expect(splitCompound("xyzabc", has)).toBeNull());
});
