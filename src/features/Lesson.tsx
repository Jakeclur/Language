import { useMemo, useState } from "react";
import { useData } from "../lib/dataContext";
import { useStore } from "../lib/store";
import { go } from "../lib/router";
import { buildSession, lessonList, meaning, vocabEntries, type Step } from "./course";
import { ExerciseView, type Result } from "./Exercises";
import { WordCard } from "./WordCard";
import { ProgressBar } from "../components/ui";
import { Inline, Md } from "../components/Md";
import { AudioButton } from "../components/Audio";
import { BottomBar, bigButton } from "../components/BottomBar";
import { reportUrl } from "../lib/report";
import type { Lesson } from "../types";

export function LessonPage({ id }: { id: string }) {
  const data = useData();
  const store = useStore();
  const all = lessonList(data.units, store.settings);
  const ref = all.find((r) => r.lesson.id === id);
  const [phase, setPhase] = useState<"learn" | "practice" | "done">("learn");
  const [run, setRun] = useState(0);
  if (!ref)
    return (
      <div className="p-8 text-center">
        Lesson not found. <a className="underline" href="#">Back to the course</a>
      </div>
    );
  const { unit, lesson } = ref;
  const next = all[ref.index + 1];
  return (
    <div className="min-h-screen bg-white">
      {phase === "learn" && (
        <>
          <TopBar onClose={() => go("")} label={`Unit ${unit.number} · ${unit.title}`} />
          <LearnView lesson={lesson} />
          <BottomBar>
            <button onClick={() => setPhase("practice")} className={`${bigButton} bg-emerald-600 text-white hover:bg-emerald-700`}>Start practising</button>
          </BottomBar>
        </>
      )}
      {phase === "practice" && <Practice key={run} lessonId={lesson.id} onDone={() => setPhase("done")} />}
      {phase === "done" && (
        <div className="max-w-md mx-auto px-6 pt-24 pb-40 text-center">
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold">Baie goed!</h1>
          <p className="text-stone-500 mt-2">Lesson complete. The new words are in your review deck.</p>
          <div className="mt-8 inline-flex gap-8 text-left">
            <div><div className="text-sm text-stone-400">Score</div><div className="text-3xl font-bold text-emerald-600">{store.progress.lessons[lesson.id]?.score ?? 0}%</div></div>
            <div><div className="text-sm text-stone-400">Total XP</div><div className="text-3xl font-bold text-amber-500">{store.progress.xp}</div></div>
          </div>
          <BottomBar>
            <div className="flex gap-3">
              <button onClick={() => { setRun(run + 1); setPhase("practice"); }} className={`${bigButton} bg-stone-100 text-stone-700 hover:bg-stone-200`}>Again</button>
              <button onClick={() => (next ? go(`lesson-${next.lesson.id}`) : go(""))} className={`${bigButton} bg-emerald-600 text-white hover:bg-emerald-700`}>
                {next ? "Next lesson" : "Done"}
              </button>
            </div>
          </BottomBar>
        </div>
      )}
    </div>
  );
}

function TopBar({ onClose, label, progress }: { onClose: () => void; label?: string; progress?: number }) {
  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur">
      <div className="max-w-2xl mx-auto px-5 h-16 flex items-center gap-4">
        <button onClick={onClose} aria-label="Close lesson" className="w-10 h-10 -ml-2 rounded-full text-2xl text-stone-400 hover:bg-stone-100 hover:text-stone-700">×</button>
        {progress !== undefined ? <ProgressBar value={progress} className="flex-1" /> : <span className="text-sm text-stone-400 truncate">{label}</span>}
      </div>
    </div>
  );
}

function LearnView({ lesson }: { lesson: Lesson }) {
  const data = useData();
  const { settings } = useStore();
  const vocab = vocabEntries(lesson, data);
  return (
    <div className="max-w-2xl mx-auto px-5 pt-4 pb-40">
      <h1 className="text-3xl font-bold tracking-tight mb-6">{lesson.title}</h1>
      <div className="space-y-4 text-lg leading-relaxed text-stone-700">
        {lesson.explanation.map((p, i) => <Md key={i} text={p} />)}
      </div>
      {lesson.examples.length > 0 && (
        <div className="mt-8 space-y-3">
          {lesson.examples.map((e, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl bg-stone-50 px-4 py-3">
              <AudioButton text={e.af} size="sm" />
              <div>
                <div className="font-semibold text-lg" lang="af">{e.af}</div>
                <div className="text-stone-500">{e.en}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {vocab.length > 0 && (
        <div className="mt-8">
          <div className="text-sm font-medium text-stone-400 mb-3">New words</div>
          <div className="flex flex-wrap gap-2">
            {vocab.map((v) => (
              <span key={v.id} className="rounded-full bg-emerald-50 px-3 py-1.5">
                <b lang="af" className="text-emerald-800">{v.headword}</b> <span className="text-stone-500">{meaning(v, settings).split(";")[0]}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      <a className="block mt-10 text-sm text-stone-400 hover:text-stone-600" target="_blank" rel="noreferrer"
        href={reportUrl(`lesson ${lesson.id}`, `Lesson: **${lesson.title}** (\`${lesson.id}\`)`)}>Report a problem with this lesson</a>
    </div>
  );
}

function Practice({ lessonId, onDone }: { lessonId: string; onDone: () => void }) {
  const data = useData();
  const store = useStore();
  const ref = lessonList(data.units, store.settings).find((r) => r.lesson.id === lessonId)!;
  const initial = useMemo(() => buildSession(ref.lesson, data, store.settings, store.progress), [lessonId]); // eslint-disable-line react-hooks/exhaustive-deps
  const [steps, setSteps] = useState<Step[]>(initial);
  const [i, setI] = useState(0);
  const [result, setResult] = useState<Result>();
  const [score, setScore] = useState({ right: 0, total: 0 });
  const step = steps[i];

  const finish = () => {
    const pct = score.total ? Math.round((score.right / score.total) * 100) : 100;
    store.completeLesson(ref.lesson.id, pct, vocabEntries(ref.lesson, data).map((e) => e.id));
    store.addXp(10 + score.right);
    onDone();
  };
  const next = () => {
    setResult(undefined);
    if (i + 1 >= steps.length) finish();
    else setI(i + 1);
  };
  const onResult = (r: Result) => {
    setResult(r);
    store.recordAnswer(r.correct);
    if (step.kind === "exercise" && !step.retry) setScore((s) => ({ right: s.right + (r.correct ? 1 : 0), total: s.total + 1 }));
    if (!r.correct && step.kind === "exercise" && !step.retry) setSteps((s) => [...s, { ...step, retry: true }]);
  };

  return (
    <>
      <TopBar onClose={() => go("")} progress={i / steps.length} />
      <div className="max-w-2xl mx-auto px-5 pt-6 pb-48">
        {step.kind === "intro" ? (
          <>
            <div className="text-sm font-medium text-amber-600 mb-4">New word</div>
            <WordCard entry={step.entry} />
          </>
        ) : (
          <>
            {step.retry && <div className="text-sm font-medium text-amber-600 mb-2">Let's try this one again</div>}
            <ExerciseView key={i} ex={step.ex} onResult={onResult} locked={!!result} />
          </>
        )}
      </div>
      {step.kind === "intro" && (
        <BottomBar>
          <button onClick={next} className={`${bigButton} bg-emerald-600 text-white hover:bg-emerald-700`}>Continue</button>
        </BottomBar>
      )}
      {result && (
        <BottomBar tone={result.correct ? "good" : "bad"}>
          <div role="status" className={`mb-3 ${result.correct ? "text-emerald-800" : "text-rose-800"}`}>
            <div className="font-bold text-xl">{result.correct ? "Reg so! 🎉" : "Not quite"}</div>
            {result.note && <div className="mt-1"><Inline text={result.note} /></div>}
            {result.hint && <div className="mt-1"><Inline text={result.hint} /></div>}
            {!result.correct && result.expected && <div className="mt-1">Correct answer: <b lang="af">{result.expected}</b></div>}
          </div>
          <button onClick={next} autoFocus className={`${bigButton} text-white ${result.correct ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}>Continue</button>
        </BottomBar>
      )}
    </>
  );
}
