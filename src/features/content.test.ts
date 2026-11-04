// Checks every lesson and exercise in the built course data (run `npm run content` first; `npm test` does).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { DictionaryData, Unit, Entry } from "../types";
import { buildSession, meaning, overlaps, taughtUpTo, type Generated } from "./course";
import { checkAnswer, normalise, tiles } from "../lib/text";
import { speakable } from "../lib/audio";
import type { AppData } from "../lib/data";
import type { Progress, Settings } from "../lib/store";

const dictionary = JSON.parse(readFileSync("public/data/dictionary.json", "utf8")) as DictionaryData;
const units = (JSON.parse(readFileSync("public/data/course.json", "utf8")) as { units: Unit[] }).units;
const byHeadword = new Map(dictionary.entries.map((e) => [e.headword.toLowerCase(), e]));
const byId = new Map(dictionary.entries.map((e) => [e.id, e]));
const data = { dictionary, byHeadword, byId, units, audio: { voices: [], items: {} } } as unknown as AppData;
const settings: Settings = { onboarded: true, goals: [], adultConfirmed: true, showStreet: true, showSlurs: false, unlockAll: true, dailyGoal: 30 };
const progress: Progress = { xp: 0, days: {}, lessons: {}, cards: {}, answered: 0, correct: 0 };
const lessons = units.flatMap((u) => u.lessons.map((l) => ({ u, l })));

describe("authored exercises", () => {
  for (const { l } of lessons)
    it(`${l.id}: every exercise is answerable with its own answer`, () => {
      for (const ex of l.exercises) {
        switch (ex.type) {
          case "translate":
            for (const a of ex.answers) expect(checkAnswer(a, ex.answers, ex.from === "en" ? "af" : "en").status).toBe("correct");
            break;
          case "order":
            expect(normalise(tiles(ex.af).join(" "))).toBe(normalise(ex.af));
            expect(tiles(ex.af).length).toBeGreaterThan(1);
            break;
          case "fill":
            expect(ex.af).toContain("___");
            if (ex.options) {
              expect(ex.options.some((o) => ex.answers.includes(o))).toBe(true);
              expect(new Set(ex.options).size).toBe(ex.options.length);
            }
            break;
          case "choice":
            expect(ex.options).toContain(ex.answer);
            expect(new Set(ex.options).size).toBe(ex.options.length);
            break;
          case "transform":
            expect(ex.answers.length).toBeGreaterThan(0);
            expect(normalise(ex.answers[0])).not.toBe(normalise(ex.from));
            break;
          case "rude":
            expect(ex.answer).toBeGreaterThanOrEqual(0);
            expect(ex.answer).toBeLessThanOrEqual(4);
            break;
        }
      }
      for (const e of l.examples) expect(e.en.length).toBeGreaterThan(0);
    });
});

describe("generated quizzes never have two right answers", () => {
  for (const { l } of lessons)
    it(`${l.id}`, () => {
      for (let run = 0; run < 25; run++) {
        for (const step of buildSession(l, data, settings, progress, true)) {
          if (step.kind !== "exercise") continue;
          const ex = step.ex as Generated;
          if (ex.type === "mc") {
            expect(new Set(ex.options).size).toBe(ex.options.length);
            const entry = byId.get(ex.entryId)!;
            const others = ex.options.filter((o) => o !== ex.answer);
            for (const o of others) {
              const other = ex.promptLang === "af"
                ? dictionary.entries.find((d) => meaning(d, settings) === o)!
                : byHeadword.get(o.toLowerCase())!;
              expect(overlaps(entry, other as Entry, settings), `${ex.prompt}: "${o}" is also right`).toBe(false);
            }
          }
          if (ex.type === "match") expect(new Set(ex.pairs.map((p) => p[1])).size).toBe(ex.pairs.length);
          if (ex.type === "listen") expect(new Set(ex.options).size).toBe(ex.options.length);
        }
      }
    });
});

describe("quizzes only use words already taught", () => {
  for (const { l } of lessons)
    it(`${l.id}`, () => {
      const taught = taughtUpTo(l, data);
      const heads = new Set(taught.map((e) => e.headword));
      const means = new Set(taught.map((e) => meaning(e, settings)));
      for (let run = 0; run < 15; run++)
        for (const step of buildSession(l, data, settings, progress, true)) {
          if (step.kind === "intro") expect(l.vocab).toContain(step.entry.headword);
          if (step.kind !== "exercise") continue;
          const ex = step.ex as Generated;
          if (ex.type === "mc") for (const o of ex.options) expect(ex.promptLang === "af" ? means.has(o) : heads.has(o), `"${o}" not taught yet`).toBe(true);
          if (ex.type === "listen") for (const o of ex.options) expect(means.has(o), `"${o}" not taught yet`).toBe(true);
          if (ex.type === "match") for (const [a] of ex.pairs) expect(l.vocab).toContain(a);
        }
    });
});

describe("every new word is introduced before it is tested", () => {
  for (const { l } of lessons)
    it(`${l.id}`, () => {
      const steps = buildSession(l, data, settings, progress, true);
      const intros = steps.filter((s) => s.kind === "intro").map((s) => (s.kind === "intro" ? s.entry.headword : ""));
      for (const v of l.vocab) expect(intros, `"${v}" has no introduction`).toContain(byHeadword.get(v.toLowerCase())!.headword);
      const firstExercise = steps.findIndex((s) => s.kind === "exercise");
      expect(steps.slice(firstExercise).every((s) => s.kind === "exercise")).toBe(true);
    });
});

describe("speech text", () => {
  it("adds sentence punctuation and capitals for natural intonation", () => {
    expect(speakable("goed")).toBe("Goed.");
    expect(speakable("hoe gaan dit")).toBe("Hoe gaan dit?");
    expect(speakable("Ek weet nie.")).toBe("Ek weet nie.");
    expect(speakable("'n hond")).toBe("'n Hond.");
    expect(speakable("Ek het 'n babbelas (hangover)")).toBe("Ek het 'n babbelas.");
  });
});
