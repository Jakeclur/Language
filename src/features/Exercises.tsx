import { useMemo, useState, type ReactNode } from "react";
import type { Exercise } from "../types";
import type { Generated } from "./course";
import { checkAnswer, normalise, shuffle, tiles } from "../lib/text";
import { AudioButton } from "../components/Audio";
import { Inline } from "../components/Md";
import { SEVERITY_LABEL } from "../lib/register";

export interface Result { correct: boolean; note?: string; hint?: string; expected?: string }
type Props<T> = { ex: T; onResult: (r: Result) => void; locked: boolean };

const SPECIAL = ["ê", "ë", "ô", "û", "î", "ï", "é", "'n"];

function Prompt({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-2">{label}</div>
      <div className="text-xl sm:text-2xl font-semibold">{children}</div>
    </div>
  );
}

function TextAnswer({ lang, onSubmit, locked, placeholder }: { lang: "af" | "en"; onSubmit: (v: string) => void; locked: boolean; placeholder: string }) {
  const [v, setV] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!locked && v.trim()) onSubmit(v); }}>
      <textarea
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!locked && v.trim()) onSubmit(v); } }}
        disabled={locked}
        rows={2}
        autoFocus
        lang={lang}
        autoCapitalize="off"
        spellCheck={false}
        placeholder={placeholder}
        className="w-full rounded-xl border-2 border-stone-300 focus:border-emerald-600 outline-none p-3 text-lg bg-white"
      />
      {lang === "af" && (
        <div className="flex gap-1.5 flex-wrap mt-2">
          {SPECIAL.map((c) => (
            <button key={c} type="button" disabled={locked} onClick={() => setV(v + c)} className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 font-medium">{c}</button>
          ))}
        </div>
      )}
      <button type="submit" disabled={locked || !v.trim()} className="mt-4 w-full rounded-xl bg-emerald-700 text-white font-semibold py-3 disabled:bg-stone-300">Check</button>
    </form>
  );
}

function Options({ options, answer, onResult, locked, lang }: { options: string[]; answer: string; onResult: (r: Result) => void; locked: boolean; lang?: "af" | "en" }) {
  const [picked, setPicked] = useState<string>();
  return (
    <div className="grid gap-2">
      {options.map((o) => {
        const state = !picked ? "" : o === answer ? "border-emerald-600 bg-emerald-50" : o === picked ? "border-red-500 bg-red-50" : "opacity-60";
        return (
          <button key={o} disabled={locked} onClick={() => { setPicked(o); onResult({ correct: o === answer, expected: answer }); }}
            className={`text-left rounded-xl border-2 border-stone-200 px-4 py-3 text-lg hover:border-emerald-500 transition flex items-center justify-between gap-2 ${state}`}>
            <span lang={lang}><Inline text={o} /></span>
            {lang === "af" && <AudioButton text={o} size="sm" />}
          </button>
        );
      })}
    </div>
  );
}

export function ChoiceEx({ ex, onResult, locked }: Props<Extract<Exercise, { type: "choice" }>>) {
  const opts = useMemo(() => shuffle(ex.options), [ex]);
  return (
    <>
      <Prompt label="Choose the right answer"><Inline text={ex.question} /></Prompt>
      <Options options={opts} answer={ex.answer} onResult={onResult} locked={locked} />
    </>
  );
}

export function McEx({ ex, onResult, locked }: Props<Extract<Generated, { type: "mc" }>>) {
  return (
    <>
      <Prompt label={ex.promptLang === "af" ? "What does this mean?" : "How do you say this in Afrikaans?"}>
        <span className="flex items-center gap-3" lang={ex.promptLang}>{ex.prompt}{ex.promptLang === "af" && <AudioButton text={ex.prompt} />}</span>
      </Prompt>
      <Options options={ex.options} answer={ex.answer} onResult={onResult} locked={locked} lang={ex.promptLang === "af" ? "en" : "af"} />
    </>
  );
}

export function TranslateEx({ ex, onResult, locked }: Props<Extract<Exercise, { type: "translate" }>>) {
  const target = ex.from === "en" ? "af" : "en";
  return (
    <>
      <Prompt label={ex.from === "en" ? "Translate into Afrikaans" : "Translate into English"}>
        <span className="flex items-center gap-3" lang={ex.from}>{ex.prompt}{ex.from === "af" && <AudioButton text={ex.prompt} />}</span>
      </Prompt>
      <TextAnswer lang={target} locked={locked} placeholder={target === "af" ? "Tik in Afrikaans…" : "Type in English…"}
        onSubmit={(v) => { const r = checkAnswer(v, ex.answers, target); onResult(r.status === "correct" ? { correct: true, note: r.note, expected: r.matched } : { correct: false, hint: r.hint, expected: r.expected }); }} />
    </>
  );
}

export function TypeWordEx({ ex, onResult, locked }: Props<Extract<Generated, { type: "type-word" }>>) {
  return (
    <>
      <Prompt label="Type the Afrikaans word">{ex.en}</Prompt>
      <TextAnswer lang="af" locked={locked} placeholder="Tik die woord…"
        onSubmit={(v) => { const r = checkAnswer(v, ex.answers, "af"); onResult(r.status === "correct" ? { correct: true, note: r.note, expected: r.matched } : { correct: false, hint: r.hint, expected: r.expected }); }} />
    </>
  );
}

export function TransformEx({ ex, onResult, locked }: Props<Extract<Exercise, { type: "transform" }>>) {
  return (
    <>
      <Prompt label={ex.instruction}><span lang="af" className="flex items-center gap-3">{ex.from}<AudioButton text={ex.from} /></span></Prompt>
      <TextAnswer lang="af" locked={locked} placeholder="Skryf die nuwe sin…"
        onSubmit={(v) => { const r = checkAnswer(v, ex.answers, "af"); onResult(r.status === "correct" ? { correct: true, note: r.note, expected: r.matched } : { correct: false, hint: r.hint, expected: r.expected }); }} />
    </>
  );
}

export function FillEx({ ex, onResult, locked }: Props<Extract<Exercise, { type: "fill" }>>) {
  const [before, after] = ex.af.split("___");
  const opts = useMemo(() => (ex.options ? shuffle(ex.options) : undefined), [ex]);
  const [picked, setPicked] = useState<string>();
  return (
    <>
      <Prompt label="Fill in the blank">
        <span lang="af">{before}<span className="inline-block min-w-16 border-b-2 border-emerald-600 text-emerald-700 text-center mx-1">{picked ?? " "}</span>{after}</span>
        <div className="text-base font-normal text-stone-500 mt-2">{ex.en}</div>
      </Prompt>
      {opts ? (
        <div className="flex gap-2 flex-wrap">
          {opts.map((o) => (
            <button key={o} disabled={locked} onClick={() => { setPicked(o); onResult({ correct: ex.answers.some((a) => normalise(a) === normalise(o)), expected: ex.af.replace("___", ex.answers[0]) }); }}
              className="rounded-xl border-2 border-stone-200 px-4 py-2 text-lg hover:border-emerald-500" lang="af">{o}</button>
          ))}
        </div>
      ) : (
        <TextAnswer lang="af" locked={locked} placeholder="…" onSubmit={(v) => { const r = checkAnswer(v, ex.answers, "af"); onResult({ correct: r.status === "correct", expected: ex.af.replace("___", ex.answers[0]) }); }} />
      )}
    </>
  );
}

export function OrderEx({ ex, onResult, locked }: Props<Extract<Exercise, { type: "order" }>>) {
  const correct = tiles(ex.af);
  const bank = useMemo(() => {
    let s = shuffle([...correct, ...(ex.extra ?? [])].map((t, i) => ({ t, i })));
    for (let n = 0; n < 5 && s.map((x) => x.t).join(" ") === correct.join(" "); n++) s = shuffle(s);
    return s;
  }, [ex]);
  const [chosen, setChosen] = useState<number[]>([]);
  const answer = chosen.map((i) => bank.find((b) => b.i === i)!.t);
  return (
    <>
      <Prompt label="Put the words in order">{ex.en}</Prompt>
      <div className="min-h-16 rounded-xl border-2 border-dashed border-stone-300 p-2 flex flex-wrap gap-2 mb-4" lang="af">
        {chosen.map((i) => (
          <button key={i} disabled={locked} onClick={() => setChosen(chosen.filter((c) => c !== i))} className="rounded-lg bg-emerald-100 text-emerald-900 px-3 py-2 text-lg font-medium shadow-sm">
            {bank.find((b) => b.i === i)!.t}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" lang="af">
        {bank.map((b) => (
          <button key={b.i} disabled={locked || chosen.includes(b.i)} onClick={() => setChosen([...chosen, b.i])}
            className="rounded-lg bg-white border-2 border-stone-200 px-3 py-2 text-lg font-medium disabled:opacity-30">{b.t}</button>
        ))}
      </div>
      <button disabled={locked || chosen.length === 0} onClick={() => {
        const ok = normalise(answer.join(" ")) === normalise(correct.join(" "));
        onResult({ correct: ok, expected: ex.af, hint: ok ? undefined : "Remember: the verb is usually the **second** item, and negatives end with **nie**." });
      }} className="mt-5 w-full rounded-xl bg-emerald-700 text-white font-semibold py-3 disabled:bg-stone-300">Check</button>
    </>
  );
}

export function RudeEx({ ex, onResult, locked }: Props<Extract<Exercise, { type: "rude" }>>) {
  const [picked, setPicked] = useState<number>();
  return (
    <>
      <Prompt label="How rude is this? (0–4)">
        <span lang="af">{ex.af}</span>
        <div className="text-base font-normal text-stone-500 mt-2">{ex.en}</div>
      </Prompt>
      <div className="grid grid-cols-5 gap-2">
        {[0, 1, 2, 3, 4].map((n) => (
          <button key={n} disabled={locked} onClick={() => { setPicked(n); onResult({ correct: n === ex.answer, expected: `${ex.answer}/4: ${SEVERITY_LABEL[ex.answer]}` }); }}
            className={`rounded-xl border-2 py-3 font-bold text-lg ${picked === n ? (n === ex.answer ? "border-emerald-600 bg-emerald-50" : "border-red-500 bg-red-50") : "border-stone-200"}`}>
            {n}
            <div className="text-[10px] font-normal leading-tight">{SEVERITY_LABEL[n]}</div>
          </button>
        ))}
      </div>
    </>
  );
}

export function MatchEx({ ex, onResult, locked }: Props<Extract<Generated, { type: "match" }>>) {
  const left = useMemo(() => shuffle(ex.pairs.map((p) => p[0])), [ex]);
  const right = useMemo(() => shuffle(ex.pairs.map((p) => p[1])), [ex]);
  const [sel, setSel] = useState<string>();
  const [done, setDone] = useState<string[]>([]);
  const [wrong, setWrong] = useState(0);
  const [flash, setFlash] = useState<string>();
  const pick = (r: string) => {
    if (!sel || locked) return;
    const ok = ex.pairs.some(([a, b]) => a === sel && b === r);
    if (ok) {
      const d = [...done, sel];
      setDone(d);
      setSel(undefined);
      if (d.length === ex.pairs.length) onResult({ correct: wrong === 0, note: wrong ? `${wrong} mismatch${wrong > 1 ? "es" : ""}` : undefined });
    } else {
      setWrong(wrong + 1);
      setFlash(r);
      setTimeout(() => setFlash(undefined), 400);
    }
  };
  const matchedRight = (r: string) => ex.pairs.some(([a, b]) => b === r && done.includes(a));
  return (
    <>
      <Prompt label="Match the pairs">Tap an Afrikaans word, then its meaning</Prompt>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          {left.map((l) => (
            <button key={l} lang="af" disabled={done.includes(l)} onClick={() => setSel(l)}
              className={`rounded-xl border-2 px-3 py-3 font-medium ${done.includes(l) ? "opacity-30 border-stone-200" : sel === l ? "border-emerald-600 bg-emerald-50" : "border-stone-200"}`}>{l}</button>
          ))}
        </div>
        <div className="grid gap-2">
          {right.map((r) => (
            <button key={r} disabled={matchedRight(r)} onClick={() => pick(r)}
              className={`rounded-xl border-2 px-3 py-3 text-sm ${matchedRight(r) ? "opacity-30 border-stone-200" : flash === r ? "border-red-500 bg-red-50" : "border-stone-200"}`}>{r}</button>
          ))}
        </div>
      </div>
    </>
  );
}

export function ExerciseView({ ex, onResult, locked }: Props<Exercise | Generated>) {
  switch (ex.type) {
    case "choice": return <ChoiceEx ex={ex} onResult={onResult} locked={locked} />;
    case "mc": return <McEx ex={ex} onResult={onResult} locked={locked} />;
    case "translate": return <TranslateEx ex={ex} onResult={onResult} locked={locked} />;
    case "type-word": return <TypeWordEx ex={ex} onResult={onResult} locked={locked} />;
    case "transform": return <TransformEx ex={ex} onResult={onResult} locked={locked} />;
    case "fill": return <FillEx ex={ex} onResult={onResult} locked={locked} />;
    case "order": return <OrderEx ex={ex} onResult={onResult} locked={locked} />;
    case "rude": return <RudeEx ex={ex} onResult={onResult} locked={locked} />;
    case "match": return <MatchEx ex={ex} onResult={onResult} locked={locked} />;
  }
}
