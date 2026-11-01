import { useMemo, useState } from "react";
import { useData } from "../lib/dataContext";
import { useStore } from "../lib/store";
import { lookup } from "../lib/data";
import { visibleSenses } from "../lib/register";
import type { Entry, Register } from "../types";
import { Card, ConfidenceBadge, PageTitle, Pill, RegisterTag } from "../components/ui";
import { WordCard } from "./WordCard";

const REGISTERS: (Register | "")[] = ["", "formal", "neutral", "informal", "slang", "rude", "vulgar", "offensive-slur", "dated"];
let lastQuery = "";

function Row({ e }: { e: Entry }) {
  const { settings } = useStore();
  const senses = visibleSenses(e, settings);
  if (!senses.length) return null;
  const s = senses[0];
  return (
    <a href={`#word-${e.id}`} className="block px-4 py-3 hover:bg-emerald-50 border-b border-stone-100 last:border-0">
      <div className="flex items-center gap-2 flex-wrap">
        <b className="text-lg" lang="af">{e.headword}</b>
        {e.pos[0] && <span className="text-xs text-stone-500">{e.pos[0]}</span>}
        <RegisterTag r={s.register} severity={s.register === "offensive-slur" ? undefined : s.severity} />
        {e.cefr && <Pill className="bg-amber-100 text-amber-800">{e.cefr}</Pill>}
        <span className="ml-auto"><ConfidenceBadge c={e.verification.confidence} compact /></span>
      </div>
      <div className="text-stone-600 text-sm truncate">{senses.flatMap((x) => x.translations).slice(0, 6).join("; ")}</div>
    </a>
  );
}

export function DictionaryPage() {
  const data = useData();
  const { settings } = useStore();
  const [q, setQ] = useState(lastQuery);
  const [register, setRegister] = useState<Register | "">("");
  const [level, setLevel] = useState("");
  const [topic, setTopic] = useState("");
  lastQuery = q;
  const topics = useMemo(() => [...new Set(data.dictionary.entries.flatMap((e) => e.topics))].sort(), [data]);
  const res = useMemo(() => lookup(data, q, 80), [data, q]);
  const filter = (e: Entry) =>
    (!register || visibleSenses(e, settings).some((s) => s.register === register)) && (!level || e.cefr === level) && (!topic || e.topics.includes(topic));
  const browse = useMemo(
    () => (!q && (register || level || topic) ? data.dictionary.entries.filter(filter).slice(0, 200) : []),
    [q, register, level, topic, settings], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const total = data.dictionary.entries.length;
  return (
    <div>
      <PageTitle sub={`${total.toLocaleString()} headwords, plus every plural, past tense and compound worked out automatically. Search in Afrikaans or English.`}>Woordeboek · Dictionary</PageTitle>
      <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus placeholder="Search: lekker, house, geëet, kombuistafel…" className="w-full rounded-2xl border-2 border-stone-300 focus:border-emerald-600 outline-none px-4 py-3 text-lg bg-white" aria-label="Search the dictionary" />
      <div className="flex gap-2 flex-wrap mt-3 text-sm">
        <select value={register} onChange={(e) => setRegister(e.target.value as Register)} className="rounded-lg border border-stone-300 px-2 py-1.5 bg-white" aria-label="Register">
          {REGISTERS.filter((r) => r === "" || !["rude", "vulgar"].includes(r) || settings.showStreet).filter((r) => r !== "offensive-slur" || settings.showSlurs).map((r) => <option key={r} value={r}>{r || "All registers"}</option>)}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="rounded-lg border border-stone-300 px-2 py-1.5 bg-white" aria-label="Level">
          <option value="">All levels</option>
          {["A1", "A2", "B1", "B2", "C1"].map((l) => <option key={l}>{l}</option>)}
        </select>
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-lg border border-stone-300 px-2 py-1.5 bg-white" aria-label="Topic">
          <option value="">All topics</option>
          {topics.filter((t) => settings.showStreet || !["swearing", "insults", "slurs"].includes(t)).map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {res.exact && filter(res.exact) && visibleSenses(res.exact, settings).length > 0 && (
        <Card className="p-5 mt-4"><WordCard entry={res.exact} full /></Card>
      )}
      {res.baseForms.length > 0 && (
        <Card className="mt-4 overflow-hidden">
          <div className="px-4 pt-3 text-sm font-semibold text-emerald-800">“{q}” is a form of…</div>
          {res.baseForms.map(({ entry }) => <Row key={entry.id} e={entry} />)}
        </Card>
      )}
      {res.compound && (
        <Card className="p-4 mt-4">
          <div className="text-sm font-semibold text-emerald-800 mb-2">Compound word: “{q}” = {res.compound.map((c) => c.headword).join(" + ")}</div>
          <div className="text-lg">≈ {res.compound.map((c) => visibleSenses(c, settings)[0]?.translations[0] ?? c.senses[0].translations[0]).join(" + ")}</div>
          <div className="flex gap-2 mt-2 flex-wrap">{res.compound.map((c) => <a key={c.id} href={`#word-${c.id}`} className="underline text-emerald-800">{c.headword}</a>)}</div>
          <p className="text-xs text-stone-500 mt-2">Afrikaans writes compounds as one word. The meaning is usually the parts combined, but check the context.</p>
        </Card>
      )}
      {(q ? res.results.filter(filter) : browse).length > 0 && (
        <Card className="mt-4 overflow-hidden">
          {(q ? res.results.filter(filter) : browse).map((e) => <Row key={e.id} e={e} />)}
        </Card>
      )}
      {q && !res.exact && !res.baseForms.length && !res.compound && !res.results.length && (
        <Card className="p-5 mt-4 text-stone-600">No match for “{q}”. Try another spelling, or the English word.</Card>
      )}
      {!q && !browse.length && (
        <div className="mt-6 grid sm:grid-cols-3 gap-3">
          {["lekker", "kuier", "braai", "ja-nee", "geëet", "kombuistafel"].map((w) => (
            <button key={w} onClick={() => setQ(w)} className="rounded-xl bg-white border border-stone-200 px-4 py-3 text-left hover:border-emerald-500"><b lang="af">{w}</b></button>
          ))}
        </div>
      )}
    </div>
  );
}

export function WordPage({ id }: { id: string }) {
  const data = useData();
  const e = data.byId.get(id);
  return (
    <div className="max-w-2xl mx-auto">
      <a href="#dictionary" className="text-emerald-800 font-medium">← Dictionary</a>
      <Card className="p-6 mt-3">{e ? <WordCard entry={e} full /> : "Word not found."}</Card>
    </div>
  );
}
