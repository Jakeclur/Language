// Downloads the open-licensed source data used to build the dictionary.
// Every source is listed in data/sources/SOURCES.md with its licence.
// Usage: npm run import
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = join(root, "data", "sources");

export const SOURCES = [
  {
    file: "freedict-afr-eng.tei",
    url: "https://raw.githubusercontent.com/freedict/fd-dictionaries/master/afr-eng/afr-eng.tei",
  },
  {
    file: "freedict-eng-afr.tei",
    url: "https://raw.githubusercontent.com/freedict/fd-dictionaries/master/eng-afr/eng-afr.tei",
  },
  {
    file: "frequency-af-opensubtitles.txt",
    url: "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2016/af/af_50k.txt",
  },
  {
    file: "hunspell-af_ZA.dic",
    url: "https://raw.githubusercontent.com/LibreOffice/dictionaries/master/af_ZA/af_ZA.dic",
  },
  {
    file: "hunspell-af_ZA.aff",
    url: "https://raw.githubusercontent.com/LibreOffice/dictionaries/master/af_ZA/af_ZA.aff",
  },
  {
    file: "apertium-eng-afr.dix",
    url: "https://raw.githubusercontent.com/apertium/apertium-eng-afr/master/apertium-eng-afr.eng-afr.dix",
  },
  {
    file: "nwu-afr-pronundict.txt",
    url: "https://raw.githubusercontent.com/NWU-MuST/za_lex/master/data/afr/pronundict.txt",
  },
  {
    file: "nwu-afr-phonememap.tsv",
    url: "https://raw.githubusercontent.com/NWU-MuST/za_lex/master/data/afr/phonememap.ipa-hts.tsv",
  },
  {
    file: "nwu-afr-COPYRIGHT.txt",
    url: "https://raw.githubusercontent.com/NWU-MuST/za_lex/master/data/afr/COPYRIGHT",
  },
  {
    // Wiktionary extract (CC BY-SA). Large; blocked in some build environments, so optional.
    file: "kaikki-afrikaans.jsonl",
    url: "https://kaikki.org/dictionary/Afrikaans/kaikki.org-dictionary-Afrikaans.jsonl",
    optional: true,
  },
];

await mkdir(out, { recursive: true });
for (const s of SOURCES) {
  process.stdout.write(`Fetching ${s.file} ... `);
  let res;
  try {
    res = await fetch(s.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    if (s.optional) {
      console.log(`skipped (optional source unavailable: ${err.message})`);
      continue;
    }
    throw new Error(`${s.url} -> ${err.message}`);
  }
  const text = await res.text();
  await mkdir(dirname(join(out, s.file)), { recursive: true });
  await writeFile(join(out, s.file), text);
  console.log(`${(text.length / 1024).toFixed(0)} KB`);
}
console.log("Done. Now run: npm run content");
