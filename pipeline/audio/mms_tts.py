"""Free, keyless neural Afrikaans audio with Meta's MMS-TTS model (facebook/mms-tts-afr).

Runs on GitHub Actions (see .github/workflows/audio.yml, mode "free"). For every text it makes a
normal and a slow clip, checks the normal clip with Whisper speech recognition, and adds only the
clips that pass to public/audio/manifest.json, so the app never plays a garbled recording.

Licence: the MMS-TTS model is CC BY-NC 4.0, so this audio may be used in a free, non-commercial app
with attribution. Switch to Azure/ElevenLabs (paid, commercial use allowed) before charging money.
"""
import io
import json
import os
import re
import subprocess
import sys
import time
import unicodedata

import numpy as np
import torch
from transformers import AutoTokenizer, VitsModel

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "audio")
LIST = os.path.join(ROOT, "pipeline", ".cache", "audio-texts.json")
MANIFEST = os.path.join(OUT, "manifest.json")
VOICE = {"id": "mms", "name": "Meta MMS Afrikaans (neural)", "engine": "mms-tts", "gender": "male"}
QA = os.environ.get("AUDIO_QA", "1") == "1"
LIMIT = int(os.environ.get("AUDIO_LIMIT", "0") or 0)

torch.manual_seed(1234)  # stable, repeatable voice


def clean_for_tts(text: str) -> str:
    t = text.replace("’", "'").replace("‘", "'")
    t = re.sub(r"\s*\([^)]*\)\s*", " ", t)
    return re.sub(r"\s+", " ", t).strip().lower()


def to_mp3(wave: np.ndarray, rate: int, path: str):
    pcm = (np.clip(wave, -1, 1) * 32767).astype("<i2").tobytes()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(rate), "-ac", "1", "-i", "pipe:0",
         "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-18:TP=-2,apad=pad_dur=0.08",
         "-codec:a", "libmp3lame", "-b:a", "40k", path],
        input=pcm, check=True)


def fold(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower().replace("’", "'"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z' ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def lev(a, b):
    prev = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        cur = [i]
        for j, y in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x != y)))
        prev = cur
    return prev[-1]


def similarity(expected: str, heard: str) -> float:
    a, b = fold(expected), fold(heard)
    if not a:
        return 1.0
    return 1 - lev(a, b) / max(len(a), len(b), 1)


AFRIKAANS = re.compile(r"(^|[-_/.])afr($|[-_.])|afrikaans", re.I)
# Licences that allow publishing in a free app (NC = non-commercial only, noted in the app credits)
OK_LICENCES = {"cc-by-4.0", "cc-by-sa-4.0", "mit", "apache-2.0", "cc0-1.0", "cc-by-nc-4.0", "cc-by-nc-sa-4.0", "openrail", "bsd-3-clause"}


def licence_of(mid: str) -> str:
    from huggingface_hub import model_info
    info = model_info(mid)
    lic = (getattr(info, "card_data", None) or {}).get("license") if getattr(info, "card_data", None) else None
    if not lic:
        lic = next((t.split(":", 1)[1] for t in (info.tags or []) if t.startswith("license:")), "unknown")
    return str(lic).lower()


def find_model() -> str:
    """Find an Afrikaans VITS/MMS TTS model on Hugging Face with a licence that allows publishing."""
    from huggingface_hub import HfApi
    if os.environ.get("TTS_MODEL"):
        return os.environ["TTS_MODEL"]
    api = HfApi()
    found = ["facebook/mms-tts-afr"]
    for q in ("mms-tts-afr", "tts-afr", "afrikaans tts", "vits afr", "afrikaans vits", "simba-tts"):
        try:
            found += [m.id for m in api.list_models(search=q, limit=50)]
        except Exception as e:
            print("search failed:", q, e)
    found = [m for m in dict.fromkeys(found) if AFRIKAANS.search(m)]
    print("Afrikaans candidates:", found, flush=True)
    for mid in found:
        try:
            lic = licence_of(mid)
        except Exception as e:
            print(f"  {mid}: unavailable ({type(e).__name__})")
            continue
        print(f"  {mid}: licence={lic}", flush=True)
        if lic not in OK_LICENCES:
            print("    skipped: licence unknown or not allowed for publishing")
            continue
        try:
            VitsModel.from_pretrained(mid)
            VOICE["licence"] = lic
            return mid
        except Exception as e:
            print(f"    not a usable VITS model ({type(e).__name__}: {str(e)[:120]})")
    sys.exit("No usable, properly licensed Afrikaans VITS model found on Hugging Face.")


def main():
    items = json.load(open(LIST))
    if LIMIT:
        items = items[:LIMIT]
    manifest = json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else {"voices": [], "items": {}}

    model_id = find_model()
    print(f"Loading {model_id} …", flush=True)
    tok = AutoTokenizer.from_pretrained(model_id)
    model = VitsModel.from_pretrained(model_id).eval()
    VOICE["source"] = model_id
    VOICE["name"] = f"{model_id.split('/')[-1]} (neural)"
    print("Licence:", VOICE.get("licence"), flush=True)
    rate = model.config.sampling_rate

    whisper = None
    if QA:
        from faster_whisper import WhisperModel
        print("Loading Whisper (small) for quality checks …", flush=True)
        qa_model = os.environ.get("QA_MODEL", "small")
        print(f"Quality-check model: whisper {qa_model}", flush=True)
        whisper = WhisperModel(qa_model, device="cpu", compute_type="int8")

    stats = {"made": 0, "skipped": 0, "passed": 0, "failed": 0, "errors": 0}
    failures = []
    t0 = time.time()
    for n, it in enumerate(items, 1):
        path = os.path.join(OUT, it["file"])
        slow_path = path.replace(".mp3", ".slow.mp3")
        try:
            if not (os.path.exists(path) and os.path.exists(slow_path)):
                inputs = tok(clean_for_tts(it["text"]), return_tensors="pt")
                if inputs["input_ids"].shape[-1] == 0:
                    raise ValueError("text has no speakable characters")
                for target, rate_factor in ((path, 1.0), (slow_path, 0.75)):
                    model.speaking_rate = rate_factor
                    with torch.no_grad():
                        wave = model(**inputs).waveform[0].numpy()
                    to_mp3(wave, rate, target)
                model.speaking_rate = 1.0
                stats["made"] += 1
            else:
                stats["skipped"] += 1

            ok, heard, score = True, None, None
            if whisper is not None:
                segs, _ = whisper.transcribe(path, language="af", beam_size=5, vad_filter=False, condition_on_previous_text=False)
                heard = " ".join(s.text for s in segs).strip()
                score = similarity(it["key"], heard)
                # single words get a looser threshold: recognisers often mishear isolated words
                ok = score >= (0.55 if " " not in it["key"] else 0.7)
            if ok:
                stats["passed"] += 1
                manifest["items"].setdefault(it["key"], {})["mms"] = it["file"]
            else:
                stats["failed"] += 1
                manifest["items"].get(it["key"], {}).pop("mms", None)
                failures.append({"text": it["text"], "heard": heard, "score": round(score, 2)})
        except Exception as e:  # keep going; report at the end
            stats["errors"] += 1
            failures.append({"text": it["text"], "error": str(e)})
        if n % 100 == 0:
            print(f"  {n}/{len(items)} {stats} ({time.time() - t0:.0f}s)", flush=True)

    manifest["items"] = {k: v for k, v in manifest["items"].items() if v}
    if not any(v["id"] == "mms" for v in manifest["voices"]):
        manifest["voices"].append(VOICE)
    json.dump(manifest, open(MANIFEST, "w"), ensure_ascii=False, indent=1)
    json.dump({"stats": stats, "failures": failures}, open(os.path.join(ROOT, "pipeline", ".cache", "mms-report.json"), "w"), ensure_ascii=False, indent=1)
    print("Done:", stats)
    passed_examples = [k for k, v in manifest["items"].items() if "mms" in v][:20]
    print("Passed examples:", passed_examples)
    for f in failures[:60]:
        print("  ✗", f)
    if stats["passed"] == 0:
        sys.exit("No clips passed the quality check.")


if __name__ == "__main__":
    main()
