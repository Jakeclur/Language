import type { Entry, Exercise, Lesson, Unit } from "../types";
import type { AppData } from "../lib/data";
import type { Settings, Progress } from "../lib/store";
import { shuffle } from "../lib/text";
import { visibleSenses } from "../lib/register";

export type Generated =
  | { type: "mc"; prompt: string; promptLang: "af" | "en"; options: string[]; answer: string; entryId: string }
  | { type: "match"; pairs: [string, string][] }
  | { type: "type-word"; en: string; answers: string[]; entryId: string };

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

/** A lesson session: introduce new words, then mixed generated + authored exercises. */
export function buildSession(lesson: Lesson, data: AppData, settings: Settings, progress: Progress): Step[] {
  const vocab = vocabEntries(lesson, data);
  const steps: Step[] = [];
  const fresh = vocab.filter((e) => !progress.cards[e.id]);
  for (const e of fresh.slice(0, 8)) steps.push({ kind: "intro", entry: e });

  const pool = vocab.length >= 4 ? vocab : [...vocab, ...data.dictionary.entries.filter((e) => e.cefr === "A1").slice(0, 8)];
  const gen: Step[] = [];
  for (const e of shuffle(vocab).slice(0, 5)) {
    const afToEn = Math.random() < 0.6;
    const distractors = shuffle(pool.filter((x) => x.id !== e.id)).slice(0, 3);
    if (afToEn)
      gen.push({ kind: "exercise", ex: { type: "mc", prompt: e.headword, promptLang: "af", answer: meaning(e, settings), options: shuffle([meaning(e, settings), ...distractors.map((d) => meaning(d, settings))]), entryId: e.id } });
    else
      gen.push({ kind: "exercise", ex: { type: "mc", prompt: meaning(e, settings), promptLang: "en", answer: e.headword, options: shuffle([e.headword, ...distractors.map((d) => d.headword)]), entryId: e.id } });
  }
  if (vocab.length >= 4) gen.push({ kind: "exercise", ex: { type: "match", pairs: shuffle(vocab).slice(0, 5).map((e) => [e.headword, meaning(e, settings)]) } });
  for (const e of shuffle(vocab).slice(0, 2))
    gen.push({ kind: "exercise", ex: { type: "type-word", en: meaning(e, settings), answers: [e.headword], entryId: e.id } });

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
