import { useState } from "react";
import { useData } from "../lib/dataContext";
import { useStore, type Settings } from "../lib/store";
import type { Goal } from "../types";
import { Button, Card, Dialog, PageTitle, ProgressBar } from "../components/ui";
import { Md } from "../components/Md";
import { AudioButton } from "../components/Audio";
import { visibleUnits } from "./course";
import { isDue } from "../lib/srs";
import { REPO_URL } from "../lib/report";
import { storageAvailable } from "../lib/storage";
import { go } from "../lib/router";

export const GOALS: { id: Goal; icon: string; label: string; desc: string }[] = [
  { id: "school", icon: "🎒", label: "School", desc: "Classroom language, essays, exams" },
  { id: "travel", icon: "✈️", label: "Travel", desc: "Survival phrases, food, directions" },
  { id: "moving", icon: "🏠", label: "Moving to SA / Namibia", desc: "Work, banking, renting, admin" },
  { id: "family", icon: "👪", label: "Family / heritage", desc: "Talk with Afrikaans family" },
  { id: "culture", icon: "🗣️", label: "Fun & culture", desc: "Music, sport, braai, slang" },
];

export function Onboarding() {
  const { settings, updateSettings } = useStore();
  const [goals, setGoals] = useState<Goal[]>(settings.goals);
  const [step, setStep] = useState(0);
  const toggle = (g: Goal) => setGoals(goals.includes(g) ? goals.filter((x) => x !== g) : [...goals, g]);
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-6 sm:p-8 max-w-lg w-full">
        {step === 0 ? (
          <>
            <div className="text-5xl mb-2">🇿🇦</div>
            <h1 className="text-3xl font-bold text-emerald-900">Welkom! Let's learn Afrikaans.</h1>
            <p className="text-stone-600 mt-2">Why are you learning? Pick as many as you like. Everyone learns the same grammar; we'll tailor the topics and phrases.</p>
            <div className="grid gap-2 mt-5">
              {GOALS.map((g) => (
                <button key={g.id} onClick={() => toggle(g.id)} className={`text-left rounded-xl border-2 px-4 py-3 flex items-center gap-3 ${goals.includes(g.id) ? "border-emerald-600 bg-emerald-50" : "border-stone-200"}`}>
                  <span className="text-2xl">{g.icon}</span>
                  <span><b>{g.label}</b><span className="block text-sm text-stone-500">{g.desc}</span></span>
                  {goals.includes(g.id) && <span className="ml-auto text-emerald-700 font-bold">✓</span>}
                </button>
              ))}
            </div>
            <Button className="w-full mt-5 py-3" onClick={() => setStep(1)}>Continue</Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-emerald-900">How much Afrikaans do you know?</h1>
            <div className="grid gap-2 mt-5">
              <button onClick={() => { updateSettings({ goals, onboarded: true, unlockAll: false }); go("learn"); }} className="text-left rounded-xl border-2 border-stone-200 hover:border-emerald-600 px-4 py-3">
                <b>🌱 None, I'm a complete beginner</b><span className="block text-sm text-stone-500">Start at Unit 1: sounds and greetings</span>
              </button>
              <button onClick={() => { updateSettings({ goals, onboarded: true, unlockAll: true }); go("learn"); }} className="text-left rounded-xl border-2 border-stone-200 hover:border-emerald-600 px-4 py-3">
                <b>🌿 I know some already</b><span className="block text-sm text-stone-500">Unlock every lesson and jump to what you need</span>
              </button>
            </div>
            {!storageAvailable() && <p className="text-sm text-amber-700 mt-4">Heads up: this browser isn't letting the app save, so progress will last only for this visit.</p>}
          </>
        )}
      </Card>
    </div>
  );
}

export function GrammarPage() {
  const data = useData();
  const { settings } = useStore();
  const [q, setQ] = useState("");
  const units = visibleUnits(data.units, settings);
  return (
    <div>
      <PageTitle sub="Every grammar explanation from the course, in one place.">Grammar reference</PageTitle>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search grammar: negation, past tense, plural…" className="w-full rounded-xl border-2 border-stone-300 px-4 py-2.5 mb-4 bg-white" />
      <div className="space-y-3">
        {units.flatMap((u) => u.lessons.map((l) => ({ u, l })))
          .filter(({ u, l }) => !q || `${u.title} ${l.title} ${l.explanation.join(" ")}`.toLowerCase().includes(q.toLowerCase()))
          .map(({ u, l }) => (
            <details key={l.id} className="bg-white rounded-2xl border border-stone-200 p-4" open={!!q}>
              <summary className="cursor-pointer font-semibold">{u.icon} {u.level} · {l.title} <span className="text-stone-500 font-normal">({u.title})</span></summary>
              <div className="mt-3 space-y-2 text-stone-800">{l.explanation.map((p, i) => <Md key={i} text={p} />)}</div>
              <a href={`#lesson-${l.id}`} className="inline-block mt-3 text-emerald-800 underline">Practise this →</a>
            </details>
          ))}
      </div>
    </div>
  );
}

export function PhrasebookPage() {
  const data = useData();
  const { settings } = useStore();
  const groups = [...data.extras.phrasebook].sort((a, b) => {
    const score = (g: typeof a) => (g.goals.some((x) => settings.goals.includes(x as Goal)) ? 0 : g.goals.includes("all") ? 1 : 2);
    return score(a) - score(b);
  });
  return (
    <div>
      <PageTitle sub={settings.goals.length ? "Sorted for your goals." : "Survival phrases by situation."}>Phrasebook</PageTitle>
      <div className="grid md:grid-cols-2 gap-4">
        {groups.map((g) => (
          <Card key={g.id} className="p-5">
            <h2 className="text-lg font-bold mb-3">{g.icon} {g.title}</h2>
            <ul className="space-y-2">
              {g.phrases.map((p) => (
                <li key={p.af} className="flex items-start gap-2">
                  <AudioButton text={p.af} size="sm" />
                  <div><div className="font-medium" lang="af">{p.af}</div><div className="text-sm text-stone-500">{p.en}</div></div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SoundsPage() {
  const data = useData();
  return (
    <div>
      <PageTitle sub="Afrikaans spelling is very regular. Learn these sounds and you can read anything aloud.">Pronunciation guide</PageTitle>
      <div className="grid sm:grid-cols-2 gap-3">
        {data.extras.pronunciation.map((s) => {
          const ex = s.example.split(" / ")[0];
          const entry = data.byHeadword.get(ex.toLowerCase());
          return (
            <Card key={s.spelling} className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-emerald-900" lang="af">{s.spelling}</div>
                <div className="font-mono text-stone-500">[{s.ipa}]</div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <AudioButton text={ex} size="sm" />
                <b lang="af">{s.example}</b>
                {entry?.ipa && <span className="font-mono text-sm text-stone-500">/{entry.ipa}/</span>}
              </div>
              <p className="text-sm text-stone-600 mt-2">{s.tip}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function ProgressPage() {
  const data = useData();
  const { progress, settings, streak } = useStore();
  const units = visibleUnits(data.units, settings);
  const cards = Object.values(progress.cards);
  const due = cards.filter((c) => isDue(c)).length;
  const mature = cards.filter((c) => c.scheduled_days >= 21).length;
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    const k = d.toISOString().slice(0, 10);
    return { k, xp: progress.days[k] ?? 0 };
  });
  const max = Math.max(settings.dailyGoal, ...days.map((d) => d.xp));
  return (
    <div className="space-y-5">
      <PageTitle>Your progress</PageTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[["🔥", streak, "day streak"], ["⭐", progress.xp, "XP"], ["🧠", cards.length, "words learning"], ["🏆", mature, "words mastered (21+ days)"], ["🔁", due, "due now"], ["🎯", progress.answered ? Math.round((progress.correct / progress.answered) * 100) + "%" : "–", "accuracy"], ["📗", Object.keys(progress.lessons).length, "lessons done"]].map(([i, v, l]) => (
          <Card key={l as string} className="p-4 text-center"><div className="text-2xl">{i} {v}</div><div className="text-xs text-stone-500">{l}</div></Card>
        ))}
      </div>
      <Card className="p-5">
        <h2 className="font-bold mb-3">Last 4 weeks</h2>
        <div className="flex items-end gap-1 h-28" role="img" aria-label="XP per day for the last 28 days">
          {days.map((d) => (
            <div key={d.k} title={`${d.k}: ${d.xp} XP`} className={`flex-1 rounded-t ${d.xp >= settings.dailyGoal ? "bg-emerald-600" : d.xp ? "bg-emerald-300" : "bg-stone-200"}`} style={{ height: `${Math.max(4, (d.xp / max) * 100)}%` }} />
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="font-bold mb-3">Level progress</h2>
        {[...new Set(units.map((u) => u.level))].map((lv) => {
          const ls = units.filter((u) => u.level === lv).flatMap((u) => u.lessons);
          const done = ls.filter((l) => progress.lessons[l.id]).length;
          return (
            <div key={lv} className="mb-3">
              <div className="flex justify-between text-sm"><span className="font-semibold">{lv}</span><span>{done}/{ls.length}</span></div>
              <ProgressBar value={done / ls.length} />
            </div>
          );
        })}
      </Card>
    </div>
  );
}

export function SettingsPage() {
  const { settings, updateSettings, resetProgress } = useStore();
  const [gate, setGate] = useState<keyof Settings | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const toggleAdult = (key: "showStreet" | "showSlurs") => {
    if (settings[key]) return updateSettings({ [key]: false });
    if (!settings.adultConfirmed) return setGate(key);
    updateSettings({ [key]: true });
  };
  const Toggle = ({ on, onChange, label, desc }: { on: boolean; onChange: () => void; label: string; desc: string }) => (
    <label className="flex items-start gap-3 py-3 border-b border-stone-100 last:border-0 cursor-pointer">
      <input type="checkbox" checked={on} onChange={onChange} className="mt-1 w-5 h-5 accent-emerald-700" />
      <span><b>{label}</b><span className="block text-sm text-stone-500">{desc}</span></span>
    </label>
  );
  return (
    <div className="max-w-2xl space-y-5">
      <PageTitle>Settings</PageTitle>
      <Card className="p-5">
        <h2 className="font-bold mb-2">My goals</h2>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <button key={g.id} onClick={() => updateSettings({ goals: settings.goals.includes(g.id) ? settings.goals.filter((x) => x !== g.id) : [...settings.goals, g.id] })}
              className={`rounded-full px-3 py-1.5 border-2 ${settings.goals.includes(g.id) ? "border-emerald-600 bg-emerald-50" : "border-stone-200"}`}>{g.icon} {g.label}</button>
          ))}
        </div>
        <label className="block mt-4 text-sm font-semibold">Daily goal: {settings.dailyGoal} XP
          <input type="range" min={10} max={150} step={10} value={settings.dailyGoal} onChange={(e) => updateSettings({ dailyGoal: Number(e.target.value) })} className="w-full accent-emerald-700" />
        </label>
      </Card>
      <Card className="p-5">
        <h2 className="font-bold">Course</h2>
        <Toggle on={settings.unlockAll} onChange={() => updateSettings({ unlockAll: !settings.unlockAll })} label="Unlock all lessons" desc="Skip ahead if you already know some Afrikaans." />
      </Card>
      <Card className="p-5 border-red-200">
        <h2 className="font-bold">🔞 Mature content</h2>
        <p className="text-sm text-stone-500 mb-2">Off by default. Rude and vulgar words are labelled with a severity from 0 to 4.</p>
        <Toggle on={settings.showStreet} onChange={() => toggleAdult("showStreet")} label="Street Afrikaans (18+)" desc="Rude and vulgar words (severity 2–4) in the dictionary, plus the Street Afrikaans unit." />
        <Toggle on={settings.showSlurs} onChange={() => toggleAdult("showSlurs")} label="Show offensive slurs in the dictionary (18+)" desc="Recognition only, with warnings and context. Never used in exercises." />
        {settings.adultConfirmed && <button className="text-sm underline text-stone-500 mt-2" onClick={() => updateSettings({ adultConfirmed: false, showStreet: false, showSlurs: false })}>Lock mature content again</button>}
      </Card>
      <Card className="p-5">
        <h2 className="font-bold mb-2">Data</h2>
        <p className="text-sm text-stone-500 mb-3">Your progress is saved on this device only. There are no accounts and no tracking.</p>
        <Button variant="danger" onClick={() => setConfirmReset(true)}>Reset all progress</Button>
      </Card>
      <Dialog open={!!gate} title="Are you 18 or older?" onClose={() => setGate(null)}>
        <p className="text-stone-600">This unlocks strong swearing and vulgar language. It's here so you can understand real speech, not to encourage using it.</p>
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" className="flex-1" onClick={() => setGate(null)}>No</Button>
          <Button className="flex-1" onClick={() => { updateSettings({ adultConfirmed: true, [gate as string]: true }); setGate(null); }}>Yes, I'm 18+</Button>
        </div>
      </Dialog>
      <Dialog open={confirmReset} title="Reset all progress?" onClose={() => setConfirmReset(false)}>
        <p className="text-stone-600">This deletes your XP, streak, lesson results and review deck on this device.</p>
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmReset(false)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={() => { resetProgress(); setConfirmReset(false); }}>Reset</Button>
        </div>
      </Dialog>
    </div>
  );
}

export function AboutPage() {
  const data = useData();
  const s = data.report.summary as { dictionary?: Record<string, number>; course?: Record<string, number>; issues?: Record<string, number>; generatedAt?: string };
  return (
    <div className="max-w-3xl space-y-5">
      <PageTitle sub="How the content is made and checked, and where it comes from.">About Leer Afrikaans</PageTitle>
      {s.dictionary && (
        <Card className="p-5">
          <h2 className="font-bold mb-3">Content quality report</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div><div className="text-2xl font-bold">{s.dictionary.entries?.toLocaleString()}</div><div className="text-xs text-stone-500">headwords</div></div>
            <div><div className="text-2xl font-bold text-emerald-700">{s.dictionary.verified?.toLocaleString()}</div><div className="text-xs text-stone-500">✅ verified</div></div>
            <div><div className="text-2xl font-bold text-sky-700">{s.dictionary.checked?.toLocaleString()}</div><div className="text-xs text-stone-500">☑️ checked</div></div>
            <div><div className="text-2xl font-bold text-amber-700">{s.dictionary.unverified?.toLocaleString()}</div><div className="text-xs text-stone-500">⚠️ unverified</div></div>
          </div>
          <p className="text-sm text-stone-600 mt-4">
            There's no human reviewer, so every word and sentence runs through automatic checks: agreement between independent dictionaries,
            real-text and lexicon attestation, a spellchecker, a grammar-rule engine (double <i>nie</i>, verb-second, verb-final), and consistency checks.
            Course flashcards may only use ✅/☑️ words. {s.course && <>The course has {s.course.units} units, {s.course.lessons} lessons and {s.course.exercises} hand-written exercises, plus generated vocabulary drills.</>}
            {" "}Latest build: {s.issues?.errors ?? 0} errors, {s.issues?.warnings ?? 0} warnings{s.generatedAt ? ` (${new Date(s.generatedAt).toLocaleDateString()})` : ""}.
          </p>
          <p className="text-sm text-stone-600 mt-2">Spotted a mistake? Every word and lesson has a <b>🚩 Report a mistake</b> link, which opens a public issue on <a className="underline" href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer">GitHub</a>.</p>
        </Card>
      )}
      <Card className="p-5">
        <h2 className="font-bold mb-3">Sources & licences</h2>
        <ul className="space-y-2 text-sm">
          {Object.entries(data.dictionary.sources).map(([k, v]) => (
            <li key={k}><b>{v.url ? <a className="underline" href={v.url} target="_blank" rel="noreferrer">{v.name}</a> : v.name}</b> · {v.licence}</li>
          ))}
        </ul>
        <p className="text-xs text-stone-500 mt-3">The dictionary data combines GPL, CC BY-SA and LGPL sources and is shared under compatible terms. Source code and data: <a className="underline" href={REPO_URL} target="_blank" rel="noreferrer">{REPO_URL}</a>.</p>
      </Card>
      <Card className="p-5">
        <h2 className="font-bold mb-2">Audio</h2>
        <p className="text-sm text-stone-600">Audio is generated in advance with natural neural voices (ElevenLabs and Azure af-ZA), then automatically checked with speech recognition. The app never falls back to robotic text-to-speech: items without audio show 🔈 until their recording is ready.
          {data.audio.voices.length ? ` Voices: ${data.audio.voices.map((v) => v.name).join(", ")}.` : " Audio generation hasn't been run for this build yet."}</p>
      </Card>
      <Card className="p-5">
        <h2 className="font-bold mb-2">Roadmap</h2>
        <ul className="list-disc ml-5 text-sm text-stone-700 space-y-1">
          <li>B1–C2 units: subordinate clauses, passive, idioms, regional varieties, formal writing, literature</li>
          <li>Bigger dictionary via Wiktionary import (pipeline ready: <code>npm run import</code>)</li>
          <li>Audio for every word, sentence and dialogue; listening and dictation exercises</li>
          <li>Accounts and sync across devices; community corrections with trusted reviewers</li>
        </ul>
      </Card>
    </div>
  );
}
