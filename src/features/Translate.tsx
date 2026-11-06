import { useEffect, useMemo, useRef, useState } from "react";
import { useData } from "../lib/dataContext";
import { useStore } from "../lib/store";
import { translateOffline, translateOnline, type Lang } from "../lib/translate";
import { speak, useEnglishVoices } from "../lib/audio";
import { AudioButton } from "../components/Audio";
import { Card } from "../components/ui";
import { Mascot } from "../components/Mascot";

const LANG_NAME: Record<Lang, string> = { af: "Afrikaans", en: "English" };
const EXAMPLES: Record<Lang, string[]> = {
  af: ["Goeie môre, hoe gaan dit?", "Ek is baie honger.", "Waar is die badkamer?", "Die kos is lekker!"],
  en: ["Where is the bathroom?", "I don't understand.", "Thank you very much!", "The dog is big."],
};
let saved = { text: "", from: "af" as Lang };

/** Speak button that works for either language. */
function Speak({ text, lang }: { text: string; lang: Lang }) {
  const en = useEnglishVoices();
  if (!text.trim()) return null;
  if (lang === "af") return <AudioButton text={text} size="sm" />;
  if (!en.length) return null;
  return (
    <button type="button" onClick={() => speak(text, en[0])} aria-label={`Listen in English: ${text}`}
      className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-sky-500 text-white hover:bg-sky-600 active:scale-95 transition shrink-0">
      <svg viewBox="0 0 24 24" className="w-[55%] h-[55%]" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
    </button>
  );
}

export function TranslatePage() {
  const data = useData();
  const { settings, updateSettings } = useStore();
  const [from, setFrom] = useState<Lang>(saved.from);
  const [text, setText] = useState(saved.text);
  const [online, setOnline] = useState<{ text: string; for: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const to: Lang = from === "af" ? "en" : "af";
  saved = { text, from };

  const offline = useMemo(() => (text.trim() ? translateOffline(data, text, from) : null), [data, text, from]);

  // online translation, debounced, only when switched on
  const ctrl = useRef<AbortController | null>(null);
  useEffect(() => {
    setOnline(null);
    const q = text.trim();
    if (!q || !settings.onlineTranslate || offline?.memory) return;
    const t = setTimeout(async () => {
      ctrl.current?.abort();
      ctrl.current = new AbortController();
      setLoading(true);
      const r = await translateOnline(q, from, ctrl.current.signal);
      setLoading(false);
      if (r) setOnline({ text: r, for: `${from}:${q}` });
    }, 600);
    return () => clearTimeout(t);
  }, [text, from, settings.onlineTranslate, offline?.memory]);

  const onlineValid = online && online.for === `${from}:${text.trim()}` ? online.text : null;
  const main = offline?.memory ? offline.text : onlineValid ?? offline?.text ?? "";
  const source = offline?.memory ? "From the app's phrasebook and lessons" : onlineValid ? "Online translation (MyMemory)" : "Offline word-by-word (check the grammar)";

  const swap = () => {
    setFrom(to);
    setText(main && main !== text ? main : "");
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(main);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Mascot size={52} />
        <h1 className="text-3xl font-black tracking-tight text-stone-800">Translate</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 text-center rounded-2xl bg-white border-2 border-stone-100 py-2.5 font-extrabold text-stone-700">{LANG_NAME[from]}</div>
        <button onClick={swap} aria-label="Swap languages" className="btn-3d w-12 h-12 rounded-2xl bg-sky-500 text-white text-xl font-black shadow-[0_4px_0_#0369a1]">⇄</button>
        <div className="flex-1 text-center rounded-2xl bg-white border-2 border-stone-100 py-2.5 font-extrabold text-stone-700">{LANG_NAME[to]}</div>
      </div>

      <Card className="p-4">
        <label htmlFor="tr-input" className="sr-only">Text in {LANG_NAME[from]}</label>
        <textarea id="tr-input" value={text} onChange={(e) => setText(e.target.value)} rows={3} lang={from} maxLength={480}
          placeholder={from === "af" ? "Tik iets in Afrikaans…" : "Type something in English…"}
          className="w-full resize-none bg-transparent outline-none text-xl font-bold text-stone-800 placeholder:text-stone-300" />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <Speak text={text} lang={from} />
            {text && <button onClick={() => setText("")} className="text-sm font-bold text-stone-400 hover:text-stone-600 px-2 py-1">Clear</button>}
          </div>
          <span className="text-xs font-semibold text-stone-300">{text.length}/480</span>
        </div>
      </Card>

      {text.trim() ? (
        <Card className="p-4 border-sky-100 bg-sky-50/40">
          <div className="text-xs font-extrabold uppercase tracking-wider text-sky-600 mb-1">{LANG_NAME[to]}</div>
          <div className="text-xl font-black text-stone-800 whitespace-pre-wrap" lang={to} aria-live="polite">{main}</div>
          <div className="flex items-center justify-between mt-3 gap-2">
            <div className="flex items-center gap-2">
              <Speak text={main} lang={to} />
              <button onClick={copy} className="text-sm font-bold text-sky-700 hover:text-sky-900 px-2 py-1">{copied ? "Copied ✓" : "Copy"}</button>
            </div>
            <span className="text-xs font-semibold text-stone-400 text-right">{loading ? "Translating online…" : source}</span>
          </div>
          {onlineValid && offline && !offline.memory && offline.text.toLowerCase() !== onlineValid.toLowerCase() && (
            <div className="mt-3 pt-3 border-t border-sky-100 text-sm text-stone-500">
              <span className="font-extrabold">Word by word:</span> <span lang={to}>{offline.text}</span>
            </div>
          )}
        </Card>
      ) : (
        <div>
          <div className="text-sm font-extrabold uppercase tracking-wider text-stone-400 mb-2">Try</div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES[from].map((ex) => (
              <button key={ex} onClick={() => setText(ex)} lang={from} className="btn-3d rounded-2xl bg-white border-2 border-stone-200 shadow-[0_3px_0_#e7e5e4] px-3.5 py-2 font-bold text-stone-700">{ex}</button>
            ))}
          </div>
        </div>
      )}

      {offline && offline.words.length > 0 && (
        <section>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-stone-400 mb-2">Words</h2>
          <div className="flex flex-wrap gap-2">
            {offline.words.map((w, i) => {
              const af = from === "af" ? w.source : w.target;
              const en = from === "af" ? w.target : w.source;
              const inner = (
                <>
                  <span className="font-black text-stone-800" lang="af">{af}</span>
                  <span className="text-stone-500 font-semibold">{en}</span>
                </>
              );
              return (
                <span key={i} className={`inline-flex items-center gap-2 rounded-2xl border-2 pl-1.5 pr-3 py-1 ${w.known ? "bg-white border-stone-100" : "bg-stone-50 border-dashed border-stone-200"}`}>
                  {w.known ? <AudioButton text={af} size="sm" /> : <span className="w-2" />}
                  {w.entry ? <a href={`#word-${w.entry.id}`} className="flex flex-col leading-tight hover:underline">{inner}</a> : <span className="flex flex-col leading-tight">{inner}</span>}
                </span>
              );
            })}
          </div>
          <p className="text-xs font-semibold text-stone-400 mt-2">Tap a word to open it in the dictionary.</p>
        </section>
      )}

      <label className="flex items-start gap-3 rounded-2xl bg-white border-2 border-stone-100 p-4 cursor-pointer">
        <input type="checkbox" checked={settings.onlineTranslate} onChange={() => updateSettings({ onlineTranslate: !settings.onlineTranslate })} className="mt-1 w-5 h-5 accent-sky-500" />
        <span className="text-sm">
          <b className="font-extrabold text-stone-700">Online translation for full sentences</b>
          <span className="block text-stone-400 font-semibold">Sends what you type to the free MyMemory service (translated.net). Turn off to keep everything on your device; the offline translator still works.</span>
        </span>
      </label>
    </div>
  );
}
