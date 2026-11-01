import { useMemo, useState } from "react";
import { useData } from "../lib/dataContext";
import { useStore } from "../lib/store";
import { isDue, preview, Rating } from "../lib/srs";
import { checkAnswer, shuffle } from "../lib/text";
import { meaning } from "./course";
import { Button, Card, PageTitle } from "../components/ui";
import { AudioButton } from "../components/Audio";
import { Inline } from "../components/Md";
import type { Grade } from "ts-fsrs";

export function Review() {
  const data = useData();
  const store = useStore();
  const queue = useMemo(
    () => shuffle(Object.entries(store.progress.cards).filter(([id, c]) => isDue(c) && data.byId.has(id)).map(([id]) => id)).slice(0, 30),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<string>();
  const dir = useMemo(() => queue.map(() => (Math.random() < 0.5 ? "af-en" : "en-af")), [queue]);

  if (!Object.keys(store.progress.cards).length)
    return (
      <Card className="p-8 text-center max-w-xl mx-auto">
        <div className="text-5xl mb-3">🧠</div>
        <h1 className="text-2xl font-bold">Your deck is empty</h1>
        <p className="text-stone-600 mt-2">Finish a lesson, or tap “Add to my deck” on any dictionary word.</p>
        <a href="#learn" className="inline-block mt-5 rounded-xl bg-emerald-700 text-white px-5 py-2.5 font-semibold">Start a lesson</a>
      </Card>
    );
  if (i >= queue.length) {
    const nextDue = Object.values(store.progress.cards).map((c) => new Date(c.due).getTime()).sort((a, b) => a - b)[0];
    return (
      <Card className="p-8 text-center max-w-xl mx-auto">
        <div className="text-5xl mb-3">✨</div>
        <h1 className="text-2xl font-bold">{queue.length ? "Review done. Mooi so!" : "Nothing due right now"}</h1>
        {nextDue && <p className="text-stone-600 mt-2">Next card due {new Date(nextDue).toLocaleString()}</p>}
        <a href="#learn" className="inline-block mt-5 rounded-xl bg-emerald-700 text-white px-5 py-2.5 font-semibold">Learn something new</a>
      </Card>
    );
  }
  const id = queue[i];
  const entry = data.byId.get(id)!;
  const card = store.progress.cards[id];
  const times = preview(card);
  const afFirst = dir[i] === "af-en";
  const check = () => {
    if (typed.trim()) {
      const r = checkAnswer(typed, [entry.headword], "af");
      setVerdict(r.status === "correct" ? "✓ Correct" + (r.note ? ". " + r.note : "") : "✗ Not quite");
    }
    setRevealed(true);
  };
  const grade = (g: Grade) => {
    store.gradeCard(id, g);
    store.recordAnswer(g !== Rating.Again);
    store.addXp(g === Rating.Again ? 1 : 2);
    setRevealed(false);
    setTyped("");
    setVerdict(undefined);
    setI(i + 1);
  };
  return (
    <div className="max-w-xl mx-auto">
      <PageTitle sub={`${i + 1} of ${queue.length}`}>Review</PageTitle>
      <Card className="p-6 text-center">
        <div className="text-sm text-stone-500 mb-2">{afFirst ? "What does this mean?" : "Say it in Afrikaans"}</div>
        <div className="text-3xl font-bold flex items-center justify-center gap-3" lang={afFirst ? "af" : "en"}>
          {afFirst ? entry.headword : meaning(entry, store.settings)}
          {afFirst && <AudioButton text={entry.headword} />}
        </div>
        {!revealed && !afFirst && (
          <form className="mt-5" onSubmit={(e) => { e.preventDefault(); check(); }}>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus lang="af" placeholder="Type it (optional)…" className="w-full rounded-xl border-2 border-stone-300 p-3 text-lg text-center" />
          </form>
        )}
        {revealed ? (
          <div className="mt-5 border-t pt-5">
            {verdict && <div className="mb-2 font-medium"><Inline text={verdict} /></div>}
            <div className="text-2xl font-semibold flex items-center justify-center gap-3" lang={afFirst ? "en" : "af"}>
              {afFirst ? meaning(entry, store.settings) : entry.headword}
              {!afFirst && <AudioButton text={entry.headword} />}
            </div>
            {entry.ipa && <div className="font-mono text-stone-500 mt-1">/{entry.ipa}/</div>}
            {entry.senses[0].examples?.[0] && <div className="text-sm text-stone-600 mt-2"><span lang="af">{entry.senses[0].examples[0].af}</span> · {entry.senses[0].examples[0].en}</div>}
            <div className="grid grid-cols-4 gap-2 mt-5">
              {([[Rating.Again, "Again", "bg-red-100 text-red-800"], [Rating.Hard, "Hard", "bg-orange-100 text-orange-800"], [Rating.Good, "Good", "bg-emerald-100 text-emerald-800"], [Rating.Easy, "Easy", "bg-sky-100 text-sky-800"]] as const).map(([g, label, cls]) => (
                <button key={label} onClick={() => grade(g as Grade)} className={`rounded-xl py-3 font-semibold ${cls}`}>
                  {label}<div className="text-xs font-normal">{times[g]}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Button className="w-full mt-5" onClick={check}>{typed ? "Check" : "Show answer"}</Button>
        )}
      </Card>
    </div>
  );
}
