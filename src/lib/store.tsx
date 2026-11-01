import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Goal } from "../types";
import { load, save } from "./storage";
import { newCard, review, type StoredCard } from "./srs";
import type { Grade } from "ts-fsrs";

export interface Settings {
  onboarded: boolean;
  goals: Goal[];
  adultConfirmed: boolean; // learner confirmed they are 18+
  showStreet: boolean; // Street Afrikaans module + severity 2–4 in dictionary
  showSlurs: boolean; // offensive slur entries in the dictionary (recognition only)
  unlockAll: boolean; // skip ahead: every lesson open
  dailyGoal: number; // XP per day
}

export interface Progress {
  xp: number;
  days: Record<string, number>; // yyyy-mm-dd -> xp earned
  lessons: Record<string, { completedAt: string; score: number; best: number }>;
  cards: Record<string, StoredCard>; // dictionary entry id -> SRS card
  answered: number;
  correct: number;
}

const DEFAULT_SETTINGS: Settings = {
  onboarded: false, goals: [], adultConfirmed: false, showStreet: false, showSlurs: false, unlockAll: false, dailyGoal: 30,
};
const DEFAULT_PROGRESS: Progress = { xp: 0, days: {}, lessons: {}, cards: {}, answered: 0, correct: 0 };

export const today = (d = new Date()) => d.toISOString().slice(0, 10);

interface Store {
  settings: Settings;
  progress: Progress;
  updateSettings: (patch: Partial<Settings>) => void;
  addXp: (n: number) => void;
  recordAnswer: (correct: boolean) => void;
  completeLesson: (id: string, score: number, vocabIds: string[]) => void;
  addCard: (entryId: string) => void;
  removeCard: (entryId: string) => void;
  gradeCard: (entryId: string, grade: Grade) => void;
  resetProgress: () => void;
  streak: number;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => load("settings", DEFAULT_SETTINGS));
  const [progress, setProgress] = useState<Progress>(() => load("progress", DEFAULT_PROGRESS));
  useEffect(() => save("settings", settings), [settings]);
  useEffect(() => save("progress", progress), [progress]);

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);
  const addXp = useCallback(
    (n: number) => setProgress((p) => ({ ...p, xp: p.xp + n, days: { ...p.days, [today()]: (p.days[today()] ?? 0) + n } })),
    [],
  );
  const recordAnswer = useCallback(
    (ok: boolean) => setProgress((p) => ({ ...p, answered: p.answered + 1, correct: p.correct + (ok ? 1 : 0) })),
    [],
  );
  const completeLesson = useCallback((id: string, score: number, vocabIds: string[]) => {
    setProgress((p) => {
      const cards = { ...p.cards };
      for (const v of vocabIds) if (!cards[v]) cards[v] = newCard();
      const prev = p.lessons[id];
      return {
        ...p,
        cards,
        lessons: { ...p.lessons, [id]: { completedAt: new Date().toISOString(), score, best: Math.max(score, prev?.best ?? 0) } },
      };
    });
  }, []);
  const addCard = useCallback((id: string) => setProgress((p) => (p.cards[id] ? p : { ...p, cards: { ...p.cards, [id]: newCard() } })), []);
  const removeCard = useCallback(
    (id: string) =>
      setProgress((p) => {
        const cards = { ...p.cards };
        delete cards[id];
        return { ...p, cards };
      }),
    [],
  );
  const gradeCard = useCallback(
    (id: string, grade: Grade) => setProgress((p) => (p.cards[id] ? { ...p, cards: { ...p.cards, [id]: review(p.cards[id], grade) } } : p)),
    [],
  );
  const resetProgress = useCallback(() => setProgress(DEFAULT_PROGRESS), []);

  const streak = useMemo(() => {
    let n = 0;
    const d = new Date();
    if (!progress.days[today(d)]) d.setDate(d.getDate() - 1); // today not done yet doesn't break the streak
    while (progress.days[today(d)]) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }, [progress.days]);

  const value = { settings, progress, updateSettings, addXp, recordAnswer, completeLesson, addCard, removeCard, gradeCard, resetProgress, streak };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
