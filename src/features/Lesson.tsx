import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../lib/dataContext";
import { useStore } from "../lib/store";
import { go } from "../lib/router";
import { buildSession, lessonList, meaning, taughtUpTo, vocabEntries, type Step } from "./course";
import { ExerciseView, TaughtWords, type Result } from "./Exercises";
import { WordCard } from "./WordCard";
import { ProgressBar } from "../components/ui";
import { Inline, Md } from "../components/Md";
import { AudioButton, SayWords } from "../components/Audio";
import { BottomBar, bigButton, btnColor } from "../components/BottomBar";
import { Mascot, Speech } from "../components/Mascot";
import { praise, unitTheme } from "../lib/theme";
import { reportUrl } from "../lib/report";
import { useDeviceVoices } from "../lib/audio";
import type { Lesson } from "../types";

export function LessonPage({ id }: { id: string }) {
  const data = useData();
  const store = useStore();
  const all = lessonList(data.units, store.settings);
  const ref = all.find((r) => r.lesson.id === id);
  const [phase, setPhase] = useState<"learn" | "practice" | "done">("learn");
  const [run, setRun] = useState(0);
  const [stats, setStats] = useState({ score: 0, xp: 0, words: 0 });
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
          <LearnView lesson={lesson} unitNumber={unit.number} />
          <BottomBar>
            <button onClick={() => setPhase("practice")} className={`${bigButton} ${btnColor.green}`}>Start practising</button>
          </BottomBar>
        </>
      )}
      {phase === "practice" && <Practice key={run} lessonId={lesson.id} onDone={(st) => { setStats(st); setPhase("done"); }} />}
      {phase === "done" && (
        <div className="max-w-md mx-auto px-6 pt-16 pb-40 text-center">
          <Confetti />
          <Mascot mood="cheer" size={150} className="mx-auto animate-pop" />
          <h1 className="sr-only">Lesson complete: {lesson.title}</h1>
          <h2 className="text-4xl font-black text-amber-500 mt-4">{stats.score >= 90 ? "Uitstekend!" : stats.score >= 70 ? "Baie goed!" : "Mooi so!"}</h2>
          <p className="text-stone-500 font-semibold mt-2">You finished <b className="text-stone-700">{lesson.title}</b></p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            <StatTile label="XP" value={`+${stats.xp}`} color="border-amber-300 bg-amber-50 text-amber-600" icon="⭐" />
            <StatTile label="Score" value={`${stats.score}%`} color="border-emerald-300 bg-emerald-50 text-emerald-600" icon="🎯" />
            <StatTile label="Words" value={`${stats.words}`} color="border-sky-300 bg-sky-50 text-sky-600" icon="📚" />
          </div>
          <BottomBar>
            <div className="flex gap-3">
              <button onClick={() => { setRun(run + 1); setPhase("practice"); }} className={`${bigButton} ${btnColor.grey}`}>Again</button>
              <button onClick={() => (next ? go(`lesson-${next.lesson.id}`) : go(""))} className={`${bigButton} ${btnColor.green}`}>
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
        <button onClick={onClose} aria-label="Close lesson" className="w-10 h-10 -ml-2 rounded-full text-3xl leading-none text-stone-400 hover:bg-stone-100 hover:text-stone-700">×</button>
        {progress !== undefined ? <ProgressBar value={progress} className="flex-1" /> : <span className="text-sm font-bold text-stone-400 truncate">{label}</span>}
      </div>
    </div>
  );
}

function LearnView({ lesson, unitNumber }: { lesson: Lesson; unitNumber: number }) {
  const data = useData();
  const { settings } = useStore();
  const vocab = vocabEntries(lesson, data);
  const t = unitTheme(unitNumber);
  return (
    <div className="max-w-2xl mx-auto px-5 pt-2 pb-40">
      <h1 className="sr-only">{lesson.title}</h1>
      <Speech mood="happy">Let's learn: <span className={t.text}>{lesson.title}</span></Speech>
      <div className="mt-6 rounded-3xl border-2 border-stone-100 bg-white p-5 space-y-4 text-lg leading-relaxed text-stone-700">
        {lesson.explanation.map((p, i) => <Md key={i} text={p} />)}
      </div>
      {lesson.examples.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-stone-400 mb-3">Examples</h2>
          <div className="space-y-3">
            {lesson.examples.map((e, i) => (
              <div key={i} className={`flex items-center gap-4 rounded-2xl ${t.soft} px-4 py-3`}>
                <AudioButton text={e.af} size="sm" />
                <div>
                  <div className="font-extrabold text-lg text-stone-800" lang="af">{e.af}</div>
                  <div className="text-stone-500 font-semibold">{e.en}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {vocab.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-stone-400 mb-3">New words ({vocab.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {vocab.map((v) => (
              <div key={v.id} className="rounded-2xl border-2 border-stone-100 bg-white px-3 py-2.5 flex items-center gap-2.5">
                <AudioButton text={v.headword} size="sm" />
                <div className="min-w-0">
                  <div lang="af" className="font-black text-stone-800">{v.headword}</div>
                  <div className="text-sm font-semibold text-stone-500 leading-tight">{meaning(v, settings).split(";")[0]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {lesson.names && lesson.names.length > 0 && (
        <p className="mt-4 text-sm font-semibold text-stone-500">Names in this lesson: {lesson.names.map((n) => <b key={n} lang="af">{n}</b>).reduce<React.ReactNode[]>((a, b, i) => (i ? [...a, ", ", b] : [b]), [])}</p>
      )}
      <a className="block mt-10 text-sm font-semibold text-stone-400 hover:text-stone-600" target="_blank" rel="noreferrer"
        href={reportUrl(`lesson ${lesson.id}`, `Lesson: **${lesson.title}** (\`${lesson.id}\`)`)}>Report a problem with this lesson</a>
    </div>
  );
}

function StatTile({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div className={`rounded-2xl border-2 overflow-hidden ${color} animate-pop`}>
      <div className="text-xs font-extrabold uppercase tracking-wider py-1">{label}</div>
      <div className="bg-white py-3 text-2xl font-black">{icon} {value}</div>
    </div>
  );
}

const CONFETTI_COLORS = ["#10b981", "#f59e0b", "#0ea5e9", "#f43f5e", "#8b5cf6", "#facc15"];
function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 70 }, (_, i) => ({ left: Math.random() * 100, delay: Math.random() * 0.8, dur: 2.2 + Math.random() * 1.8, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], rot: Math.random() * 360 })),
    [],
  );
  return (
    <div aria-hidden="true">
      {pieces.map((p, i) => (
        <span key={i} className="confetti" style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, transform: `rotate(${p.rot}deg)` }} />
      ))}
    </div>
  );
}

function Practice({ lessonId, onDone }: { lessonId: string; onDone: (stats: { score: number; xp: number; words: number }) => void }) {
  const data = useData();
  const store = useStore();
  const ref = lessonList(data.units, store.settings).find((r) => r.lesson.id === lessonId)!;
  const voices = useDeviceVoices();
  const canListen = voices.length > 0 || Object.keys(data.audio.items).length > 0;
  const initial = useMemo(() => buildSession(ref.lesson, data, store.settings, store.progress, canListen), [lessonId, canListen]); // eslint-disable-line react-hooks/exhaustive-deps
  const [steps, setSteps] = useState<Step[]>(initial);
  // voices load a moment after the page; add listening practice once they're known (before starting)
  useEffect(() => { if (i === 0 && !result) setSteps(initial); }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [result, setResult] = useState<Result>();
  const [cheer, setCheer] = useState("");
  // every Afrikaans word taught so far (and its forms), to put speakers on Afrikaans text
  const taughtWords = useMemo(() => {
    const set = new Set<string>(["'n"]);
    for (const e of taughtUpTo(ref.lesson, data)) {
      for (const w of e.headword.toLowerCase().split(/[\s-]+/)) set.add(w);
      for (const f of Object.values(e.forms ?? {})) for (const w of String(f).toLowerCase().split(/[\s-]+/)) set.add(w);
    }
    return set;
  }, [lessonId]); // eslint-disable-line react-hooks/exhaustive-deps
  const [score, setScore] = useState({ right: 0, total: 0 });
  const step = steps[i];

  const finish = () => {
    const pct = score.total ? Math.round((score.right / score.total) * 100) : 100;
    const words = vocabEntries(ref.lesson, data);
    store.completeLesson(ref.lesson.id, pct, words.map((e) => e.id));
    store.addXp(10 + score.right);
    onDone({ score: pct, xp: 10 + score.right, words: words.length });
  };
  const next = () => {
    setResult(undefined);
    if (i + 1 >= steps.length) finish();
    else setI(i + 1);
  };
  const onResult = (r: Result) => {
    setResult(r);
    setCheer(praise());
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
            <Speech mood="cheer">New word!</Speech>
            <div className="mt-6 rounded-3xl border-2 border-stone-100 bg-white p-6"><WordCard key={step.entry.id} entry={step.entry} /></div>
          </>
        ) : (
          <>
            {step.retry && <div className="text-sm font-extrabold uppercase tracking-wide text-amber-500 mb-3">↻ Let's try this one again</div>}
            <TaughtWords.Provider value={taughtWords}>
              <ExerciseView key={i} ex={step.ex} onResult={onResult} locked={!!result} />
            </TaughtWords.Provider>
          </>
        )}
      </div>
      {step.kind === "intro" && (
        <BottomBar>
          <button onClick={next} className={`${bigButton} ${btnColor.green}`}>Continue</button>
        </BottomBar>
      )}
      {result && (
        <BottomBar tone={result.correct ? "good" : "bad"}>
          <div role="status" className={`mb-4 flex items-start gap-3 ${result.correct ? "text-emerald-700" : "text-rose-700"}`}>
            <span className={`w-10 h-10 shrink-0 rounded-full bg-white flex items-center justify-center text-xl font-black animate-pop ${result.correct ? "text-emerald-500" : "text-rose-500"}`}>{result.correct ? "✓" : "✗"}</span>
            <div>
              <div className="font-black text-2xl">{result.correct ? cheer : "Not quite"}</div>
              {result.note && <div className="mt-1 font-semibold"><Inline text={result.note} /></div>}
              {result.hint && <div className="mt-1 font-semibold"><Inline text={result.hint} /></div>}
              {!result.correct && result.expected && result.expected !== result.say && <div className="mt-1 font-semibold">Correct answer: <b>{result.expected}</b></div>}
              {result.say && (
                <div className="mt-2 flex items-center gap-2.5 font-semibold">
                  <AudioButton key={`${i}-${result.say}`} text={result.say} size="sm" autoPlay />
                  <span>{!result.correct && result.expected === result.say ? "Correct answer: " : ""}<b><SayWords text={result.say} /></b></span>
                </div>
              )}
            </div>
          </div>
          <button onClick={next} autoFocus className={`${bigButton} ${result.correct ? btnColor.green : btnColor.red}`}>Continue</button>
        </BottomBar>
      )}
    </>
  );
}
