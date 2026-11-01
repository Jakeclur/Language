// Generates natural, human-sounding audio for every word, sentence and phrase (PLAN.md §6).
// Audio is made once, stored as files, and listed in public/audio/manifest.json.
// The app NEVER falls back to robotic browser text-to-speech.
//
//   AZURE_SPEECH_KEY=… AZURE_SPEECH_REGION=southafricanorth \
//   ELEVENLABS_API_KEY=… ELEVENLABS_VOICE_FEMALE=… ELEVENLABS_VOICE_MALE=… \
//   npm run audio -- [--dry-run] [--limit 200] [--kinds word,sentence,expressive] [--bakeoff]
//
// Voice choice per item:
//   word        -> Azure Adri + Willem (consistent, exact pronunciation control)
//   sentence    -> Azure Adri + Willem
//   expressive  -> ElevenLabs (dialogues, phrasebook, slang), falling back to Azure if no ElevenLabs key
// Every clip gets a normal and a slow version, both made by the voice engine (not stretched).
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { audioKey, collectTexts, fileId, loadOverrides, VOICES } from "./lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : d);
const dryRun = flag("dry-run");
const limit = Number(opt("limit", "0")) || Infinity;
const kinds = opt("kinds", "word,sentence,expressive").split(",");
// Keep the repo and site small: course content gets two voices; dictionary-only words get one
// voice each (alternating female/male) and only the most common N words.
const maxDictionary = Number(opt("max-dictionary", "2500"));
const outDir = join(root, "public", "audio");
const manifestPath = join(outDir, "manifest.json");

const hasAzure = !!(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION);
const hasEleven = !!(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_FEMALE && process.env.ELEVENLABS_VOICE_MALE);
const overrides = loadOverrides(root);

const BAKEOFF = [
  "goed", "groot", "huis", "uit", "sê", "môre", "geëet", "'n Hond", "rooi", "seun", "kombuistafel",
  "Goeie môre, hoe gaan dit met jou?", "Ek praat nie Afrikaans nie.", "Vandag gaan ons strand toe.",
  "Waar is die naaste apteek?", "Ja-nee, dit is warm vandag.", "Foeitog, die arme hondjie!",
  "Ek is gatvol vir die reën.", "Jislaaik, dit was naby!", "Kom kuier Saterdag by ons!",
  "Hoekom het jy my nie gister gebel nie?", "Ek sou dit kon gedoen het as ek tyd gehad het.",
];

function voicesFor(item, index) {
  const pair = item.kind === "expressive" && hasEleven ? ["eleven-f", "eleven-m"] : hasAzure || dryRun ? ["azure-adri", "azure-willem"] : ["eleven-f", "eleven-m"];
  return item.scope === "dictionary" ? [pair[index % 2]] : pair;
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function ssml(text, voice, slow) {
  // Apply IPA overrides for words the engine says wrong (content/pronunciation-overrides.json)
  let body = esc(text);
  for (const [word, ipa] of Object.entries(overrides).filter(([k]) => !k.startsWith("_")))
    body = body.replace(new RegExp(`(^|[^\\p{L}])(${word})(?=[^\\p{L}]|$)`, "giu"), `$1<phoneme alphabet="ipa" ph="${ipa}">$2</phoneme>`);
  const rate = slow ? "-30%" : "0%";
  return `<speak version="1.0" xml:lang="af-ZA" xmlns="http://www.w3.org/2001/10/synthesis"><voice name="${voice}"><prosody rate="${rate}">${body}</prosody></voice></speak>`;
}

async function azure(text, voice, slow) {
  const res = await fetch(`https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "leer-afrikaans-audio",
    },
    body: ssml(text, voice, slow),
  });
  if (!res.ok) throw new Error(`Azure ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

async function elevenlabs(text, voiceId, slow) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL || "eleven_v3",
      language_code: "af",
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.3, speed: slow ? 0.75 : 1.0 },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

async function synth(voiceKey, text, slow) {
  const v = VOICES[voiceKey];
  return v.engine === "azure" ? azure(text, v.voice, slow) : elevenlabs(text, v.voice, slow);
}

async function main() {
  let items = flag("bakeoff") ? BAKEOFF.map((text) => ({ text, kind: "expressive", scope: "course" })) : collectTexts(root).filter((i) => kinds.includes(i.kind));
  let dictCount = 0;
  items = items.filter((i) => i.scope !== "dictionary" || ++dictCount <= maxDictionary).slice(0, limit);
  const manifest = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, "utf8")) : { voices: [], items: {} };

  const jobs = [];
  for (const [index, it] of items.entries()) {
    const voiceKeys = flag("bakeoff") ? Object.keys(VOICES).filter((k) => dryRun || (VOICES[k].engine === "azure" ? hasAzure : hasEleven)) : voicesFor(it, index);
    for (const vk of voiceKeys) {
      const file = `${vk}/${fileId(it.text)}.mp3`;
      if (existsSync(join(outDir, file))) continue;
      jobs.push({ ...it, vk, file });
    }
  }
  const chars = jobs.reduce((n, j) => n + j.text.length * 2, 0); // normal + slow
  console.log(`${items.length} texts, ${jobs.length} clips to generate (normal + slow), ~${chars.toLocaleString()} characters.`);
  const byKind = items.reduce((m, i) => ((m[`${i.scope}:${i.kind}`] = (m[`${i.scope}:${i.kind}`] ?? 0) + 1), m), {});
  console.log("By kind:", byKind);
  if (dryRun) return console.log("Dry run: nothing generated.");
  if (!hasAzure && !hasEleven) {
    console.error("\nNo voice engine configured. Set AZURE_SPEECH_KEY + AZURE_SPEECH_REGION and/or ELEVENLABS_API_KEY + ELEVENLABS_VOICE_FEMALE + ELEVENLABS_VOICE_MALE (see .env.example).");
    process.exit(1);
  }

  let done = 0;
  let failed = 0;
  const queue = [...jobs];
  const worker = async () => {
    while (queue.length) {
      const j = queue.shift();
      try {
        const [normal, slow] = [await synth(j.vk, j.text, false), await synth(j.vk, j.text, true)];
        if (normal.length < 1500) throw new Error("clip too small (silent?)");
        await mkdir(dirname(join(outDir, j.file)), { recursive: true });
        await writeFile(join(outDir, j.file), normal);
        await writeFile(join(outDir, j.file.replace(/\.mp3$/, ".slow.mp3")), slow);
        const k = audioKey(j.text);
        manifest.items[k] = { ...(manifest.items[k] ?? {}), [j.vk]: j.file };
        done++;
        if (done % 25 === 0) console.log(`  ${done}/${jobs.length}`);
      } catch (e) {
        failed++;
        console.warn(`  ✗ ${j.vk} "${j.text}": ${e.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  const used = new Set(Object.values(manifest.items).flatMap((v) => Object.keys(v)));
  manifest.voices = [...used].map((id) => ({ id, name: VOICES[id].name, engine: VOICES[id].engine, gender: VOICES[id].gender }));
  await writeFile(manifestPath, JSON.stringify(manifest, null, 1));
  console.log(`Generated ${done}, failed ${failed}. Now run: npm run audio:qa`);
  if (flag("bakeoff")) console.log("Bake-off clips are in public/audio/<voice>/. Listen blind and pick the most natural voices; run `npm run audio:qa` for accuracy scores.");
}

await main();
