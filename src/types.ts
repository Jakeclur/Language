export type Register =
  | "formal" | "neutral" | "informal" | "slang" | "rude" | "vulgar" | "offensive-slur" | "dated" | "literary";
export type Confidence = "verified" | "checked" | "unverified" | "community";
export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface Sense {
  pos?: string;
  translations: string[];
  register: Register;
  severity?: number;
  regions?: string[];
  note?: string;
  examples?: { af: string; en: string }[];
  source: string;
}

export interface Entry {
  id: string;
  headword: string;
  pos: string[];
  ipa?: string;
  forms?: Partial<Record<"plural" | "diminutive" | "pastParticiple" | "comparative" | "superlative" | "attributive" | "past", string>>;
  senses: Sense[];
  cefr?: Level;
  frequencyRank?: number;
  topics: string[];
  verification: { sources: string[]; checks: string[]; confidence: Confidence };
}

export interface SourceInfo { name: string; licence: string; group: string; url?: string }
export interface DictionaryData { sources: Record<string, SourceInfo>; entries: Entry[] }

export type Exercise =
  | { type: "translate"; from: "en" | "af"; prompt: string; answers: string[] }
  | { type: "order"; en: string; af: string; extra?: string[] }
  | { type: "fill"; af: string; en: string; answers: string[]; options?: string[] }
  | { type: "choice"; question: string; options: string[]; answer: string }
  | { type: "transform"; instruction: string; from: string; answers: string[] }
  | { type: "rude"; af: string; en: string; answer: number };

export interface Lesson {
  id: string;
  title: string;
  explanation: string[];
  examples: { af: string; en: string }[];
  vocab: string[];
  /** people and places used in this lesson's sentences (e.g. Anna, Kaapstad) */
  names?: string[];
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  level: Level;
  number: number;
  title: string;
  titleAf: string;
  icon: string;
  street?: boolean;
  lessons: Lesson[];
}

export interface Phrase { af: string; en: string }
export interface PhraseGroup { id: string; title: string; icon: string; goals: string[]; phrases: Phrase[] }
export interface SoundGuide { spelling: string; ipa: string; example: string; tip: string }
export interface Extras { phrasebook: PhraseGroup[]; pronunciation: SoundGuide[] }

export type Goal = "school" | "travel" | "moving" | "family" | "culture";
