import { useMemo, useState } from "react";
import { useData } from "../lib/dataContext";
import { useStore } from "../lib/store";
import { lookup } from "../lib/data";
import { visibleSenses } from "../lib/register";
import type { Entry, Register } from "../types";
import { BackLink, Card, RegisterTag } from "../components/ui";
import { WordCard } from "./WordCard";

let lastQuery = "";

function Row({ e }: { e: Entry }) {
  const { settings } = useStore();
  const senses = visibleSenses(e, settings);
  if (!senses.length) return null;
  const s = senses[0];
  return (
    <a href={`#word-${e.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-stone-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <b className="text-lg" lang="af">{e.headword}</b>
          <RegisterTag r={s.register} severity={s.severity} />
        </div>
        <div className="text-stone-500 truncate">{senses.flatMap((x) => x.translations).slice(0, 4).join(", ")}</div>
      </div>
      <span className="text-stone-300 text-xl">›</span>
    </a>
  );
}

export function DictionaryPage() {
  const data = useData();
  const { settings } = useStore();
  const [q, setQ] = useState(lastQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [register, setRegister] = useState<Register | "">("");
  const [topic, setTopic] = useState("");
  lastQuery = q;
  const topics = useMemo(() => [...new Set(data.dictionary.entries.flatMap((e) => e.topics))].sort(), [data]);
  const res = useMemo(() => lookup(data, q, 60), [data, q]);
  const filter = (e: Entry) => (!register || visibleSenses(e, settings).some((s) => s.register === register)) && (!topic || e.topics.includes(topic));
  const browse = useMemo(
    () => (!q && (register || topic) ? data.dictionary.entries.filter(filter).slice(0, 150) : []),
    [q, register, topic, settings], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const list = q ? res.results.filter(filter) : browse;
  const registers: Register[] = ["formal", "informal", "slang", ...(settings.showStreet ? (["rude", "vulgar"] as Register[]) : []), "dated"];
  const nothing = q && !res.exact && !res.baseForms.length && !res.compound && !list.length;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-5">Dictionary</h1>
      <div className="relative">
        <svg viewBox="0 0 24 24" className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 stroke-stone-400" fill="none" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Afrikaans or English word" aria-label="Search the dictionary"
          className="w-full rounded-2xl bg-white shadow-sm pl-13 pr-24 py-4 text-lg outline-none focus:ring-2 focus:ring-emerald-400" />
        <button onClick={() => setShowFilters(!showFilters)} className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium rounded-xl px-3 py-1.5 ${register || topic ? "bg-emerald-50 text-emerald-700" : "text-stone-500 hover:bg-stone-100"}`}>
          Filters{register || topic ? " •" : ""}
        </button>
      </div>
      {showFilters && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {registers.map((r) => (
            <button key={r} onClick={() => setRegister(register === r ? "" : r)} className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${register === r ? "bg-emerald-600 text-white" : "bg-white shadow-sm text-stone-600"}`}>{r}</button>
          ))}
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-full px-3 py-1.5 text-sm bg-white shadow-sm text-stone-600" aria-label="Topic">
            <option value="">Any topic</option>
            {topics.filter((t) => settings.showStreet || !["swearing", "insults", "slurs"].includes(t)).map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {res.exact && filter(res.exact) && visibleSenses(res.exact, settings).length > 0 && (
          <Card className="p-6"><WordCard entry={res.exact} full /></Card>
        )}
        {res.baseForms.length > 0 && (
          <Card className="overflow-hidden">
            <div className="px-5 pt-4 text-sm text-stone-400">“{q}” is a form of</div>
            {res.baseForms.map(({ entry }) => <Row key={entry.id} e={entry} />)}
          </Card>
        )}
        {res.compound && (
          <Card className="p-5">
            <div className="text-sm text-stone-400">Compound word</div>
            <div className="text-2xl font-semibold mt-1"><span lang="af">{res.compound.map((c) => c.headword).join(" + ")}</span></div>
            <div className="text-lg text-stone-600 mt-1">≈ {res.compound.map((c) => visibleSenses(c, settings)[0]?.translations[0] ?? c.senses[0].translations[0]).join(" + ")}</div>
          </Card>
        )}
        {list.length > 0 && <Card className="overflow-hidden divide-y divide-stone-100">{list.map((e) => <Row key={e.id} e={e} />)}</Card>}
        {nothing && <p className="text-stone-500 text-center py-8">No match for “{q}”. Try another spelling or the English word.</p>}
        {!q && !browse.length && (
          <div className="pt-4">
            <div className="text-sm text-stone-400 mb-3">Try</div>
            <div className="flex flex-wrap gap-2">
              {["lekker", "kuier", "house", "ja-nee", "geëet", "kombuistafel"].map((w) => (
                <button key={w} onClick={() => setQ(w)} className="rounded-full bg-white shadow-sm px-4 py-2 font-medium hover:bg-emerald-50" lang="af">{w}</button>
              ))}
            </div>
            <p className="text-sm text-stone-400 mt-6">{data.dictionary.entries.length.toLocaleString()} words. Plurals, past tenses and compound words are worked out automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function WordPage({ id }: { id: string }) {
  const data = useData();
  const e = data.byId.get(id);
  return (
    <div>
      <BackLink href="#dictionary">Dictionary</BackLink>
      <Card className="p-6 sm:p-8">{e ? <WordCard entry={e} full /> : "Word not found."}</Card>
    </div>
  );
}
