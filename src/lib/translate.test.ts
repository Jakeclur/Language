import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { DictionaryData, Entry, Extras, Unit } from "../types";
import type { AppData } from "./data";
import { translateOffline } from "./translate";

const dictionary = JSON.parse(readFileSync("public/data/dictionary.json", "utf8")) as DictionaryData;
const units = (JSON.parse(readFileSync("public/data/course.json", "utf8")) as { units: Unit[] }).units;
const extras = JSON.parse(readFileSync("public/data/extras.json", "utf8")) as Extras;
const formIndex = new Map<string, Entry[]>();
for (const e of dictionary.entries) for (const f of Object.values(e.forms ?? {})) formIndex.set(String(f).toLowerCase(), [...(formIndex.get(String(f).toLowerCase()) ?? []), e]);
const data = { dictionary, units, extras, formIndex, byHeadword: new Map(dictionary.entries.map((e) => [e.headword.toLowerCase(), e])), byId: new Map(dictionary.entries.map((e) => [e.id, e])) } as unknown as AppData;

describe("offline translator", () => {
  it("uses the sentence memory for known phrases (both directions)", () => {
    const r = translateOffline(data, "Waar is die badkamer?", "af");
    expect(r.memory).toBe(true);
    expect(r.text).toBe("Where is the bathroom?");
    expect(translateOffline(data, "where is the bathroom", "en").text).toBe("Waar is die badkamer?");
  });
  it("translates unknown sentences word by word", () => {
    expect(translateOffline(data, "Die kat is baie groot.", "af").text.toLowerCase()).toBe("the cat is very big.");
    expect(translateOffline(data, "The cat is very big.", "en").text).toBe("Die kat is baie groot.");
  });
  it("recognises inflected forms and phrases", () => {
    const r = translateOffline(data, "honde", "af");
    expect(r.words[0].entry?.headword).toBe("hond");
    expect(translateOffline(data, "good morning", "en").text.toLowerCase()).toContain("goeie môre");
  });
  it("never outputs strong swear words for ordinary English; agrees verbs", () => {
    const r = translateOffline(data, "the box is crazy and nothing", "en");
    expect(r.text).not.toMatch(/\b(befok|fokkol|fok|kak)\b/);
    const agreed = translateOffline(data, "Ek is moeg en hulle het 'n hond.", "af");
    expect(agreed.text.toLowerCase()).toBe("i am tired and they have a dog.");
    expect(agreed.words.find((w) => w.source === "is")?.target).toBe("am");
    expect(translateOffline(data, "Die kat is groot.", "af").words.find((w) => w.source === "is")?.target).toBe("is");
  });
});
