import { useMemo, useState } from "react";
import { useData } from "../lib/dataContext";
import { useStore } from "../lib/store";
import { go } from "../lib/router";
import { distractorsFor, meaning, taughtUpTo, vocabEntries, visibleUnits } from "./course";
import { shuffle } from "../lib/text";
import { Mascot, Speech } from "../components/Mascot";
import { ProgressBar } from "../components/ui";
import { AudioButton } from "../components/Audio";
import { BottomBar, bigButton, btnColor } from "../components/BottomBar";
import type { Entry, Unit } from "../types";

interface Q { unit: Unit; entry: Entry; options: string[]; answer: string }
const QUESTIONS = 12;

/** A short placement test: one word from each of 12 units spread across the course, easiest
 *  first. You start at the unit where you get your second answer wrong. */
export function PlacementPage() {
  const data = useData();
  const { settings, updateSettings } = useStore();
  const questions = useMemo<Q[]>(() => {
    const units = visibleUnits(data.units, settings).filter((u) => !u.street).sort((a, b) => a.number - b.number);
    const step = units.length / QUESTIONS;
    const picked = Array.from({ length: Math.min(QUESTIONS, units.length) }, (_, i) => units[Math.floor(i * step)]);
    return picked.flatMap((unit) => {
      const lesson = unit.lessons[unit.lessons.length - 1];
      const words = unit.lessons.flatMap((l) => vocabEntries(l, data)).filter((e) => e.headword !== "'n");
      const entry = shuffle(words)[0];
      if (!entry) return [];
      const pool = taughtUpTo(lesson, data).filter((e) => e.headword !== "'n" && e.senses.every((s) => (s.severity ?? 0) < 2));
      const d = distractorsFor(entry, pool, settings);
      if (d.length < 2) return [];
      return [{ unit, entry, answer: meaning(entry, settings), options: shuffle([meaning(entry, settings), ...d.map((x) => meaning(x, settings))]) }];
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [picked, setPicked] = useState<string>();
  const [placed, setPlaced] = useState<Unit | "all" | null>(null);
  const [firstWrong, setFirstWrong] = useState<number | null>(null);

  const answer = (o: string | null) => {
    if (picked) return;
    setPicked(o ?? "—");
    const ok = o === questions[i].answer;
    const w = wrong + (ok ? 0 : 1);
    const fw = !ok && firstWrong === null ? i : firstWrong;
    setWrong(w);
    setFirstWrong(fw);
    setTimeout(() => {
      setPicked(undefined);
      // two mistakes: start at the unit of the first one
      if (w >= 2) setPlaced(questions[fw ?? i].unit);
      else if (i + 1 >= questions.length) setPlaced("all");
      else setI(i + 1);
    }, 700);
  };

  const start = (unitNumber: number) => {
    updateSettings({ placedAtUnit: unitNumber, onboarded: true, unlockAll: false });
    go("");
  };

  if (placed) {
    const unit = placed === "all" ? null : placed;
    const firstUnit = visibleUnits(data.units, settings).sort((a, b) => a.number - b.number)[0];
    return (
      <div className="max-w-md mx-auto text-center pt-6 pb-40">
        <Mascot mood="cheer" size={130} className="mx-auto animate-pop" />
        <h1 className="text-3xl font-black text-stone-800 mt-3">{unit && unit.number <= firstUnit.number ? "Let's start from the beginning!" : "Knap gedoen!"}</h1>
        <p className="text-stone-500 font-semibold mt-2">
          {unit ? <>We suggest starting at <b className="text-stone-700">Unit {unit.number}: {unit.title}</b>.{unit.number > firstUnit.number ? " Everything before it is unlocked, so you can go back any time." : ""}</> : <>You know a lot already! Every unit is unlocked.</>}
        </p>
        <BottomBar>
          <div className="flex gap-3">
            <button onClick={() => start(0)} className={`${bigButton} ${btnColor.grey}`}>From the start</button>
            <button onClick={() => (unit ? start(unit.number) : (updateSettings({ unlockAll: true, onboarded: true }), go("")))} className={`${bigButton} ${btnColor.green}`}>
              {unit ? `Start Unit ${unit.number}` : "Let's go"}
            </button>
          </div>
        </BottomBar>
      </div>
    );
  }

  const q = questions[i];
  if (!q) return null;
  return (
    <div className="max-w-xl mx-auto pb-40">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => go(settings.onboarded ? "settings" : "")} aria-label="Close placement test" className="w-10 h-10 -ml-2 rounded-full text-3xl leading-none text-stone-400 hover:bg-stone-100">×</button>
        <ProgressBar value={i / questions.length} className="flex-1" />
      </div>
      <h1 className="sr-only">Placement test</h1>
      <Speech mood="think">Placement test: what does this mean?</Speech>
      <div className="mt-6 mb-6 flex items-center gap-3 text-3xl font-black text-stone-800">
        <span lang="af">{q.entry.headword}</span>
        <AudioButton text={q.entry.headword} />
      </div>
      <div className="grid gap-3">
        {q.options.map((o) => {
          const state = !picked ? "border-stone-200 bg-white shadow-[0_4px_0_#e7e5e4]" : o === q.answer ? "border-emerald-400 bg-emerald-50 text-emerald-800" : o === picked ? "border-rose-300 bg-rose-50 text-rose-700" : "border-stone-200 bg-white opacity-50";
          return (
            <button key={o} onClick={() => answer(o)} disabled={!!picked} className={`btn-3d text-left rounded-2xl border-2 px-5 py-4 text-lg font-bold ${state}`}>{o}</button>
          );
        })}
      </div>
      <button onClick={() => answer(null)} disabled={!!picked} className="mt-5 w-full rounded-2xl py-3 font-extrabold uppercase tracking-wide text-stone-400 hover:bg-stone-100">I don't know</button>
    </div>
  );
}
