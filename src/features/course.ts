import type { Entry, Exercise, Lesson, Unit } from "../types";
import type { AppData } from "../lib/data";
import type { Settings, Progress } from "../lib/store";
import { shuffle } from "../lib/text";
import { visibleSenses } from "../lib/register";

export type Generated =
  | { type: "mc"; prompt: string; promptLang: "af" | "en"; options: string[]; answer: string; entryId: string }
  | { type: "match"; pairs: [string, string][] }
  | { type: "type-word"; en: string; answers: string[]; entryId: string }
  | { type: "listen"; text: string; options: string[]; answer: string }
  | { type: "dictation"; text: string; en: string };

export type Step = { kind: "intro"; entry: Entry } | { kind: "exercise"; ex: Exercise | Generated; retry?: boolean };

export interface LessonRef { unit: Unit; lesson: Lesson; index: number }

export function visibleUnits(units: Unit[], settings: Settings): Unit[] {
  return units.filter((u) => !u.street || (settings.adultConfirmed && settings.showStreet));
}

export function lessonList(units: Unit[], settings: Settings): LessonRef[] {
  const out: LessonRef[] = [];
  for (const unit of visibleUnits(units, settings)) for (const lesson of unit.lessons) out.push({ unit, lesson, index: out.length });
  return out;
}

export function isUnlocked(ref: LessonRef, all: LessonRef[], settings: Settings, progress: Progress): boolean {
  if (settings.unlockAll || ref.index === 0 || ref.unit.street) return true;
  if (progress.lessons[ref.lesson.id]) return true;
  const prev = all[ref.index - 1];
  return !!prev && !!progress.lessons[prev.lesson.id];
}

export function nextLesson(all: LessonRef[], progress: Progress): LessonRef | undefined {
  return all.find((r) => !progress.lessons[r.lesson.id] && !r.unit.street) ?? all[0];
}

/** Main English meaning of an entry, respecting the age gate. */
export function meaning(e: Entry, settings: Settings): string {
  const s = visibleSenses(e, settings)[0] ?? e.senses[0];
  return s.translations.slice(0, 3).join("; ");
}

export function vocabEntries(lesson: Lesson, data: AppData): Entry[] {
  return lesson.vocab.map((v) => data.byHeadword.get(v.toLowerCase())).filter((e): e is Entry => !!e);
}

/** Every word taught up to and including this lesson, in course order. Quizzes only ever use these,
 *  so a learner never meets a word they haven't been taught. */
export function taughtUpTo(lesson: Lesson, data: AppData): Entry[] {
  const out = new Map<string, Entry>();
  for (const u of [...data.units].sort((a, b) => a.number - b.number))
    for (const l of u.lessons) {
      for (const e of vocabEntries(l, data)) out.set(e.id, e);
      if (l.id === lesson.id) return [...out.values()];
    }
  return [...out.values()];
}

/** Normalised English glosses of an entry's main meaning, for spotting synonyms. */
export function glossSet(e: Entry, settings: Settings): Set<string> {
  const s = visibleSenses(e, settings)[0] ?? e.senses[0];
  return new Set(s.translations.map((t) => t.toLowerCase().replace(/\([^)]*\)/g, "").replace(/^to /, "").trim()).filter(Boolean));
}

/** Do two entries share a meaning? Then they must never be each other's wrong answer. */
export function overlaps(a: Entry, b: Entry, settings: Settings): boolean {
  if (a.headword.toLowerCase() === b.headword.toLowerCase()) return true;
  const ga = glossSet(a, settings);
  for (const g of glossSet(b, settings)) if (ga.has(g)) return true;
  return meaning(a, settings) === meaning(b, settings);
}

/** Wrong options that are clearly wrong: no shared meaning with the answer or with each other. */
export function distractorsFor(e: Entry, pool: Entry[], settings: Settings, n = 3): Entry[] {
  const out: Entry[] = [];
  for (const d of shuffle(pool)) {
    if (out.length >= n) break;
    if (overlaps(d, e, settings) || out.some((o) => overlaps(o, d, settings))) continue;
    out.push(d);
  }
  return out;
}

/** A lesson session: introduce new words, then mixed generated + authored exercises.
 *  `canListen` adds listening and dictation practice when natural audio is available. */
export function buildSession(lesson: Lesson, data: AppData, settings: Settings, progress: Progress, canListen = false): Step[] {
  const vocab = vocabEntries(lesson, data);
  const steps: Step[] = [];
  const fresh = vocab.filter((e) => !progress.cards[e.id]);
  // every new word is introduced (with its pronunciation) before it is tested
  for (const e of fresh) steps.push({ kind: "intro", entry: e });

  // wrong options come only from words already taught (this lesson first, then earlier ones)
  const pool = taughtUpTo(lesson, data).filter((e) => e.headword !== "'n" && e.senses.every((s) => (s.severity ?? 0) < 2 || lesson.vocab.includes(e.headword)));
  const gen: Step[] = [];
  for (const e of shuffle(vocab).slice(0, 5)) {
    const afToEn = Math.random() < 0.6;
    const distractors = distractorsFor(e, pool, settings);
    if (distractors.length < 2) continue;
    if (afToEn)
      gen.push({ kind: "exercise", ex: { type: "mc", prompt: e.headword, promptLang: "af", answer: meaning(e, settings), options: shuffle([meaning(e, settings), ...distractors.map((d) => meaning(d, settings))]), entryId: e.id } });
    else
      gen.push({ kind: "exercise", ex: { type: "mc", prompt: meaning(e, settings), promptLang: "en", answer: e.headword, options: shuffle([e.headword, ...distractors.map((d) => d.headword)]), entryId: e.id } });
  }
  // matching: only words whose meanings are all different
  const matchSet: Entry[] = [];
  for (const e of shuffle(vocab)) if (matchSet.length < 5 && !matchSet.some((m) => overlaps(m, e, settings))) matchSet.push(e);
  if (matchSet.length >= 4) gen.push({ kind: "exercise", ex: { type: "match", pairs: matchSet.map((e) => [e.headword, meaning(e, settings)]) } });
  for (const e of shuffle(vocab).filter((x) => x.headword !== "'n").slice(0, 2)) {
    // accept synonyms from the lesson too (e.g. "why" -> hoekom OR waarom)
    const answers = [e.headword, ...vocab.filter((v) => v.id !== e.id && overlaps(v, e, settings)).map((v) => v.headword)];
    gen.push({ kind: "exercise", ex: { type: "type-word", en: meaning(e, settings), answers, entryId: e.id } });
  }
  if (canListen) {
    for (const e of shuffle(vocab).filter((x) => x.headword !== "'n").slice(0, 2)) {
      const distractors = distractorsFor(e, pool, settings);
      if (distractors.length >= 2)
        gen.push({ kind: "exercise", ex: { type: "listen", text: e.headword, answer: meaning(e, settings), options: shuffle([meaning(e, settings), ...distractors.map((d) => meaning(d, settings))]) } });
    }
    const ex = shuffle(lesson.examples).find((x) => x.af.split(" ").length <= 7);
    if (ex) gen.push({ kind: "exercise", ex: { type: "dictation", text: ex.af, en: ex.en } });
  }

  const authored: Step[] = lesson.exercises.map((ex) => ({ kind: "exercise", ex }));
  // interleave: generated vocab practice first, then authored sentence work with a few vocab drills mixed in
  const mixed: Step[] = [];
  const a = [...authored];
  const g = [...gen];
  mixed.push(...g.splice(0, 3));
  while (a.length || g.length) {
    if (a.length) mixed.push(a.shift()!);
    if (a.length) mixed.push(a.shift()!);
    if (g.length) mixed.push(g.shift()!);
  }
  return [...steps, ...mixed];
}
