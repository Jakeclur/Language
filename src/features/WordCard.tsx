import type { Entry } from "../types";
import { useStore } from "../lib/store";
import { visibleSenses } from "../lib/register";
import { AudioButton, Recorder } from "../components/Audio";
import { ConfidenceBadge, Pill, RegisterTag } from "../components/ui";
import { reportUrl } from "../lib/report";

const FORM_LABEL: Record<string, string> = {
  plural: "plural", diminutive: "diminutive", pastParticiple: "past", comparative: "comparative", superlative: "superlative", attributive: "before a noun", past: "past form",
};

export function WordCard({ entry, full = false }: { entry: Entry; full?: boolean }) {
  const { settings, progress, addCard, removeCard } = useStore();
  const senses = visibleSenses(entry, settings);
  const hidden = entry.senses.length - senses.length;
  const inDeck = !!progress.cards[entry.id];
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-3xl font-bold text-emerald-900" lang="af">{entry.headword}</h2>
            <AudioButton text={entry.headword} />
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-stone-600">
            {entry.ipa && <span className="font-mono">/{entry.ipa}/</span>}
            {entry.pos.map((p) => <Pill key={p}>{p}</Pill>)}
            {entry.cefr && <Pill className="bg-amber-100 text-amber-800">{entry.cefr}</Pill>}
            <ConfidenceBadge c={entry.verification.confidence} />
          </div>
        </div>
      </div>

      {entry.forms && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {Object.entries(entry.forms).map(([k, v]) => (
            <span key={k} className="rounded-lg bg-stone-50 border border-stone-200 px-2 py-1"><span className="text-stone-500">{FORM_LABEL[k] ?? k}:</span> <b lang="af">{v}</b></span>
          ))}
        </div>
      )}

      <ol className="mt-4 space-y-3">
        {senses.map((s, i) => (
          <li key={i} className={`rounded-xl p-3 ${s.register === "offensive-slur" ? "bg-red-50 border border-red-300" : "bg-stone-50"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-medium">{s.translations.join("; ")}</span>
              <RegisterTag r={s.register} severity={s.register === "offensive-slur" ? undefined : s.severity} />
              {s.regions?.map((r) => <Pill key={r} className="bg-teal-100 text-teal-800">{r}</Pill>)}
              {s.source !== "editorial" && <span className="text-xs text-stone-400">from {s.source}</span>}
            </div>
            {s.register === "offensive-slur" && <p className="text-sm text-red-800 mt-1 font-medium">⛔ Offensive slur. Shown so you can recognise it, never to use.</p>}
            {s.note && <p className="text-sm text-stone-600 mt-1">{s.note}</p>}
            {s.examples?.map((ex, j) => (
              <div key={j} className="mt-2 flex items-start gap-2">
                <AudioButton text={ex.af} size="sm" />
                <div>
                  <div lang="af" className="font-medium">{ex.af}</div>
                  <div className="text-sm text-stone-500">{ex.en}</div>
                </div>
              </div>
            ))}
          </li>
        ))}
      </ol>
      {hidden > 0 && <p className="text-sm text-stone-500 mt-2">🔞 {hidden} more meaning{hidden > 1 ? "s" : ""} hidden by your content settings.</p>}

      {full && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {inDeck ? (
              <button onClick={() => removeCard(entry.id)} className="rounded-xl px-4 py-2 bg-stone-100 font-medium">✓ In my deck (remove)</button>
            ) : (
              <button onClick={() => addCard(entry.id)} className="rounded-xl px-4 py-2 bg-emerald-700 text-white font-medium">＋ Add to my deck</button>
            )}
            <a href={reportUrl(entry.headword, `Dictionary entry: **${entry.headword}** (id \`${entry.id}\`)\nConfidence: ${entry.verification.confidence}`)} target="_blank" rel="noreferrer" className="rounded-xl px-4 py-2 bg-white border border-stone-300 font-medium">🚩 Report a mistake</a>
          </div>
          <div>
            <div className="text-sm font-semibold text-stone-700 mb-1">Practise saying it</div>
            <Recorder />
          </div>
          <details className="text-sm text-stone-600">
            <summary className="cursor-pointer font-medium">How was this checked?</summary>
            <ul className="list-disc ml-5 mt-2">
              <li>Sources: {entry.verification.sources.join(", ")}</li>
              <li>Checks passed: {entry.verification.checks.join(", ") || "none"}</li>
              {entry.frequencyRank && <li>Frequency rank: #{entry.frequencyRank} in the subtitles corpus</li>}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}
