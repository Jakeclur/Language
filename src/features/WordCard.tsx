import type { Entry } from "../types";
import { useStore } from "../lib/store";
import { visibleSenses } from "../lib/register";
import { AudioButton, Recorder } from "../components/Audio";
import { ConfidenceBadge, RegisterTag } from "../components/ui";
import { reportUrl } from "../lib/report";

const FORM_LABEL: Record<string, string> = {
  plural: "Plural", diminutive: "Small", pastParticiple: "Past", comparative: "More", superlative: "Most", attributive: "Before a noun", past: "Past",
};

export function WordCard({ entry, full = false }: { entry: Entry; full?: boolean }) {
  const { settings, progress, addCard, removeCard } = useStore();
  const senses = visibleSenses(entry, settings);
  const main = senses.filter((s) => s.source === "editorial" || s.source === "wiktionary");
  const primary = main.length ? main : senses.slice(0, 1);
  const extra = senses.filter((s) => !primary.includes(s));
  const hidden = entry.senses.length - senses.length;
  const inDeck = !!progress.cards[entry.id];

  return (
    <div>
      <div className="flex items-center gap-4">
        <h2 className="text-4xl font-bold tracking-tight" lang="af">{entry.headword}</h2>
        <AudioButton text={entry.headword} size="lg" slow={full} autoPlay={!full} />
      </div>
      <div className="flex items-center gap-3 mt-2 text-stone-400">
        {entry.ipa && <span className="font-mono">/{entry.ipa}/</span>}
        {entry.pos[0] && <span>{entry.pos[0]}</span>}
      </div>

      <div className="mt-6 space-y-5">
        {primary.map((s, i) => (
          <div key={i} className={s.register === "offensive-slur" ? "rounded-2xl bg-rose-50 p-4" : ""}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl font-semibold text-stone-800">{s.translations.join(", ")}</span>
              <RegisterTag r={s.register} severity={s.severity} />
            </div>
            {s.register === "offensive-slur" && <p className="text-rose-800 mt-2 font-medium">Offensive slur. Shown so you can recognise it, never to use.</p>}
            {s.note && <p className="text-stone-500 mt-1.5">{s.note}</p>}
            {s.regions && <p className="text-sm text-teal-700 mt-1">Used in: {s.regions.join(", ")}</p>}
            {s.examples?.map((ex, j) => (
              <div key={j} className="mt-3 flex items-center gap-3 rounded-2xl bg-stone-50 px-4 py-3">
                <AudioButton text={ex.af} size="sm" />
                <div>
                  <div lang="af" className="font-medium">{ex.af}</div>
                  <div className="text-sm text-stone-500">{ex.en}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
        {extra.length > 0 && (
          <div className="text-stone-500">
            <span className="text-sm font-medium text-stone-400">Also: </span>
            {extra.flatMap((s) => s.translations).slice(0, 10).join(", ")}
          </div>
        )}
      </div>

      {full && entry.forms && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(entry.forms).map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-stone-50 px-4 py-2.5">
              <div className="text-xs text-stone-400">{FORM_LABEL[k] ?? k}</div>
              <div className="font-semibold" lang="af">{v}</div>
            </div>
          ))}
        </div>
      )}
      {hidden > 0 && full && <p className="text-sm text-stone-400 mt-4">{hidden} mature meaning{hidden > 1 ? "s" : ""} hidden. Change this in Settings.</p>}

      {full && (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {inDeck ? (
              <button onClick={() => removeCard(entry.id)} className="rounded-2xl px-5 py-3 bg-emerald-50 text-emerald-800 font-semibold">✓ In your review deck</button>
            ) : (
              <button onClick={() => addCard(entry.id)} className="rounded-2xl px-5 py-3 bg-emerald-600 text-white font-semibold hover:bg-emerald-700">+ Add to review deck</button>
            )}
            <Recorder />
          </div>
          <div className="mt-8 pt-5 border-t border-stone-100 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <ConfidenceBadge c={entry.verification.confidence} />
            <details className="text-stone-400">
              <summary className="cursor-pointer hover:text-stone-600">Sources</summary>
              <p className="mt-1">{entry.verification.sources.join(", ")}{entry.frequencyRank ? ` · common word #${entry.frequencyRank}` : ""}</p>
            </details>
            <a href={reportUrl(entry.headword, `Dictionary entry: **${entry.headword}** (id \`${entry.id}\`)\nConfidence: ${entry.verification.confidence}`)} target="_blank" rel="noreferrer" className="text-stone-400 hover:text-stone-600">Report a mistake</a>
          </div>
        </>
      )}
    </div>
  );
}
