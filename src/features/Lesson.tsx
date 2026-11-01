import { useMemo, useState } from "react";
import { useData } from "../lib/dataContext";
import { useStore } from "../lib/store";
import { go } from "../lib/router";
import { buildSession, lessonList, vocabEntries, type Step } from "./course";
import { ExerciseView, type Result } from "./Exercises";
import { WordCard } from "./WordCard";
import { Button, Card, ProgressBar } from "../components/ui";
import { Inline, Md } from "../components/Md";
import { AudioButton } from "../components/Audio";
import { reportUrl } from "../lib/report";

export function LessonPage({ id }: { id: string }) {
  const data = useData();
  const store = useStore();
  const all = lessonList(data.units, store.settings);
  const ref = all.find((r) => r.lesson.id === id);
  const [phase, setPhase] = useState<"learn" | "practice" | "done">("learn");
  if (!ref) return <Card className="p-6">Lesson not found. <a className="underline" href="#learn">Back to the course</a></Card>;
  const { unit, lesson } = ref;
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <a href="#learn" className="text-emerald-800 font-medium">← Course</a>
        <span className="text-sm text-stone-500">{unit.level} · Unit {unit.number}: {unit.title}</span>
      </div>
      {phase === "learn" && <LearnView lesson={lesson} onStart={() => setPhase("practice")} />}
      {phase === "practice" && <Practice key={lesson.id} lessonId={lesson.id} onDone={() => setPhase("done")} />}
      {phase === "done" && (
        <Card className="p-8 text-center">
          <div className="text-6xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold">Baie goed!</h2>
          <p className="text-stone-600 mt-1">Lesson complete. New words were added to your review deck.</p>
          <p className="mt-2 font-semibold">Score: {store.progress.lessons[lesson.id]?.score ?? 0}%</p>
          <div className="flex gap-3 justify-center mt-6 flex-wrap">
            <Button variant="secondary" onClick={() => setPhase("practice")}>Practise again</Button>
            {all[ref.index + 1] ? (
              <Button onClick={() => go(`lesson-${all[ref.index + 1].lesson.id}`)}>Next lesson →</Button>
            ) : (
              <Button onClick={() => go("learn")}>Back to course</Button>
            )}
          </div>
        </Card>
      )}
      <div className="text-center mt-6">
        <a className="text-sm text-stone-500 underline" target="_blank" rel="noreferrer"
          href={reportUrl(`lesson ${lesson.id}`, `Lesson: **${lesson.title}** (\`${lesson.id}\`) in unit ${unit.id}`)}>🚩 Report a mistake in this lesson</a>
      </div>
    </div>
  );
}

function LearnView({ lesson, onStart }: { lesson: ReturnType<typeof lessonList>[number]["lesson"]; onStart: () => void }) {
  const data = useData();
  const vocab = vocabEntries(lesson, data);
  const { settings } = useStore();
  return (
    <Card className="p-6 space-y-5">
      <h1 className="text-2xl font-bold text-emerald-900">{lesson.title}</h1>
      <div className="space-y-3 text-stone-800 leading-relaxed">
        {lesson.explanation.map((p, i) => <Md key={i} text={p} />)}
      </div>
      {lesson.examples.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Examples</h3>
          <ul className="space-y-2">
            {lesson.examples.map((e, i) => (
              <li key={i} className="flex items-start gap-3 bg-amber-50 rounded-xl p-3">
                <AudioButton text={e.af} size="sm" />
                <div><div className="font-medium" lang="af">{e.af}</div><div className="text-sm text-stone-600">{e.en}</div></div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {vocab.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Words in this lesson</h3>
          <div className="flex flex-wrap gap-2">
            {vocab.map((v) => (
              <a key={v.id} href={`#word-${v.id}`} className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-sm">
                <b lang="af">{v.headword}</b> <span className="text-stone-500">{v.senses.find((s) => (s.severity ?? 0) < 2 || settings.showStreet)?.translations[0]}</span>
              </a>
            ))}
          </div>
        </div>
      )}
      <Button onClick={onStart} className="w-full py-3 text-lg">Start practising →</Button>
    </Card>
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

  const finish = (final: typeof score) => {
    const pct = final.total ? Math.round((final.right / final.total) * 100) : 100;
    store.completeLesson(ref.lesson.id, pct, vocabEntries(ref.lesson, data).map((e) => e.id));
    store.addXp(10 + final.right);
    onDone();
  };
  const next = (final = score) => {
    setResult(undefined);
    if (i + 1 >= steps.length) finish(final);
    else setI(i + 1);
  };
  const onResult = (r: Result) => {
    setResult(r);
    store.recordAnswer(r.correct);
    if (step.kind === "exercise" && !step.retry) setScore((s) => ({ right: s.right + (r.correct ? 1 : 0), total: s.total + 1 }));
    if (!r.correct && step.kind === "exercise" && !step.retry) setSteps((s) => [...s, { ...step, retry: true }]); // try it again at the end
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <ProgressBar value={i / steps.length} className="flex-1" />
        <span className="text-sm text-stone-500">{i + 1}/{steps.length}</span>
      </div>
      <Card className="p-6">
        {step.kind === "intro" ? (
          <>
            <div className="text-sm font-semibold uppercase tracking-wide text-amber-600 mb-3">New word</div>
            <WordCard entry={step.entry} />
          </>
        ) : (
          <>
            {step.retry && <div className="text-sm text-amber-700 mb-2">🔁 Let's try this one again</div>}
            <ExerciseView key={i} ex={step.ex} onResult={onResult} locked={!!result} />
          </>
        )}
      </Card>
      {step.kind === "intro" && <Button onClick={() => next()} className="w-full mt-4 py-3 text-lg">Got it →</Button>}
      {result && (
        <div className={`mt-4 rounded-2xl p-4 ${result.correct ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"}`} role="status">
          <div className="font-bold text-lg">{result.correct ? "✓ Reg so!" : "✗ Not quite"}</div>
          {result.note && <div className="mt-1"><Inline text={result.note} /></div>}
          {result.hint && <div className="mt-1"><Inline text={result.hint} /></div>}
          {!result.correct && result.expected && <div className="mt-1">Answer: <b lang="af">{result.expected}</b></div>}
          <Button onClick={() => next()} className="w-full mt-3" variant={result.correct ? "primary" : "danger"}>Continue</Button>
        </div>
      )}
    </div>
  );
}
