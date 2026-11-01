import { useState } from "react";
import { useData } from "../lib/dataContext";
import { useStore, today } from "../lib/store";
import { isUnlocked, lessonList, nextLesson, visibleUnits } from "./course";
import { Card } from "../components/ui";
import { isDue } from "../lib/srs";
import type { Unit } from "../types";

const LEVEL_INFO: Record<string, string> = {
  A1: "Beginner", A2: "Elementary", B1: "Intermediate", B2: "Upper intermediate", C1: "Advanced", C2: "Mastery",
};

export function Home() {
  const data = useData();
  const { progress, settings, streak } = useStore();
  const all = lessonList(data.units, settings);
  const next = nextLesson(all, progress);
  const due = Object.values(progress.cards).filter((c) => isDue(c)).length;
  const todayXp = progress.days[today()] ?? 0;
  const goalPct = Math.min(1, todayXp / settings.dailyGoal);
  const units = visibleUnits(data.units, settings);
  const [open, setOpen] = useState<string | undefined>(next?.unit.id);
  const [showAll, setShowAll] = useState(false);
  // Only show units you've reached plus the next one, unless "Show all" is on: less clutter.
  const reachedIdx = Math.max(0, ...units.map((u, i) => (u.lessons.some((l) => progress.lessons[l.id]) || u.id === next?.unit.id ? i : 0)));
  const shown = showAll || settings.unlockAll ? units : units.slice(0, reachedIdx + 2);
  const lessonNo = next ? next.unit.lessons.findIndex((l) => l.id === next.lesson.id) + 1 : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{greeting()}</h1>
        <div className="flex gap-2 text-sm font-semibold">
          <span className="rounded-full bg-white px-3 py-1.5 shadow-sm" title="Day streak">🔥 {streak}</span>
          <span className="rounded-full bg-white px-3 py-1.5 shadow-sm flex items-center gap-2" title="Today's goal">
            <Ring value={goalPct} /> {todayXp}/{settings.dailyGoal}
          </span>
        </div>
      </div>

      {next && (
        <a href={`#lesson-${next.lesson.id}`} className="block group">
          <div className="rounded-3xl bg-emerald-600 text-white p-6 sm:p-8 shadow-lg shadow-emerald-600/20 group-hover:bg-emerald-700 transition">
            <div className="text-emerald-100 text-sm font-medium">{progress.lessons[next.lesson.id] ? "Practise again" : Object.keys(progress.lessons).length ? "Continue" : "Start here"} · Unit {next.unit.number}, lesson {lessonNo}</div>
            <div className="text-2xl sm:text-3xl font-bold mt-1 flex items-center gap-3"><span>{next.unit.icon}</span>{next.lesson.title}</div>
            <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white text-emerald-700 font-bold px-6 py-3">Start lesson →</div>
          </div>
        </a>
      )}

      {due > 0 && (
        <a href="#review" className="flex items-center justify-between rounded-2xl bg-amber-50 px-5 py-4 hover:bg-amber-100 transition">
          <span><b>{due} word{due === 1 ? "" : "s"}</b> ready to review</span>
          <span className="font-semibold text-amber-800">Review →</span>
        </a>
      )}

      <section>
        <h2 className="text-lg font-bold mb-3">Your course</h2>
        <div className="space-y-6">
          {[...new Set(shown.map((u) => u.level))].map((level) => (
            <div key={level}>
              <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">{level} · {LEVEL_INFO[level]}</div>
              <Card className="divide-y divide-stone-100 overflow-hidden">
                {shown.filter((u) => u.level === level).map((u) => (
                  <UnitRow key={u.id} unit={u} open={open === u.id} onToggle={() => setOpen(open === u.id ? undefined : u.id)} all={all} />
                ))}
              </Card>
            </div>
          ))}
        </div>
        {shown.length < units.length && (
          <button onClick={() => setShowAll(true)} className="w-full mt-4 rounded-2xl py-3 text-stone-500 font-medium hover:bg-white">
            Show all {units.length} units
          </button>
        )}
      </section>
    </div>
  );
}

function UnitRow({ unit, open, onToggle, all }: { unit: Unit; open: boolean; onToggle: () => void; all: ReturnType<typeof lessonList> }) {
  const { progress, settings } = useStore();
  const done = unit.lessons.filter((l) => progress.lessons[l.id]).length;
  const firstRef = all.find((r) => r.lesson.id === unit.lessons[0].id);
  const unlocked = !!firstRef && isUnlocked(firstRef, all, settings, progress);
  const complete = done === unit.lessons.length;
  return (
    <div>
      <button onClick={onToggle} className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-stone-50 ${unlocked ? "" : "opacity-50"}`} aria-expanded={open}>
        <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${complete ? "bg-emerald-100" : "bg-stone-100"}`}>{unlocked ? unit.icon : "🔒"}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold truncate">{unit.title}</span>
          <span className="block text-sm text-stone-400">{complete ? "Completed ✓" : unlocked ? `${done} of ${unit.lessons.length} done` : `${unit.lessons.length} lesson${unit.lessons.length > 1 ? "s" : ""}`}</span>
        </span>
        <span className={`text-stone-300 transition ${open ? "rotate-90" : ""}`}>›</span>
      </button>
      {open && (
        <ul className="pb-3 px-3">
          {unit.lessons.map((l) => {
            const ref = all.find((r) => r.lesson.id === l.id)!;
            const ok = isUnlocked(ref, all, settings, progress);
            const res = progress.lessons[l.id];
            return (
              <li key={l.id}>
                {ok ? (
                  <a href={`#lesson-${l.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-emerald-50">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${res ? "bg-emerald-500 text-white" : "border-2 border-emerald-500 text-emerald-600"}`}>{res ? "✓" : "▶"}</span>
                    <span className="flex-1">{l.title}</span>
                  </a>
                ) : (
                  <span className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-stone-400">
                    <span className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-[10px]">🔒</span>{l.title}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const c = 2 * Math.PI * 7;
  return (
    <svg viewBox="0 0 18 18" className="w-4 h-4 -rotate-90" aria-hidden="true">
      <circle cx="9" cy="9" r="7" fill="none" stroke="#e7e5e4" strokeWidth="3" />
      <circle cx="9" cy="9" r="7" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={c} strokeDashoffset={c * (1 - value)} strokeLinecap="round" />
    </svg>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Goeie môre!" : h < 18 ? "Goeie middag!" : "Goeie naand!";
}
