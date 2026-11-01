import MiniSearch from "minisearch";
import type { DictionaryData, Entry, Extras, Unit } from "../types";
import { fold } from "./text";
import { lemmaCandidates, splitCompound } from "./morph";

export interface AudioManifest {
  voices: { id: string; name: string; engine: string; gender?: string }[];
  items: Record<string, Record<string, string>>; // normalised text -> voiceId -> file
}

export interface AppData {
  dictionary: DictionaryData;
  byId: Map<string, Entry>;
  byHeadword: Map<string, Entry>;
  formIndex: Map<string, Entry[]>;
  search: MiniSearch;
  units: Unit[];
  extras: Extras;
  audio: AudioManifest;
  report: { summary: Record<string, Record<string, number> | string>; issues: { level: string; area: string; where: string; message: string }[] };
}

async function getJson<T>(path: string, fallback?: T): Promise<T> {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (e) {
    if (fallback !== undefined) return fallback;
    throw e;
  }
}

export async function loadData(): Promise<AppData> {
  const [dictionary, course, extras, audio, report] = await Promise.all([
    getJson<DictionaryData>("./data/dictionary.json"),
    getJson<{ units: Unit[] }>("./data/course.json"),
    getJson<Extras>("./data/extras.json"),
    getJson<AudioManifest>("./audio/manifest.json", { voices: [], items: {} }),
    getJson<AppData["report"]>("./data/report.json", { summary: {}, issues: [] }),
  ]);
  const byId = new Map(dictionary.entries.map((e) => [e.id, e]));
  const byHeadword = new Map(dictionary.entries.map((e) => [e.headword.toLowerCase(), e]));
  const formIndex = new Map<string, Entry[]>();
  for (const e of dictionary.entries)
    for (const f of Object.values(e.forms ?? {})) {
      const k = (f as string).toLowerCase();
      formIndex.set(k, [...(formIndex.get(k) ?? []), e]);
    }

  const search = new MiniSearch<Entry & { folded: string; en: string }>({
    fields: ["headword", "folded", "en"],
    storeFields: [],
    idField: "id",
    processTerm: (t) => fold(t.toLowerCase()),
    searchOptions: { boost: { headword: 3, folded: 3, en: 1 }, prefix: true, fuzzy: 0.15 },
  });
  search.addAll(
    dictionary.entries.map((e) => ({ ...e, folded: fold(e.headword.toLowerCase()), en: e.senses.flatMap((s) => s.translations).join(" ") })),
  );
  return { dictionary, byId, byHeadword, formIndex, search, units: course.units.sort((a, b) => a.number - b.number), extras, audio, report };
}

export interface LookupResult {
  exact?: Entry;
  baseForms: { entry: Entry; via: string }[];
  compound?: Entry[];
  results: Entry[];
}

/** Dictionary lookup: exact headword, inflected form -> base, compound split, then full-text search. */
export function lookup(data: AppData, query: string, limit = 60): LookupResult {
  const q = query.trim().toLowerCase();
  if (!q) return { baseForms: [], results: [] };
  const exact = data.byHeadword.get(q) ?? data.dictionary.entries.find((e) => fold(e.headword.toLowerCase()) === fold(q));
  const baseForms: LookupResult["baseForms"] = [];
  const seen = new Set<string>(exact ? [exact.id] : []);
  for (const e of data.formIndex.get(q) ?? [])
    if (!seen.has(e.id)) {
      seen.add(e.id);
      baseForms.push({ entry: e, via: "form" });
    }
  if (!exact)
    for (const c of lemmaCandidates(q)) {
      const e = data.byHeadword.get(c);
      if (e && !seen.has(e.id)) {
        seen.add(e.id);
        baseForms.push({ entry: e, via: c });
      }
    }
  let compound: Entry[] | undefined;
  if (!exact && !baseForms.length && !q.includes(" ")) {
    const parts = splitCompound(q, (w) => data.byHeadword.has(w) && data.byHeadword.get(w)!.verification.confidence !== "unverified");
    if (parts) compound = parts.map((p) => data.byHeadword.get(p)!);
  }
  const results = data.search
    .search(q)
    .slice(0, limit)
    .map((r) => data.byId.get(r.id as string)!)
    .filter((e) => e && !seen.has(e.id));
  return { exact, baseForms, compound, results };
}
