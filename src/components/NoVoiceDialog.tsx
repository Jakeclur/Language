import { useEffect, useState } from "react";
import { NO_VOICE_EVENT } from "../lib/audio";
import { useStore } from "../lib/store";
import { Button, Dialog } from "./ui";
import { Mascot } from "./Mascot";

/** Shown when a speaker is tapped on a device without an Afrikaans voice. */
export function NoVoiceDialog() {
  const { updateSettings } = useStore();
  const [open, setOpen] = useState(false);
  const [dutch, setDutch] = useState(false);
  useEffect(() => {
    const on = (e: Event) => {
      setDutch(!!(e as CustomEvent).detail?.dutchAvailable);
      setOpen(true);
    };
    window.addEventListener(NO_VOICE_EVENT, on);
    return () => window.removeEventListener(NO_VOICE_EVENT, on);
  }, []);
  return (
    <Dialog open={open} title="No Afrikaans voice on this device" onClose={() => setOpen(false)}>
      <div className="flex justify-center mb-3"><Mascot mood="sad" size={80} /></div>
      <p className="text-stone-600 font-semibold">This browser doesn't include an Afrikaans voice, so it can't say the words yet.</p>
      <ul className="mt-3 space-y-2 text-stone-600 text-sm list-disc ml-5">
        <li><b>Best:</b> open this site in <b>Microsoft Edge</b> on a Windows or Mac computer. It has a natural Afrikaans voice.</li>
        <li><b>Android:</b> your phone's text-to-speech settings may offer an Afrikaans voice to download.</li>
        {dutch && <li><b>Or</b> use a <b>Dutch</b> voice. Afrikaans grew out of Dutch, so it sounds close, but some sounds are different.</li>}
      </ul>
      <div className="flex gap-3 mt-6">
        <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>OK</Button>
        {dutch && (
          <Button className="flex-1" onClick={() => { updateSettings({ dutchFallback: true }); setOpen(false); }}>Use Dutch voice</Button>
        )}
      </div>
    </Dialog>
  );
}
