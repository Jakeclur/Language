import { useEffect, useRef, useState } from "react";
import { useData } from "../lib/dataContext";
import { audioFor, playClip, speak, useDeviceVoices } from "../lib/audio";

// Words that can't be said naturally on their own are spoken in a short phrase instead.
// 'n (a/an) is taught in the same lesson as man and vrou.
const SPOKEN_AS: Record<string, string> = { "'n": "'n Man en 'n vrou." };

/** Hook: can this text be played, and how? Recorded clips first, then a natural device voice. */
export function useAudio(text: string) {
  const data = useData();
  const clips = audioFor(data.audio, text);
  const voices = useDeviceVoices();
  const [n, setN] = useState(0);
  const available = clips.length > 0 || voices.length > 0;
  const play = (slow = false) => {
    if (clips.length) {
      const c = clips[n % clips.length];
      playClip(slow ? c.url.replace(/\.(\w+)$/, ".slow.$1") : c.url);
    } else if (voices.length) speak(SPOKEN_AS[text.trim()] ?? text, voices[n % voices.length], slow);
    setN(n + 1); // alternate voices on each press
  };
  return { available, play };
}

/** Speaker button. Renders nothing when no natural audio exists, so there are no dead buttons.
 *  `autoPlay` speaks once when it appears (used for new words and listening prompts). */
export function AudioButton({ text, size = "md", slow = false, autoPlay = false }: { text: string; size?: "sm" | "md" | "lg"; slow?: boolean; autoPlay?: boolean }) {
  const { available, play } = useAudio(text);
  // remember WHICH text was auto-played, so the next word on the same screen plays too
  const played = useRef<string | null>(null);
  useEffect(() => {
    if (autoPlay && available && played.current !== text) {
      const t = setTimeout(() => {
        played.current = text;
        play();
      }, 250);
      return () => clearTimeout(t);
    }
  }, [autoPlay, available, text]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!available) return null;
  const cls = { sm: "w-8 h-8 text-base", md: "w-11 h-11 text-xl", lg: "w-14 h-14 text-2xl" }[size];
  return (
    <span className="inline-flex items-center gap-1.5 shrink-0">
      <button type="button" onClick={(e) => { e.stopPropagation(); play(); }} aria-label={`Listen: ${text}`}
        className={`${cls} inline-flex items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition`}>
        <SpeakerIcon />
      </button>
      {slow && (
        <button type="button" onClick={(e) => { e.stopPropagation(); play(true); }} aria-label={`Listen slowly: ${text}`}
          className="h-8 px-3 rounded-full bg-emerald-50 text-emerald-800 text-sm font-medium hover:bg-emerald-100">Slow</button>
      )}
    </span>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[55%] h-[55%]" fill="currentColor" aria-hidden="true">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}

/** Shadowing: record yourself and play it back. */
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
  if (state === "unavailable") return <p className="text-sm text-stone-500">Microphone isn't available in this browser.</p>;
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {state !== "recording" ? (
        <button onClick={start} className="rounded-full px-4 py-2 bg-stone-100 text-stone-800 text-sm font-medium hover:bg-stone-200">🎙️ Record yourself</button>
      ) : (
        <button onClick={() => rec.current?.stop()} className="rounded-full px-4 py-2 bg-rose-600 text-white text-sm font-medium animate-pulse">Stop recording</button>
      )}
      {url && <audio controls src={url} className="h-9" />}
    </div>
  );
}
