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


def find_model() -> str:
    """Find an Afrikaans MMS/VITS TTS model on Hugging Face (names have changed over time)."""
    from huggingface_hub import HfApi, model_info
    preferred = os.environ.get("TTS_MODEL") or "facebook/mms-tts-afr"
    try:
        model_info(preferred)
        return preferred
    except Exception as e:
        print(f"{preferred} not available ({type(e).__name__}); searching…", flush=True)
    api = HfApi()
    found = []
    for q in ("mms-tts-afr", "mms-tts afr", "afrikaans tts", "vits afrikaans", "tts-afr"):
        try:
            for m in api.list_models(search=q, limit=30):
                found.append(m.id)
        except Exception as e:
            print("search failed:", q, e)
    found = list(dict.fromkeys(found))
    print("Candidates:", found, flush=True)
    for mid in found:
        if "afr" in mid.lower() or "afrikaans" in mid.lower():
            try:
                VitsModel.from_pretrained(mid)
                return mid
            except Exception as e:
                print(f"  {mid}: not a usable VITS model ({type(e).__name__})")
    sys.exit("No usable Afrikaans VITS/MMS model found on Hugging Face.")


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
    rate = model.config.sampling_rate

    whisper = None
    if QA:
        from faster_whisper import WhisperModel
        print("Loading Whisper (small) for quality checks …", flush=True)
        whisper = WhisperModel("small", device="cpu", compute_type="int8")

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
                segs, _ = whisper.transcribe(path, language="af", beam_size=1, vad_filter=False, condition_on_previous_text=False)
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
    for f in failures[:40]:
        print("  ✗", f)
    if stats["passed"] == 0:
        sys.exit("No clips passed the quality check.")


if __name__ == "__main__":
    main()
