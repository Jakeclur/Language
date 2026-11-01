// Writes the list of texts that need audio (with the file name each clip should get) for the
// free, keyless MMS-TTS generator (pipeline/audio/mms_tts.py).
//   node pipeline/audio/export-texts.mjs [--max-dictionary 2500] > list.json
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { audioKey, collectTexts, fileId } from "./lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const maxDictionary = Number(args.includes("--max-dictionary") ? args[args.indexOf("--max-dictionary") + 1] : 2500);
let dict = 0;
const items = collectTexts(root)
  .filter((i) => i.scope !== "dictionary" || ++dict <= maxDictionary)
  .map((i) => ({ text: i.text, key: audioKey(i.text), file: `mms/${fileId(i.text)}.mp3`, kind: i.kind, scope: i.scope }));
const out = join(root, "pipeline", ".cache", "audio-texts.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(items));
console.log(`${items.length} texts -> ${out}`);
