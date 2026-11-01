import { useState } from "react";
import { useData } from "../lib/dataContext";
import { useStore, type Settings } from "../lib/store";
import type { Goal } from "../types";
import { BackLink, Button, Card, Dialog, PageTitle, ProgressBar } from "../components/ui";
import { Md } from "../components/Md";
import { AudioButton } from "../components/Audio";
import { visibleUnits } from "./course";
import { REPO_URL } from "../lib/report";
import { storageAvailable } from "../lib/storage";
import { go } from "../lib/router";
import { useDeviceVoices } from "../lib/audio";

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
      <div className="max-w-lg w-full">
        {step === 0 ? (
          <>
            <h1 className="text-4xl font-bold tracking-tight">Welkom! 👋</h1>
            <p className="text-stone-500 mt-2 text-lg">Why are you learning Afrikaans? Pick any.</p>
            <div className="grid gap-3 mt-8">
              {GOALS.map((g) => (
                <button key={g.id} onClick={() => toggle(g.id)} className={`text-left rounded-2xl border-2 bg-white px-5 py-4 flex items-center gap-4 transition ${goals.includes(g.id) ? "border-emerald-500" : "border-transparent shadow-sm"}`}>
                  <span className="text-2xl">{g.icon}</span>
                  <span><b>{g.label}</b><span className="block text-sm text-stone-500">{g.desc}</span></span>
                  <span className={`ml-auto w-6 h-6 rounded-full flex items-center justify-center text-sm ${goals.includes(g.id) ? "bg-emerald-500 text-white" : "border-2 border-stone-200"}`}>{goals.includes(g.id) ? "✓" : ""}</span>
                </button>
              ))}
            </div>
            <Button className="w-full mt-8 py-4 text-lg" onClick={() => setStep(1)}>Continue</Button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight">How much do you know already?</h1>
            <div className="grid gap-3 mt-8">
              <button onClick={() => { updateSettings({ goals, onboarded: true, unlockAll: false }); go(""); }} className="text-left rounded-2xl bg-white shadow-sm border-2 border-transparent hover:border-emerald-500 px-5 py-5">
                <b className="text-lg">🌱 I'm new to Afrikaans</b><span className="block text-stone-500">Start from the very beginning</span>
              </button>
              <button onClick={() => { updateSettings({ goals, onboarded: true, unlockAll: true }); go(""); }} className="text-left rounded-2xl bg-white shadow-sm border-2 border-transparent hover:border-emerald-500 px-5 py-5">
                <b className="text-lg">🌿 I know some already</b><span className="block text-stone-500">Unlock every lesson and jump in anywhere</span>
              </button>
            </div>
            {!storageAvailable() && <p className="text-sm text-amber-700 mt-4">Heads up: this browser isn't letting the app save, so progress will last only for this visit.</p>}
          </>
        )}
      </div>
    </div>
  );
}

const MORE_LINKS = [
  { route: "phrasebook", icon: "💬", label: "Phrasebook", desc: "Ready-made phrases for real situations" },
  { route: "grammar", icon: "📐", label: "Grammar", desc: "Every rule from the course in one place" },
  { route: "sounds", icon: "👄", label: "Pronunciation", desc: "How each letter and sound is said" },
  { route: "progress", icon: "📊", label: "Progress", desc: "Streak, words learned, accuracy" },
  { route: "settings", icon: "⚙️", label: "Settings", desc: "Goals, daily target, mature content" },
  { route: "about", icon: "ℹ️", label: "About", desc: "Sources, quality checks, audio" },
];

export function MorePage() {
  return (
    <div>
      <PageTitle>More</PageTitle>
      <Card className="divide-y divide-stone-100 overflow-hidden">
        {MORE_LINKS.map((l) => (
          <a key={l.route} href={`#${l.route}`} className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50">
            <span className="w-11 h-11 rounded-2xl bg-stone-100 flex items-center justify-center text-xl">{l.icon}</span>
            <span className="flex-1"><b className="block">{l.label}</b><span className="text-sm text-stone-400">{l.desc}</span></span>
            <span className="text-stone-300 text-xl">›</span>
          </a>
        ))}
      </Card>
    </div>
  );
}

export function GrammarPage() {
  const data = useData();
  const { settings } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string>();
  const units = visibleUnits(data.units, settings);
  const items = units.flatMap((u) => u.lessons.map((l) => ({ u, l })))
    .filter(({ u, l }) => !q || `${u.title} ${l.title} ${l.explanation.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <BackLink href="#more">More</BackLink>
      <PageTitle>Grammar</PageTitle>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: negation, past tense, plural…" className="w-full rounded-2xl bg-white shadow-sm px-5 py-3.5 mb-5 outline-none focus:ring-2 focus:ring-emerald-400" />
      <Card className="divide-y divide-stone-100 overflow-hidden">
        {items.map(({ u, l }) => {
          const isOpen = open === l.id || !!q;
          return (
            <div key={l.id}>
              <button onClick={() => setOpen(open === l.id ? undefined : l.id)} className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-stone-50" aria-expanded={isOpen}>
                <span className="text-xl">{u.icon}</span>
                <span className="flex-1"><b className="block">{l.title}</b><span className="text-sm text-stone-400">{u.level} · {u.title}</span></span>
                <span className={`text-stone-300 transition ${isOpen ? "rotate-90" : ""}`}>›</span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 space-y-3 text-stone-700 leading-relaxed">
                  {l.explanation.map((p, i) => <Md key={i} text={p} />)}
                  <a href={`#lesson-${l.id}`} className="inline-block font-semibold text-emerald-700">Practise this →</a>
                </div>
              )}
            </div>
          );
        })}
      </Card>
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
  const [active, setActive] = useState(groups[0]?.id);
  const g = groups.find((x) => x.id === active) ?? groups[0];
  return (
    <div>
      <BackLink href="#more">More</BackLink>
      <PageTitle>Phrasebook</PageTitle>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 mb-4">
        {groups.map((x) => (
          <button key={x.id} onClick={() => setActive(x.id)} className={`shrink-0 rounded-full px-4 py-2 font-medium ${x.id === g.id ? "bg-emerald-600 text-white" : "bg-white shadow-sm text-stone-600"}`}>{x.icon} {x.title}</button>
        ))}
      </div>
      <Card className="divide-y divide-stone-100 overflow-hidden">
        {g.phrases.map((p) => (
          <div key={p.af} className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1"><div className="font-semibold text-lg" lang="af">{p.af}</div><div className="text-stone-500">{p.en}</div></div>
            <AudioButton text={p.af} size="sm" />
          </div>
        ))}
      </Card>
    </div>
  );
}

export function SoundsPage() {
  const data = useData();
  return (
    <div>
      <BackLink href="#more">More</BackLink>
      <PageTitle sub="Afrikaans spelling is very regular. Learn these and you can read anything aloud.">Pronunciation</PageTitle>
      <Card className="divide-y divide-stone-100 overflow-hidden">
        {data.extras.pronunciation.map((s) => {
          const ex = s.example.split(" / ")[0];
          return (
            <div key={s.spelling} className="flex items-start gap-4 px-5 py-4">
              <div className="w-16 shrink-0 text-2xl font-bold text-emerald-700" lang="af">{s.spelling}</div>
              <div className="flex-1">
                <div className="font-semibold" lang="af">{s.example} <span className="font-mono font-normal text-sm text-stone-400 ml-1">[{s.ipa}]</span></div>
                <p className="text-stone-500 mt-0.5">{s.tip}</p>
              </div>
              <AudioButton text={ex} size="sm" />
            </div>
          );
        })}
      </Card>
    </div>
  );
}

export function ProgressPage() {
  const data = useData();
  const { progress, settings, streak } = useStore();
  const units = visibleUnits(data.units, settings);
  const cards = Object.values(progress.cards);
  const mature = cards.filter((c) => c.scheduled_days >= 21).length;
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    const k = d.toISOString().slice(0, 10);
    return { k, xp: progress.days[k] ?? 0 };
  });
  const max = Math.max(settings.dailyGoal, ...days.map((d) => d.xp));
  const stats: [string, string | number][] = [
    ["Day streak", `🔥 ${streak}`], ["Total XP", progress.xp], ["Words learning", cards.length], ["Words mastered", mature],
    ["Lessons done", Object.keys(progress.lessons).length], ["Accuracy", progress.answered ? Math.round((progress.correct / progress.answered) * 100) + "%" : "–"],
  ];
  return (
    <div className="space-y-5">
      <BackLink href="#more">More</BackLink>
      <PageTitle>Progress</PageTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map(([l, v]) => (
          <Card key={l} className="p-5"><div className="text-sm text-stone-400">{l}</div><div className="text-2xl font-bold mt-1">{v}</div></Card>
        ))}
      </div>
      <Card className="p-5">
        <div className="text-sm text-stone-400 mb-4">Last 4 weeks</div>
        <div className="flex items-end gap-1 h-24" role="img" aria-label="XP per day for the last 28 days">
          {days.map((d) => (
            <div key={d.k} title={`${d.k}: ${d.xp} XP`} className={`flex-1 rounded-full ${d.xp >= settings.dailyGoal ? "bg-emerald-500" : d.xp ? "bg-emerald-200" : "bg-stone-100"}`} style={{ height: `${Math.max(8, (d.xp / max) * 100)}%` }} />
          ))}
        </div>
      </Card>
      <Card className="p-5 space-y-4">
        {[...new Set(units.map((u) => u.level))].map((lv) => {
          const ls = units.filter((u) => u.level === lv).flatMap((u) => u.lessons);
          const done = ls.filter((l) => progress.lessons[l.id]).length;
          return (
            <div key={lv}>
              <div className="flex justify-between text-sm mb-1.5"><span className="font-semibold">{lv}</span><span className="text-stone-400">{done} of {ls.length}</span></div>
              <ProgressBar value={done / ls.length} />
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function Toggle({ on, onChange, label, desc }: { on: boolean; onChange: () => void; label: string; desc: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onChange} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-stone-50">
      <span className="flex-1"><b className="block">{label}</b><span className="text-sm text-stone-400">{desc}</span></span>
      <span className={`w-12 h-7 rounded-full p-1 transition ${on ? "bg-emerald-500" : "bg-stone-200"}`}>
        <span className={`block w-5 h-5 rounded-full bg-white shadow transition ${on ? "translate-x-5" : ""}`} />
      </span>
    </button>
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
  return (
    <div className="space-y-6">
      <div>
        <BackLink href="#more">More</BackLink>
        <PageTitle>Settings</PageTitle>
      </div>
      <section>
        <h2 className="text-sm font-medium text-stone-400 mb-2 px-1">Why you're learning</h2>
        <Card className="p-5">
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button key={g.id} onClick={() => updateSettings({ goals: settings.goals.includes(g.id) ? settings.goals.filter((x) => x !== g.id) : [...settings.goals, g.id] })}
                className={`rounded-full px-4 py-2 font-medium ${settings.goals.includes(g.id) ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-600"}`}>{g.icon} {g.label}</button>
            ))}
          </div>
          <label className="block mt-6 font-semibold">Daily goal: {settings.dailyGoal} XP
            <input type="range" min={10} max={150} step={10} value={settings.dailyGoal} onChange={(e) => updateSettings({ dailyGoal: Number(e.target.value) })} className="w-full mt-2 accent-emerald-600" />
          </label>
        </Card>
      </section>
      <section>
        <h2 className="text-sm font-medium text-stone-400 mb-2 px-1">Course</h2>
        <Card className="overflow-hidden">
          <Toggle on={settings.unlockAll} onChange={() => updateSettings({ unlockAll: !settings.unlockAll })} label="Unlock all lessons" desc="Skip ahead if you already know some Afrikaans" />
        </Card>
      </section>
      <section>
        <h2 className="text-sm font-medium text-stone-400 mb-2 px-1">Mature content (18+)</h2>
        <Card className="overflow-hidden divide-y divide-stone-100">
          <Toggle on={settings.showStreet} onChange={() => toggleAdult("showStreet")} label="Street Afrikaans" desc="Rude words and swearing, plus the Street Afrikaans unit" />
          <Toggle on={settings.showSlurs} onChange={() => toggleAdult("showSlurs")} label="Offensive slurs in the dictionary" desc="For recognition only, with warnings. Never in exercises" />
        </Card>
        {settings.adultConfirmed && <button className="text-sm text-stone-400 mt-2 px-1 hover:text-stone-600" onClick={() => updateSettings({ adultConfirmed: false, showStreet: false, showSlurs: false })}>Lock mature content again</button>}
      </section>
      <section>
        <h2 className="text-sm font-medium text-stone-400 mb-2 px-1">Your data</h2>
        <Card className="p-5">
          <p className="text-stone-500 mb-4">Progress is saved on this device only. No account, no tracking.</p>
          <Button variant="secondary" onClick={() => setConfirmReset(true)}>Reset progress</Button>
        </Card>
      </section>
      <Dialog open={!!gate} title="Are you 18 or older?" onClose={() => setGate(null)}>
        <p className="text-stone-600">This shows strong swearing and vulgar language, so you can understand real speech. It's not a suggestion to use it.</p>
        <div className="flex gap-3 mt-6">
          <Button variant="secondary" className="flex-1" onClick={() => setGate(null)}>No</Button>
          <Button className="flex-1" onClick={() => { updateSettings({ adultConfirmed: true, [gate as string]: true }); setGate(null); }}>Yes, I'm 18+</Button>
        </div>
      </Dialog>
      <Dialog open={confirmReset} title="Reset all progress?" onClose={() => setConfirmReset(false)}>
        <p className="text-stone-600">This deletes your XP, streak, lesson results and review deck on this device.</p>
        <div className="flex gap-3 mt-6">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmReset(false)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={() => { resetProgress(); setConfirmReset(false); }}>Reset</Button>
        </div>
      </Dialog>
    </div>
  );
}

export function AboutPage() {
  const data = useData();
  const voices = useDeviceVoices();
  const s = data.report.summary as { dictionary?: Record<string, number>; course?: Record<string, number>; issues?: Record<string, number> };
  const recorded = Object.keys(data.audio.items).length;
  return (
    <div className="space-y-5">
      <BackLink href="#more">More</BackLink>
      <PageTitle>About</PageTitle>
      <Card className="p-6">
        <h2 className="font-bold text-lg mb-2">Audio</h2>
        <p className="text-stone-600">
          {recorded > 0 ? `${recorded.toLocaleString()} words and sentences have recorded audio, each checked automatically with speech recognition.` : "Recorded audio is being prepared."}
          {voices.length > 0 && ` Everything else plays with your device's natural Afrikaans voice (${voices[0].name.replace(/ - .*/, "")}).`}
          {" "}Robotic voices are never used, so the speaker button only appears when good audio is available.
        </p>
        {data.audio.voices.some((v) => v.id === "mms") && (
          <p className="text-sm text-stone-400 mt-3">Voice: <a className="underline" href="https://huggingface.co/facebook/mms-tts-afr" target="_blank" rel="noreferrer">Meta MMS-TTS Afrikaans</a> · CC BY-NC 4.0</p>
        )}
      </Card>
      {s.dictionary && (
        <Card className="p-6">
          <h2 className="font-bold text-lg mb-2">How the content is checked</h2>
          <p className="text-stone-600">
            Every word and sentence is checked automatically: independent dictionaries must agree, words must appear in real text or a pronunciation lexicon,
            and sentences pass a spellchecker and grammar rules (double <i>nie</i>, verb position).
            Of {s.dictionary.entries?.toLocaleString()} words, {((s.dictionary.verified ?? 0) + (s.dictionary.checked ?? 0)).toLocaleString()} are confirmed by two or more sources. Lessons only use confirmed words.
          </p>
          <p className="text-stone-600 mt-3">Spot a mistake? Use <b>Report a mistake</b> on any word or lesson. It opens a public issue on <a className="text-emerald-700 underline" href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer">GitHub</a>.</p>
        </Card>
      )}
      <Card className="p-6">
        <h2 className="font-bold text-lg mb-3">Sources & licences</h2>
        <ul className="space-y-1.5 text-stone-600">
          {Object.entries(data.dictionary.sources).map(([k, v]) => (
            <li key={k}>{v.url ? <a className="underline" href={v.url} target="_blank" rel="noreferrer">{v.name}</a> : v.name} <span className="text-stone-400">· {v.licence}</span></li>
          ))}
        </ul>
        <p className="text-sm text-stone-400 mt-4">Source code and data: <a className="underline" href={REPO_URL} target="_blank" rel="noreferrer">{REPO_URL}</a></p>
      </Card>
    </div>
  );
}
