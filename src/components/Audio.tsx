import { useRef, useState } from "react";
import { useData } from "../lib/dataContext";
import { audioFor } from "../lib/audio";

/** Plays pre-generated natural audio. Never falls back to robotic browser TTS (PLAN.md §6). */
export function AudioButton({ text, size = "md" }: { text: string; size?: "sm" | "md" }) {
  const data = useData();
  const clips = audioFor(data.audio, text);
  const [i, setI] = useState(0);
  const [slow, setSlow] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const cls = size === "sm" ? "w-7 h-7 text-sm" : "w-10 h-10 text-lg";
  if (!clips.length)
    return (
      <span title="Natural human-sounding audio is coming soon" className={`${cls} inline-flex items-center justify-center rounded-full bg-stone-100 text-stone-400 cursor-help`} aria-label="Audio coming soon">
        🔈
      </span>
    );
  const play = () => {
    const clip = clips[i % clips.length];
    try {
      audio.current?.pause();
      const a = new Audio(slow ? clip.url.replace(/\.(\w+)$/, ".slow.$1") : clip.url);
      audio.current = a;
      a.play().catch(() => {});
    } catch {
      /* playback blocked */
    }
    setI(i + 1); // alternate voices each press
  };
  return (
    <span className="inline-flex items-center gap-1">
      <button onClick={play} className={`${cls} inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200`} aria-label={`Play: ${text}`}>
        🔊
      </button>
      {size === "md" && (
        <button onClick={() => setSlow(!slow)} className={`text-xs rounded-full px-2 py-1 ${slow ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-600"}`} aria-pressed={slow}>
          🐢 slow
        </button>
      )}
    </span>
  );
}

/** Shadowing: record yourself and play it back next to the model audio. */
export function Recorder() {
  const [state, setState] = useState<"idle" | "recording" | "done" | "unavailable">("idle");
  const [url, setUrl] = useState<string>();
  const rec = useRef<MediaRecorder | null>(null);
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        setUrl(URL.createObjectURL(new Blob(chunks, { type: r.mimeType })));
        stream.getTracks().forEach((t) => t.stop());
        setState("done");
      };
      r.start();
      rec.current = r;
      setState("recording");
    } catch {
      setState("unavailable");
    }
  };
  if (state === "unavailable") return <p className="text-sm text-stone-500">Microphone not available here. Try the installed app or another browser.</p>;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {state !== "recording" ? (
        <button onClick={start} className="rounded-full px-3 py-1.5 bg-rose-100 text-rose-800 text-sm font-medium hover:bg-rose-200">🎙️ Record yourself</button>
      ) : (
        <button onClick={() => rec.current?.stop()} className="rounded-full px-3 py-1.5 bg-rose-600 text-white text-sm font-medium animate-pulse">⏹ Stop</button>
      )}
      {url && <audio controls src={url} className="h-9" />}
    </div>
  );
}
