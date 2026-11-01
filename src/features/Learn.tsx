import { useData } from "../lib/dataContext";
import { useStore } from "../lib/store";
import { isUnlocked, lessonList, nextLesson, visibleUnits } from "./course";
import { Card, PageTitle, ProgressBar } from "../components/ui";
import { isDue } from "../lib/srs";

const LEVEL_INFO: Record<string, string> = {
  A1: "Beginner", A2: "Elementary", B1: "Intermediate", B2: "Upper intermediate", C1: "Advanced", C2: "Mastery",
};

export function Home() {
  const data = useData();
  const { progress, settings, streak } = useStore();
  const all = lessonList(data.units, settings);
  const next = nextLesson(all, progress);
  const due = Object.values(progress.cards).filter((c) => isDue(c)).length;
  const todayXp = progress.days[new Date().toISOString().slice(0, 10)] ?? 0;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center"><div className="text-2xl">🔥 {streak}</div><div className="text-xs text-stone-500">day streak</div></Card>
        <Card className="p-4 text-center"><div className="text-2xl">⭐ {progress.xp}</div><div className="text-xs text-stone-500">total XP</div></Card>
        <Card className="p-4 text-center"><div className="text-2xl">🧠 {Object.keys(progress.cards).length}</div><div className="text-xs text-stone-500">words in deck</div></Card>
      </div>
      <Card className="p-5">
        <div className="flex justify-between text-sm mb-2"><span className="font-semibold">Today's goal</span><span>{todayXp}/{settings.dailyGoal} XP</span></div>
        <ProgressBar value={todayXp / settings.dailyGoal} />
      </Card>
      <div className="grid sm:grid-cols-2 gap-4">
        {next && (
          <a href={`#lesson-${next.lesson.id}`} className="block">
            <Card className="p-5 hover:border-emerald-500 transition h-full">
              <div className="text-sm text-emerald-700 font-semibold">CONTINUE</div>
              <div className="text-xl font-bold mt-1">{next.unit.icon} {next.lesson.title}</div>
              <div className="text-sm text-stone-500">{next.unit.level} · Unit {next.unit.number}: {next.unit.title}</div>
            </Card>
          </a>
        )}
        <a href="#review" className="block">
          <Card className="p-5 hover:border-emerald-500 transition h-full">
            <div className="text-sm text-amber-700 font-semibold">DAILY REVIEW</div>
            <div className="text-xl font-bold mt-1">🔁 {due} card{due === 1 ? "" : "s"} due</div>
            <div className="text-sm text-stone-500">Spaced repetition keeps words in your long-term memory</div>
          </Card>
        </a>
      </div>
      <CourseMap />
    </div>
  );
}

export function CourseMap() {
  const data = useData();
  const { progress, settings } = useStore();
  const all = lessonList(data.units, settings);
  const units = visibleUnits(data.units, settings);
  const levels = [...new Set(units.map((u) => u.level))];
  return (
    <div className="space-y-6">
      <PageTitle sub="Grammar builds step by step. Each unit has a short explanation, examples and exercises.">Course</PageTitle>
      {levels.map((level) => {
        const lvUnits = units.filter((u) => u.level === level);
        const lessons = lvUnits.flatMap((u) => u.lessons);
        const done = lessons.filter((l) => progress.lessons[l.id]).length;
        return (
          <section key={level}>
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-xl font-bold">{level} <span className="text-stone-500 font-normal">· {LEVEL_INFO[level]}</span></h2>
              <span className="text-sm text-stone-500">{done}/{lessons.length} lessons</span>
            </div>
            <ProgressBar value={lessons.length ? done / lessons.length : 0} className="mb-3" />
            <div className="grid sm:grid-cols-2 gap-3">
              {lvUnits.map((u) => (
                <Card key={u.id} className={`p-4 ${u.street ? "border-red-300" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{u.icon}</span>
                    <div>
                      <div className="font-bold">Unit {u.number}: {u.title}</div>
                      <div className="text-sm text-stone-500 italic" lang="af">{u.titleAf}</div>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {u.lessons.map((l) => {
                      const ref = all.find((r) => r.lesson.id === l.id)!;
                      const open = isUnlocked(ref, all, settings, progress);
                      const res = progress.lessons[l.id];
                      return (
                        <li key={l.id}>
                          {open ? (
                            <a href={`#lesson-${l.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-emerald-50">
                              <span>{res ? "✅" : "▶️"} {l.title}</span>
                              {res && <span className="text-xs text-stone-500">{res.best}%</span>}
                            </a>
                          ) : (
                            <span className="flex items-center rounded-lg px-2 py-1.5 text-stone-400">🔒 {l.title}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
      <Card className="p-4 text-sm text-stone-600">
        📈 More units (B1 → C2: subordinate clauses, passive, idioms, regional varieties, formal writing, literature) are being added. See the roadmap in <a className="underline" href="#about">About</a>.
        {!settings.showStreet && <> The 🔞 <b>Street Afrikaans</b> unit can be switched on in <a className="underline" href="#settings">Settings</a>.</>}
      </Card>
    </div>
  );
}
