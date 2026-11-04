import { useMemo, useState, type ReactNode } from "react";
import type { Exercise } from "../types";
import type { Generated } from "./course";
import { checkAnswer, normalise, shuffle, tiles } from "../lib/text";
import { AudioButton } from "../components/Audio";
import { Inline } from "../components/Md";
import { SEVERITY_LABEL } from "../lib/register";
import { BottomBar, bigButton, btnColor } from "../components/BottomBar";
import { Mascot } from "../components/Mascot";

export interface Result { correct: boolean; note?: string; hint?: string; expected?: string }
type Props<T> = { ex: T; onResult: (r: Result) => void; locked: boolean };

const SPECIAL = ["ê", "ë", "ô", "û", "î", "ï", "é", "'n"];

function Prompt({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 text-lg font-extrabold text-stone-700 mb-4"><Mascot size={44} mood="think" />{label}</div>
      <div className="text-2xl sm:text-3xl font-black leading-snug text-stone-800">{children}</div>
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
        className="w-full rounded-2xl border-2 border-stone-200 focus:border-sky-400 outline-none p-4 text-xl font-semibold bg-stone-50 focus:bg-white resize-none"
      />
      {lang === "af" && (
        <div className="flex gap-1.5 flex-wrap mt-2">
          {SPECIAL.map((c) => (
            <button key={c} type="button" disabled={locked} onClick={() => setV(v + c)} className="btn-3d min-w-10 px-2.5 py-1.5 rounded-xl bg-white border-2 border-stone-200 shadow-[0_2px_0_#e7e5e4] font-bold">{c}</button>
          ))}
        </div>
      )}
      {!locked && (
        <BottomBar>
          <button type="submit" disabled={!v.trim()} className={`${bigButton} ${btnColor.green}`}>Check</button>
        </BottomBar>
      )}
    </form>
  );
}

function Options({ options, answer, onResult, locked, lang }: { options: string[]; answer: string; onResult: (r: Result) => void; locked: boolean; lang?: "af" | "en" }) {
  const [picked, setPicked] = useState<string>();
  return (
    <div className="grid gap-3">
      {options.map((o, idx) => {
        const state = !picked
          ? "border-stone-200 bg-white hover:bg-stone-50 shadow-[0_4px_0_#e7e5e4]"
          : o === answer ? "border-emerald-400 bg-emerald-50 text-emerald-800 shadow-[0_4px_0_#6ee7b7]"
          : o === picked ? "border-rose-300 bg-rose-50 text-rose-700 shadow-[0_4px_0_#fda4af]"
          : "border-stone-200 bg-white opacity-50";
        return (
          <button key={o} disabled={locked} onClick={() => { setPicked(o); onResult({ correct: o === answer, expected: answer }); }}
            className={`btn-3d text-left rounded-2xl border-2 px-4 py-4 text-lg font-bold flex items-center gap-4 ${state}`}>
            <span className="w-8 h-8 shrink-0 rounded-lg border-2 border-stone-200 text-stone-400 text-sm font-extrabold flex items-center justify-center">{idx + 1}</span>
            <span lang={lang}><Inline text={o} /></span>
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
        <span className="flex items-center gap-3" lang={ex.promptLang}>{ex.prompt}{ex.promptLang === "af" && <AudioButton text={ex.prompt} autoPlay />}</span>
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
        <span className="flex items-center gap-3" lang={ex.from}>{ex.prompt}{ex.from === "af" && <AudioButton text={ex.prompt} autoPlay />}</span>
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
        <span lang="af">{before}<span className="inline-block min-w-20 border-b-4 border-emerald-400 text-emerald-700 text-center mx-1">{picked ?? " "}</span>{after}</span>
        <div className="text-lg font-normal text-stone-500 mt-3">{ex.en}</div>
      </Prompt>
      {opts ? (
        <div className="flex gap-3 flex-wrap">
          {opts.map((o) => (
            <button key={o} disabled={locked} onClick={() => { setPicked(o); onResult({ correct: ex.answers.some((a) => normalise(a) === normalise(o)), expected: ex.af.replace("___", ex.answers[0]) }); }}
              className={`btn-3d rounded-2xl border-2 px-5 py-3 text-lg font-bold bg-white ${picked === o ? (ex.answers.some((a) => normalise(a) === normalise(o)) ? "border-emerald-400 bg-emerald-50 shadow-[0_4px_0_#6ee7b7]" : "border-rose-300 bg-rose-50 shadow-[0_4px_0_#fda4af]") : "border-stone-200 shadow-[0_4px_0_#e7e5e4] hover:bg-stone-50"}`} lang="af">{o}</button>
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
      <div className="min-h-20 border-b-2 border-stone-200 pb-3 flex flex-wrap content-start gap-2 mb-6" lang="af">
        {chosen.map((i) => (
          <button key={i} disabled={locked} onClick={() => setChosen(chosen.filter((c) => c !== i))} className="btn-3d rounded-xl bg-white border-2 border-stone-200 shadow-[0_3px_0_#e7e5e4] px-4 py-2 text-lg font-bold">
            {bank.find((b) => b.i === i)!.t}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" lang="af">
        {bank.map((b) => (
          <button key={b.i} disabled={locked || chosen.includes(b.i)} onClick={() => setChosen([...chosen, b.i])}
            className="btn-3d rounded-xl bg-white border-2 border-stone-200 shadow-[0_3px_0_#e7e5e4] px-4 py-2 text-lg font-bold disabled:bg-stone-100 disabled:text-transparent disabled:shadow-none">{b.t}</button>
        ))}
      </div>
      {!locked && (
        <BottomBar>
          <button disabled={chosen.length === 0} onClick={() => {
            const ok = normalise(answer.join(" ")) === normalise(correct.join(" "));
            onResult({ correct: ok, expected: ex.af, hint: ok ? undefined : "Remember: the verb is usually the **second** item, and negatives end with **nie**." });
          }} className={`${bigButton} ${btnColor.green}`}>Check</button>
        </BottomBar>
      )}
    </>
  );
}

export function RudeEx({ ex, onResult, locked }: Props<Extract<Exercise, { type: "rude" }>>) {
  const [picked, setPicked] = useState<number>();
  return (
    <>
      <Prompt label="How rude is this? (0–4)">
        <span lang="af">{ex.af}</span>
        <div className="text-lg font-normal text-stone-500 mt-3">{ex.en}</div>
      </Prompt>
      <div className="grid grid-cols-5 gap-2">
        {[0, 1, 2, 3, 4].map((n) => (
          <button key={n} disabled={locked} onClick={() => { setPicked(n); onResult({ correct: n === ex.answer, expected: `${ex.answer}/4: ${SEVERITY_LABEL[ex.answer]}` }); }}
            className={`btn-3d rounded-2xl border-2 py-3 font-black text-xl bg-white ${picked === n ? (n === ex.answer ? "border-emerald-400 bg-emerald-50" : "border-rose-300 bg-rose-50") : "border-stone-200 shadow-[0_4px_0_#e7e5e4]"}`}>
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
      <Prompt label="Match the pairs">Tap a word, then its meaning</Prompt>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          {left.map((l) => (
            <button key={l} lang="af" disabled={done.includes(l)} onClick={() => setSel(l)}
              className={`btn-3d rounded-2xl border-2 px-3 py-4 font-bold bg-white ${done.includes(l) ? "opacity-25 border-stone-200" : sel === l ? "border-sky-400 bg-sky-50 shadow-[0_4px_0_#7dd3fc]" : "border-stone-200 shadow-[0_4px_0_#e7e5e4]"}`}>{l}</button>
          ))}
        </div>
        <div className="grid gap-2">
          {right.map((r) => (
            <button key={r} disabled={matchedRight(r)} onClick={() => pick(r)}
              className={`btn-3d rounded-2xl border-2 px-3 py-4 text-sm font-semibold bg-white ${matchedRight(r) ? "opacity-25 border-stone-200" : flash === r ? "border-rose-400 bg-rose-50" : "border-stone-200 shadow-[0_4px_0_#e7e5e4]"}`}>{r}</button>
          ))}
        </div>
      </div>
    </>
  );
}

export function ListenEx({ ex, onResult, locked }: Props<Extract<Generated, { type: "listen" }>>) {
  return (
    <>
      <Prompt label="Listen. What does it mean?">
        <div className="flex items-center gap-4"><AudioButton text={ex.text} size="lg" slow autoPlay /></div>
      </Prompt>
      <Options options={ex.options} answer={ex.answer} onResult={(r) => onResult({ ...r, note: `You heard: **${ex.text}**` })} locked={locked} />
    </>
  );
}

export function DictationEx({ ex, onResult, locked }: Props<Extract<Generated, { type: "dictation" }>>) {
  return (
    <>
      <Prompt label="Listen and type what you hear">
        <div className="flex items-center gap-4"><AudioButton text={ex.text} size="lg" slow autoPlay /></div>
      </Prompt>
      <TextAnswer lang="af" locked={locked} placeholder="Tik wat jy hoor…"
        onSubmit={(v) => { const r = checkAnswer(v, [ex.text], "af"); onResult(r.status === "correct" ? { correct: true, note: r.note ?? `It means: ${ex.en}` } : { correct: false, hint: r.hint, expected: `${ex.text} (${ex.en})` }); }} />
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
    case "listen": return <ListenEx ex={ex} onResult={onResult} locked={locked} />;
    case "dictation": return <DictationEx ex={ex} onResult={onResult} locked={locked} />;
  }
}
