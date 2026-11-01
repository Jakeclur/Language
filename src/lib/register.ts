import type { Entry, Register, Sense } from "../types";
import type { Settings } from "./store";

export const REGISTER_LABEL: Record<Register, string> = {
  formal: "formal", neutral: "neutral", informal: "informal", slang: "slang", rude: "rude", vulgar: "vulgar",
  "offensive-slur": "offensive slur", dated: "dated", literary: "literary",
};

export const REGISTER_STYLE: Record<Register, string> = {
  formal: "bg-indigo-100 text-indigo-800",
  neutral: "bg-stone-100 text-stone-700",
  informal: "bg-sky-100 text-sky-800",
  slang: "bg-fuchsia-100 text-fuchsia-800",
  rude: "bg-orange-100 text-orange-800",
  vulgar: "bg-red-100 text-red-800",
  "offensive-slur": "bg-red-700 text-white",
  dated: "bg-stone-200 text-stone-600",
  literary: "bg-violet-100 text-violet-800",
};

export const SEVERITY_LABEL = ["clean", "mild", "rude", "strong", "extremely offensive"];

export const isSlur = (s: Sense) => s.register === "offensive-slur";
export const severityOf = (s: Sense) => (isSlur(s) ? 5 : s.severity ?? 0);

/** Which senses of an entry this learner may see, given their age-gate settings. */
export function visibleSenses(e: Entry, settings: Settings): Sense[] {
  return e.senses.filter((s) => {
    if (isSlur(s)) return settings.adultConfirmed && settings.showSlurs;
    if ((s.severity ?? 0) >= 2) return settings.adultConfirmed && settings.showStreet;
    return true;
  });
}
