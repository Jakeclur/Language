// Builds all app content from the source data + curated content, running the
// verification pipeline (PLAN.md §5) on everything.
//
//   npm run content            build, print a summary
//   npm run verify             build and FAIL on any error (used in CI)
//
// Outputs (public/data/):
//   dictionary.json   all dictionary entries with confidence badges
//   course.json       units, lessons and exercises
//   extras.json       phrasebook + pronunciation guide
//   report.json       verification report (summary + every issue)
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseTei } from "./lib/tei.mjs";
import { parseDix } from "./lib/apertium.mjs";
import { parsePronunciations } from "./lib/pronunciation.mjs";
import { expandHunspell } from "./lib/hunspell.mjs";
import { checkGrammar, unknownWords, tokenize } from "./lib/grammar.mjs";
import { glossesAgree, slugify } from "./lib/text.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");
const read = (p) => readFileSync(join(root, p), "utf8");
const issues = [];
const issue = (level, area, where, message) => issues.push({ level, area, where, message });

// ---------------------------------------------------------------- sources
const SOURCE_INFO = {
  editorial: { name: "Leer Afrikaans editorial (AI-drafted, machine-verified)", licence: "CC BY-SA 4.0", group: "editorial" },
  "freedict-afr-eng": { name: "FreeDict Afrikaans–English", licence: "GPL-2.0-or-later", group: "freedict", url: "https://freedict.org/" },
  "freedict-eng-afr": { name: "FreeDict English–Afrikaans", licence: "GPL-2.0-or-later", group: "freedict", url: "https://freedict.org/" },
  opensubtitles: { name: "FrequencyWords (OpenSubtitles 2016)", licence: "CC BY-SA 4.0", group: "corpus", url: "https://github.com/hermitdave/FrequencyWords" },
  apertium: { name: "Apertium English–Afrikaans", licence: "GPL-2.0", group: "apertium", url: "https://github.com/apertium/apertium-eng-afr" },
  nwu: { name: "NWU/CTexT Afrikaans Pronunciation Dictionary (za_lex)", licence: "CC BY-SA 2.5 ZA", group: "pronunciation", url: "https://github.com/NWU-MuST/za_lex" },
  wiktionary: { name: "Wiktionary (via kaikki.org)", licence: "CC BY-SA 4.0", group: "wiktionary", url: "https://kaikki.org/dictionary/Afrikaans/" },
  hunspell: { name: "LibreOffice Afrikaans spellchecker", licence: "LGPL-2.1-or-later", group: "spell", url: "https://github.com/LibreOffice/dictionaries" },
};

console.log("Loading spellchecker…");
const spell = expandHunspell(read("data/sources/hunspell-af_ZA.dic"), read("data/sources/hunspell-af_ZA.aff"));

console.log("Loading frequency list…");
const freq = new Map();
read("data/sources/frequency-af-opensubtitles.txt")
  .split(/\r?\n/)
  .forEach((line, i) => {
    const [w] = line.split(" ");
    if (w && !freq.has(w)) freq.set(w.toLowerCase(), i + 1);
  });

// ------------------------------------------------------- dictionary merge
/** key: lower-case headword -> entry */
const entries = new Map();
const keyOf = (h) => h.toLowerCase().trim();

function getEntry(headword) {
  const k = keyOf(headword);
  if (!entries.has(k))
    entries.set(k, { headword, pos: [], senses: [], forms: {}, topics: new Set(), cefr: null, sources: new Set(), freedictGlosses: new Set(), apertiumGlosses: new Set() });
  return entries.get(k);
}

console.log("Importing FreeDict…");
for (const e of parseTei(read("data/sources/freedict-afr-eng.tei"))) {
  if (!e.headword || /\s{2,}/.test(e.headword)) continue;
  const entry = getEntry(e.headword);
  entry.sources.add("freedict-afr-eng");
  for (const s of e.senses) s.forEach((g) => entry.freedictGlosses.add(g));
}
for (const e of parseTei(read("data/sources/freedict-eng-afr.tei"))) {
  for (const s of e.senses)
    for (const af of s) {
      if (!af || af.length > 60) continue;
      const entry = getEntry(af);
      entry.sources.add("freedict-eng-afr");
      entry.freedictGlosses.add(e.headword);
    }
}

console.log("Importing Apertium…");
for (const { en, af, pos } of parseDix(read("data/sources/apertium-eng-afr.dix"))) {
  if (af.length > 60) continue;
  const entry = getEntry(af);
  entry.sources.add("apertium");
  entry.apertiumGlosses.add(en);
  if (pos && !entry.pos.length) entry.apertiumPos = entry.apertiumPos ?? pos;
}

// Optional: Wiktionary (kaikki.org JSONL extract). Run `npm run import` with open internet to get it.
const WIKT_REGISTER = { vulgar: "vulgar", slang: "slang", informal: "informal", colloquial: "informal", offensive: "rude", derogatory: "rude", slur: "offensive-slur", ethnic: "offensive-slur", dated: "dated", archaic: "dated", obsolete: "dated", formal: "formal", literary: "literary" };
const POS_WIKT = { noun: "noun", verb: "verb", adj: "adj", adv: "adv", pron: "pron", prep: "prep", conj: "conj", intj: "interj", num: "num", det: "det", phrase: "phrase", proverb: "phrase" };
if (existsSync(join(root, "data/sources/kaikki-afrikaans.jsonl"))) {
  console.log("Importing Wiktionary (kaikki)…");
  for (const line of read("data/sources/kaikki-afrikaans.jsonl").split(/\r?\n/)) {
    if (!line.trim()) continue;
    let w;
    try {
      w = JSON.parse(line);
    } catch {
      continue;
    }
    if (!w.word || w.lang_code !== "af" || !POS_WIKT[w.pos]) continue;
    const entry = getEntry(w.word);
    entry.sources.add("wiktionary");
    if (!entry.pos.includes(POS_WIKT[w.pos])) entry.wiktPos = entry.wiktPos ?? POS_WIKT[w.pos];
    entry.wiktionaryGlosses = entry.wiktionaryGlosses ?? [];
    for (const sense of w.senses ?? []) {
      const tags = sense.tags ?? [];
      if (tags.includes("form-of") || !sense.glosses?.length) continue;
      const register = tags.map((t) => WIKT_REGISTER[t]).find(Boolean) ?? "neutral";
      entry.wiktionaryGlosses.push(...sense.glosses);
      entry.wiktionarySenses = entry.wiktionarySenses ?? [];
      entry.wiktionarySenses.push({ pos: POS_WIKT[w.pos], translations: sense.glosses.slice(0, 6), register, severity: register === "vulgar" ? 3 : register === "rude" ? 2 : register === "offensive-slur" ? 4 : 0, examples: [], source: "wiktionary" });
    }
    const ipa = w.sounds?.find((s) => s.ipa)?.ipa;
    if (ipa) entry.wiktIpa = ipa.replace(/^[/[]|[/\]]$/g, "");
  }
}

console.log("Loading pronunciations…");
const ipaOf = parsePronunciations(read("data/sources/nwu-afr-pronundict.txt"), read("data/sources/nwu-afr-phonememap.tsv"));

console.log("Loading curated vocabulary…");
const curatedDir = join(root, "content", "curated");
for (const file of readdirSync(curatedDir).filter((f) => f.endsWith(".txt"))) {
  read(`content/curated/${file}`)
    .split(/\r?\n/)
    .forEach((line, n) => {
      if (!line.trim() || line.startsWith("#")) return;
      const cols = line.split("|").map((c) => c.trim());
      if (cols.length < 3) return issue("error", "curated", `${file}:${n + 1}`, "Line has fewer than 3 fields");
      const [headword, pos, translations, register = "neutral", severity = "", cefr = "", topics = "", forms = "", exAf = "", exEn = "", note = ""] = cols;
      const entry = getEntry(headword);
      entry.headword = headword; // curated spelling/capitalisation wins
      entry.sources.add("editorial");
      if (pos && !entry.pos.includes(pos)) entry.pos.push(pos);
      if (cefr && (!entry.cefr || cefr < entry.cefr)) entry.cefr = cefr;
      topics.split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => entry.topics.add(t));
      for (const f of forms.split(";").filter(Boolean)) {
        const [k, v] = f.split("=").map((x) => x.trim());
        const map = { pl: "plural", dim: "diminutive", pp: "pastParticiple", cmp: "comparative", sup: "superlative", attr: "attributive", past: "past" };
        if (map[k] && v) entry.forms[map[k]] = v;
      }
      const regionMatch = /\[region:\s*([^\]]+)\]/.exec(note);
      const sense = {
        pos,
        translations: translations.split(";").map((t) => t.trim()).filter(Boolean),
        register: register || "neutral",
        severity: severity === "" ? 0 : Number(severity),
        regions: regionMatch ? regionMatch[1].split(",").map((r) => r.trim()) : undefined,
        note: note.replace(/\[region:[^\]]+\]/, "").trim() || undefined,
        examples: exAf ? [{ af: exAf, en: exEn }] : [],
        source: "editorial",
      };
      if (!["formal", "neutral", "informal", "slang", "rude", "vulgar", "offensive-slur", "dated", "literary"].includes(sense.register))
        issue("error", "curated", `${file}:${n + 1}`, `Unknown register "${sense.register}"`);
      if (Number.isNaN(sense.severity) || sense.severity < 0 || sense.severity > 4)
        issue("error", "curated", `${file}:${n + 1}`, `Severity must be 0–4`);
      // Same word listed in two curated files: merge into one sense instead of duplicating
      const twin = entry.senses.find(
        (x) => x.source === "editorial" && x.pos === sense.pos && x.register === sense.register && (x.severity ?? 0) === sense.severity &&
          x.translations.some((a) => sense.translations.some((b) => glossesAgree(a, b))),
      );
      if (twin) {
        for (const t of sense.translations) if (!twin.translations.includes(t)) twin.translations.push(t);
        twin.examples.push(...sense.examples);
        twin.note = twin.note ?? sense.note;
      } else entry.senses.push(sense);
    });
}

// ------------------------------------------------------- verification
console.log("Verifying dictionary…");
const counts = { verified: 0, checked: 0, unverified: 0 };
const dictionary = [];
const usedIds = new Set();
const headwordSet = new Set([...entries.keys()]);

for (const entry of entries.values()) {
  if (!entry.pos.length && (entry.wiktPos || entry.apertiumPos)) entry.pos.push(entry.wiktPos || entry.apertiumPos);
  // Wiktionary senses keep their own register labels; add those not already covered
  for (const ws of entry.wiktionarySenses ?? [])
    if (!entry.senses.some((s) => s.translations.some((t) => ws.translations.some((g) => glossesAgree(t, g))))) entry.senses.push(ws);
  // Translations from the imported dictionaries that the curated senses don't already cover
  const curatedGlosses = entry.senses.filter((s) => s.source === "editorial").flatMap((s) => s.translations);
  const allGlosses = entry.senses.flatMap((s) => s.translations);
  const imported = [...entry.apertiumGlosses, ...entry.freedictGlosses];
  const extra = [];
  for (const g of imported)
    if (![...allGlosses, ...extra].some((c) => glossesAgree(c, g) || c.toLowerCase() === g.toLowerCase())) extra.push(g);
  if (extra.length)
    entry.senses.push({
      pos: entry.pos[0],
      translations: extra.slice(0, 12),
      register: "neutral",
      severity: 0,
      examples: [],
      source: [entry.apertiumGlosses.size && "apertium", entry.freedictGlosses.size && "freedict"].filter(Boolean).join("+"),
    });
  if (!entry.senses.length) continue;

  // 1. multi-source agreement: how many INDEPENDENT groups give a matching translation
  const byGroup = {
    editorial: curatedGlosses,
    freedict: [...entry.freedictGlosses],
    apertium: [...entry.apertiumGlosses],
    wiktionary: entry.wiktionaryGlosses ?? [],
  };
  const groupNames = Object.keys(byGroup).filter((g) => byGroup[g].length);
  const agreeingGroups = groupNames.filter((g) =>
    groupNames.some((h) => h !== g && byGroup[g].some((a) => byGroup[h].some((b) => glossesAgree(a, b)))),
  );
  const agreeing = Math.max(1, agreeingGroups.length);

  // 2. existence: is the word confirmed by independent word lists?
  //    corpus = real subtitle text, lexicon = NWU pronunciation lexicon, spelling = LibreOffice spellchecker.
  //    Hyphenated words (nou-nou, ja-nee) count if every part is confirmed.
  const words = tokenize(entry.headword);
  const parts = words.flatMap((w) => w.split("-")).filter(Boolean);
  const variants = (w) => [w, w.replace(/'/g, "")];
  const inList = (list) => parts.length > 0 && parts.every((w) => variants(w).some((v) => list.has(v)));
  const rank = words.length === 1 ? freq.get(words[0]) : undefined;
  const corpus = inList(freq);
  const lexicon = inList(ipaOf);
  const spelled = inList(spell);
  const wordLists = [corpus, lexicon, spelled].filter(Boolean).length;
  const checks = [];
  if (agreeing >= 2) checks.push(`sources-agree:${agreeingGroups.join("+")}`);
  if (corpus) checks.push("corpus");
  if (lexicon) checks.push("lexicon");
  if (spelled) checks.push("spelling");

  // Verified: 2+ independent dictionaries agree on the meaning AND the word is found in real text
  //           or the lexicon AND it passes the spellchecker.
  // Checked:  2+ dictionaries agree, OR 1 dictionary + the word is confirmed by 2+ word lists.
  let confidence = "unverified";
  if (agreeing >= 2 && (corpus || lexicon) && spelled) confidence = "verified";
  else if (agreeing >= 2 || wordLists >= 2) confidence = "checked";
  counts[confidence]++;
  const informal = entry.senses.some((s) => ["slang", "rude", "vulgar", "offensive-slur", "informal"].includes(s.register));

  // 4. grammar + spelling of example sentences
  for (const s of entry.senses)
    for (const ex of s.examples) {
      for (const g of checkGrammar(ex.af)) issue(g.level, "grammar", `dictionary: ${entry.headword}`, `${g.message} — "${ex.af}"`);
      const unk = unknownWords(ex.af, spell, headwordSet);
      if (unk.length) issue("warning", "spelling", `dictionary: ${entry.headword}`, `Unknown word(s) ${unk.join(", ")} in "${ex.af}"`);
    }

  let id = slugify(entry.headword) || "x";
  if (usedIds.has(id)) {
    let i = 2;
    while (usedIds.has(`${id}-${i}`)) i++;
    id = `${id}-${i}`;
  }
  usedIds.add(id);

  // Form lookups that also pass spell-check
  for (const [k, v] of Object.entries(entry.forms))
    for (const w of tokenize(v))
      if (!spell.has(w) && !informal) issue("warning", "spelling", `dictionary: ${entry.headword}`, `Form ${k}="${v}" not in spellchecker`);

  dictionary.push({
    id,
    headword: entry.headword,
    pos: entry.pos,
    ipa: ipaOf.get(keyOf(entry.headword)) ?? entry.wiktIpa,
    forms: Object.keys(entry.forms).length ? entry.forms : undefined,
    senses: entry.senses.map((s) => ({
      ...s,
      severity: s.severity || undefined,
      examples: s.examples.length ? s.examples : undefined,
    })),
    cefr: entry.cefr ?? undefined,
    frequencyRank: rank,
    topics: [...entry.topics],
    verification: {
      sources: [...entry.sources, ...(corpus ? ["opensubtitles"] : []), ...(lexicon ? ["nwu"] : []), ...(spelled ? ["hunspell"] : [])],
      checks,
      confidence,
    },
  });
}
dictionary.sort((a, b) => (a.frequencyRank ?? 1e9) - (b.frequencyRank ?? 1e9) || a.headword.localeCompare(b.headword, "af"));
const byHeadword = new Map(dictionary.map((d) => [keyOf(d.headword), d]));

// ------------------------------------------------------- course
console.log("Building course…");
const courseDir = join(root, "content", "course");
const units = readdirSync(courseDir)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => ({ file: f, ...JSON.parse(read(`content/course/${f}`)) }));

const afSentencesOf = (ex) => {
  switch (ex.type) {
    case "translate":
      return ex.from === "en" ? ex.answers : [ex.prompt];
    case "order":
      return [ex.af];
    case "fill":
      return ex.answers.map((a) => ex.af.replace("___", a));
    case "transform":
      return [ex.from, ...ex.answers];
    case "rude":
    case "listen":
      return [ex.af];
    default:
      return [];
  }
};

let lessonCount = 0;
let exerciseCount = 0;
const lessonIds = new Set();
for (const unit of units) {
  for (const key of ["id", "level", "title", "lessons"]) if (!unit[key]) issue("error", "course", unit.file, `Unit is missing "${key}"`);
  for (const lesson of unit.lessons ?? []) {
    lessonCount++;
    const where = `${unit.id}/${lesson.id}`;
    if (lessonIds.has(lesson.id)) issue("error", "course", where, "Duplicate lesson id");
    lessonIds.add(lesson.id);
    // 8. consistency: vocabulary exists, is trustworthy, and respects content rules
    for (const v of lesson.vocab ?? []) {
      const d = byHeadword.get(keyOf(v));
      if (!d) {
        issue("error", "consistency", where, `Vocabulary "${v}" is not in the dictionary`);
        continue;
      }
      if (d.verification.confidence === "unverified")
        issue("error", "consistency", where, `Vocabulary "${v}" is unverified; course content may only use Verified/Checked words`);
      if (d.senses.some((s) => s.register === "offensive-slur")) issue("error", "consistency", where, `Slur "${v}" must never appear in the course`);
      const maxSev = Math.max(0, ...d.senses.map((s) => (s.register === "offensive-slur" ? 0 : s.severity ?? 0)));
      if (maxSev >= 2 && !unit.street && d.senses.every((s) => (s.severity ?? 0) >= 2))
        issue("error", "consistency", where, `Rude word "${v}" (severity ${maxSev}) only allowed in the 18+ Street Afrikaans module`);
    }
    const sentences = [...(lesson.examples ?? []).map((e) => e.af)];
    for (const ex of lesson.exercises ?? []) {
      exerciseCount++;
      if (ex.type === "translate" && !ex.answers?.length) issue("error", "consistency", where, `Translate exercise "${ex.prompt}" has no answers`);
      if (ex.type === "fill" && !ex.af.includes("___")) issue("error", "consistency", where, `Fill exercise "${ex.af}" has no ___ blank`);
      if (ex.type === "choice" && !ex.options.includes(ex.answer)) issue("error", "consistency", where, `Choice exercise "${ex.question}" answer is not an option`);
      sentences.push(...afSentencesOf(ex));
    }
    for (const s of sentences) {
      for (const g of checkGrammar(s)) issue(g.level, "grammar", where, `${g.message} — "${s}"`);
      const unk = unknownWords(s, spell, headwordSet);
      if (unk.length) issue("warning", "spelling", where, `Unknown word(s) ${unk.join(", ")} in "${s}"`);
      for (const w of tokenize(s)) {
        const d = byHeadword.get(w);
        if (d && d.senses.every((x) => x.register === "offensive-slur")) issue("error", "consistency", where, `Slur "${w}" used in an exercise`);
      }
    }
  }
}

// ------------------------------------------------------- extras
const extras = JSON.parse(read("content/extras.json"));
for (const group of extras.phrasebook)
  for (const p of group.phrases) {
    for (const g of checkGrammar(p.af)) issue(g.level, "grammar", `phrasebook: ${group.title}`, `${g.message} — "${p.af}"`);
    const unk = unknownWords(p.af, spell, headwordSet);
    if (unk.length) issue("warning", "spelling", `phrasebook: ${group.title}`, `Unknown word(s) ${unk.join(", ")} in "${p.af}"`);
  }

// ------------------------------------------------------- write
const outDir = join(root, "public", "data");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "dictionary.json"), JSON.stringify({ sources: SOURCE_INFO, entries: dictionary }));
writeFileSync(join(outDir, "course.json"), JSON.stringify({ units: units.map(({ file: _f, ...u }) => u) }));
writeFileSync(join(outDir, "extras.json"), JSON.stringify(extras));

const errors = issues.filter((i) => i.level === "error");
const warnings = issues.filter((i) => i.level === "warning");
const summary = {
  generatedAt: new Date().toISOString(),
  dictionary: { entries: dictionary.length, ...counts, spellcheckerWords: spell.size, frequencyWords: freq.size },
  course: { units: units.length, lessons: lessonCount, exercises: exerciseCount },
  issues: { errors: errors.length, warnings: warnings.length },
};
writeFileSync(join(outDir, "report.json"), JSON.stringify({ summary, issues }, null, 1));
if (!existsSync(join(root, "public", "audio", "manifest.json"))) {
  mkdirSync(join(root, "public", "audio"), { recursive: true });
  writeFileSync(join(root, "public", "audio", "manifest.json"), JSON.stringify({ voices: [], items: {} }));
}

console.log(JSON.stringify(summary, null, 2));
for (const e of errors) console.log(`ERROR  [${e.area}] ${e.where}: ${e.message}`);
if (process.argv.includes("--warnings")) for (const w of warnings) console.log(`warn   [${w.area}] ${w.where}: ${w.message}`);
if (strict && errors.length) {
  console.error(`\n${errors.length} verification error(s). Fix them before publishing.`);
  process.exit(1);
}
