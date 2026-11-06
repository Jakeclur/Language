import { useState } from "react";
import { useData } from "../lib/dataContext";
import { useStore, today } from "../lib/store";
import { isUnlocked, lessonList, nextLesson, visibleUnits, type LessonRef } from "./course";
import { isDue } from "../lib/srs";
import { unitTheme } from "../lib/theme";
import { Mascot } from "../components/Mascot";
import type { Unit } from "../types";

const LEVEL_INFO: Record<string, string> = {
  A1: "Beginner", A2: "Elementary", B1: "Intermediate", B2: "Upper intermediate", C1: "Advanced", C2: "Mastery",
};
// zig-zag offsets for the path of lesson stones (px)
const OFFSETS = [0, 44, 64, 44, 0, -44, -64, -44];

export function Home() {
  const data = useData();
  const { progress, settings, streak } = useStore();
  const all = lessonList(data.units, settings);
  const next = nextLesson(all, progress, settings.placedAtUnit);
  const due = Object.values(progress.cards).filter((c) => isDue(c)).length;
  const todayXp = progress.days[today()] ?? 0;
  const goalPct = Math.min(1, todayXp / settings.dailyGoal);
  const units = visibleUnits(data.units, settings);
  const [showAll, setShowAll] = useState(false);
  const reachedIdx = Math.max(0, ...units.map((u, i) => (u.lessons.some((l) => progress.lessons[l.id]) || u.id === next?.unit.id ? i : 0)));
  const shown = showAll || settings.unlockAll ? units : units.slice(0, reachedIdx + 2);
  const theme = next ? unitTheme(next.unit.number) : unitTheme(1);
  const lessonNo = next ? next.unit.lessons.findIndex((l) => l.id === next.lesson.id) + 1 : 0;
  const started = Object.keys(progress.lessons).length > 0;

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-black tracking-tight text-stone-800">{greeting()}</h1>
        <div className="flex gap-2 text-sm font-extrabold">
          <span className="flex items-center gap-1 rounded-2xl bg-white border-2 border-stone-100 px-3 py-1.5 text-orange-500" title="Day streak">🔥 {streak}</span>
          <span className="flex items-center gap-1 rounded-2xl bg-white border-2 border-stone-100 px-3 py-1.5 text-amber-500" title="Total XP">⭐ {progress.xp}</span>
        </div>
      </div>

      {next && (
        <a href={`#lesson-${next.lesson.id}`} className="block group">
          <div className={`relative overflow-hidden rounded-3xl ${theme.solid} text-white p-6 pr-28 sm:pr-40 ${theme.shadow} transition group-hover:brightness-105 group-active:translate-y-1 group-active:shadow-none`}>
            <div className="text-white/85 text-sm font-extrabold uppercase tracking-wide">{started ? "Continue" : "Start here"} · Unit {next.unit.number}</div>
            <div className="text-2xl sm:text-3xl font-black mt-1 leading-tight">{next.lesson.title}</div>
            <div className="text-white/85 font-semibold mt-1">Lesson {lessonNo} of {next.unit.lessons.length} · {next.unit.title}</div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white text-stone-800 font-extrabold uppercase tracking-wide px-6 py-3 shadow-[0_4px_0_rgba(0,0,0,0.15)]">
              Start ▶
            </div>
            <Mascot mood={started ? "happy" : "cheer"} size={104} className="absolute right-1 bottom-2 animate-bob" />
          </div>
        </a>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-white border-2 border-stone-100 p-4 flex items-center gap-3">
          <GoalRing value={goalPct} />
          <div>
            <div className="font-extrabold text-stone-800">Daily goal</div>
            <div className="text-sm font-semibold text-stone-400">{todayXp} / {settings.dailyGoal} XP</div>
          </div>
        </div>
        <a href="#review" className={`rounded-3xl border-2 p-4 flex items-center gap-3 transition ${due ? "bg-amber-50 border-amber-200 hover:bg-amber-100" : "bg-white border-stone-100"}`}>
          <span className="text-3xl">🧠</span>
          <div>
            <div className="font-extrabold text-stone-800">Review</div>
            <div className="text-sm font-semibold text-stone-400">{due ? `${due} word${due === 1 ? "" : "s"} ready` : "All caught up"}</div>
          </div>
        </a>
      </div>

      <section className="pt-2">
        {shown.map((u, i) => (
          <div key={u.id}>
            {(i === 0 || shown[i - 1].level !== u.level) && (
              <div className="flex items-center gap-3 my-6">
                <div className="h-0.5 flex-1 bg-stone-200" />
                <span className="text-sm font-extrabold uppercase tracking-wider text-stone-400">{u.level} · {LEVEL_INFO[u.level]}</span>
                <div className="h-0.5 flex-1 bg-stone-200" />
              </div>
            )}
            <UnitPath unit={u} all={all} currentId={next?.lesson.id} />
          </div>
        ))}
        {shown.length < units.length && (
          <button onClick={() => setShowAll(true)} className="btn-3d w-full mt-8 rounded-2xl py-3.5 bg-white border-2 border-stone-200 shadow-[0_4px_0_#e7e5e4] text-stone-500 font-extrabold uppercase tracking-wide">
            See all {units.length} units
          </button>
        )}
      </section>
    </div>
  );
}

function UnitPath({ unit, all, currentId }: { unit: Unit; all: LessonRef[]; currentId?: string }) {
  const { progress, settings } = useStore();
  const t = unitTheme(unit.number);
  const done = unit.lessons.filter((l) => progress.lessons[l.id]).length;
  return (
    <div className="mb-10">
      <div className={`rounded-3xl ${t.solid} text-white px-5 py-4 flex items-center gap-4 ${t.shadow}`}>
        <span className="text-3xl">{unit.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-white/80 text-xs font-extrabold uppercase tracking-wider">Unit {unit.number}</div>
          <div className="text-lg font-black leading-tight truncate">{unit.title}</div>
        </div>
        <span className="rounded-xl bg-white/20 px-2.5 py-1 text-sm font-extrabold">{done}/{unit.lessons.length}</span>
      </div>
      <div className="flex flex-col items-center gap-5 pt-7">
        {unit.lessons.map((l, i) => {
          const ref = all.find((r) => r.lesson.id === l.id)!;
          const open = isUnlocked(ref, all, settings, progress);
          const complete = !!progress.lessons[l.id];
          const current = l.id === currentId;
          const x = OFFSETS[(ref.index) % OFFSETS.length];
          const stone = (
            <span className={`relative flex items-center justify-center w-[72px] h-[68px] rounded-[50%] text-2xl font-black transition
              ${complete ? `${t.solid} text-white ${t.shadow}` : open ? `${t.solid} text-white ${t.shadow} ring-8 ${t.ring}` : "bg-stone-200 text-stone-400 shadow-[0_6px_0_#d6d3d1]"}`}>
              {complete ? "✓" : open ? "★" : "🔒"}
            </span>
          );
          return (
            <div key={l.id} className="flex flex-col items-center" style={{ transform: `translateX(${x}px)` }}>
              {current && <span className={`mb-2 rounded-xl bg-white border-2 border-stone-200 px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${t.text} animate-bob`}>Start</span>}
              {open ? (
                <a href={`#lesson-${l.id}`} aria-label={`Lesson ${i + 1}: ${l.title}${complete ? " (completed)" : ""}`} className="active:translate-y-1.5 transition-transform">{stone}</a>
              ) : (
                <span aria-label={`Lesson ${i + 1}: ${l.title} (locked)`}>{stone}</span>
              )}
              <span className={`mt-3 max-w-40 text-center text-sm font-bold leading-tight ${open ? "text-stone-600" : "text-stone-400"}`}>{l.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GoalRing({ value }: { value: number }) {
  const c = 2 * Math.PI * 18;
  return (
    <svg viewBox="0 0 44 44" className="w-12 h-12 -rotate-90 shrink-0" aria-hidden="true">
      <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" className="text-stone-200" strokeWidth="6" />
      <circle cx="22" cy="22" r="18" fill="none" stroke={value >= 1 ? "#f59e0b" : "#10b981"} strokeWidth="6" strokeDasharray={c} strokeDashoffset={c * (1 - value)} strokeLinecap="round" />
    </svg>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Goeie môre!" : h < 18 ? "Goeie middag!" : "Goeie naand!";
}
