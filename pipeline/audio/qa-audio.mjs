// Automatic audio quality check (PLAN.md §6.4): transcribe every clip with speech recognition and
// compare it with the intended text. Clips that fail are removed from the manifest (with --prune),
// so the app shows "audio coming soon" instead of playing bad audio.
//
//   OPENAI_API_KEY=… npm run audio:qa -- [--prune] [--max-wer 0.25]
//   (or install the open-source `whisper` CLI locally and run without a key)
import { readFile, writeFile, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { wer } from "./lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const prune = args.includes("--prune");
const maxWer = Number(args.includes("--max-wer") ? args[args.indexOf("--max-wer") + 1] : 0.25);
const outDir = join(root, "public", "audio");
const manifest = JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"));

async function transcribe(path) {
  if (process.env.OPENAI_API_KEY) {
    const form = new FormData();
    form.append("file", new Blob([await readFile(path)], { type: "audio/mpeg" }), "clip.mp3");
    form.append("model", process.env.OPENAI_STT_MODEL || "whisper-1");
    form.append("language", "af");
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form });
    if (!res.ok) throw new Error(`STT ${res.status}: ${await res.text()}`);
    return (await res.json()).text;
  }
  // local whisper CLI (pip install openai-whisper)
  const out = execFileSync("whisper", [path, "--language", "af", "--model", process.env.WHISPER_MODEL || "medium", "--output_format", "txt", "--output_dir", "/tmp/whisper-qa", "--fp16", "False"], { encoding: "utf8" });
  return out.replace(/\[[^\]]+\]/g, "").trim();
}

const results = [];
for (const [key, voices] of Object.entries(manifest.items)) {
  for (const [voice, file] of Object.entries(voices)) {
    const path = join(outDir, file);
    const r = { key, voice, file, checks: [] };
    try {
      const size = (await stat(path)).size;
      if (size < 1500) r.checks.push("too-small");
      const heard = await transcribe(path);
      r.heard = heard;
      r.wer = wer(key, heard);
      // single words get no slack beyond accent folding; sentences may have small recogniser errors
      const limit = key.includes(" ") ? maxWer : 0;
      if (r.wer > limit) r.checks.push(`wer ${r.wer.toFixed(2)} > ${limit}`);
    } catch (e) {
      r.checks.push(`error: ${e.message}`);
    }
    r.pass = r.checks.length === 0;
    results.push(r);
    if (!r.pass) console.log(`✗ [${voice}] "${key}" heard "${r.heard ?? "?"}" (${r.checks.join(", ")})`);
  }
}
const passed = results.filter((r) => r.pass).length;
console.log(`\n${passed}/${results.length} clips passed.`);
if (prune) {
  for (const r of results.filter((x) => !x.pass)) {
    delete manifest.items[r.key][r.voice];
    if (!Object.keys(manifest.items[r.key]).length) delete manifest.items[r.key];
  }
  await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 1));
  console.log("Failed clips removed from the manifest. Add IPA fixes to content/pronunciation-overrides.json, delete the bad files, and regenerate.");
}
await writeFile(join(outDir, "qa-report.json"), JSON.stringify({ checkedAt: new Date().toISOString(), passed, total: results.length, results }, null, 1));
