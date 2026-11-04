import { useEffect, useState } from "react";
import { loadData, type AppData } from "./lib/data";
import { DataCtx } from "./lib/dataContext";
import { StoreProvider, useStore } from "./lib/store";
import { useRoute } from "./lib/router";
import { Home } from "./features/Learn";
import { LessonPage } from "./features/Lesson";
import { Review } from "./features/Review";
import { DictionaryPage, WordPage } from "./features/Dictionary";
import { AboutPage, GrammarPage, MorePage, Onboarding, PhrasebookPage, ProgressPage, SettingsPage, SoundsPage } from "./features/Pages";
import { isDue } from "./lib/srs";

const TABS = [
  { route: "", label: "Learn", icon: LearnIcon, match: (r: string) => r === "" || r === "learn" },
  { route: "review", label: "Review", icon: ReviewIcon, match: (r: string) => r === "review" },
  { route: "dictionary", label: "Dictionary", icon: BookIcon, match: (r: string) => r === "dictionary" || r.startsWith("word-") },
  { route: "more", label: "More", icon: MoreIcon, match: (r: string) => ["more", "phrasebook", "grammar", "sounds", "progress", "settings", "about"].includes(r) },
];

function Page({ route }: { route: string }) {
  if (route.startsWith("word-")) return <WordPage id={route.slice(5)} />;
  switch (route) {
    case "review": return <Review />;
    case "dictionary": return <DictionaryPage />;
    case "more": return <MorePage />;
    case "phrasebook": return <PhrasebookPage />;
    case "grammar": return <GrammarPage />;
    case "sounds": return <SoundsPage />;
    case "progress": return <ProgressPage />;
    case "settings": return <SettingsPage />;
    case "about": return <AboutPage />;
    default: return <Home />;
  }
}

function Shell() {
  const route = useRoute();
  const { settings, progress } = useStore();
  const due = Object.values(progress.cards).filter((c) => isDue(c)).length;
  if (!settings.onboarded) return <Onboarding />;
  // Lessons are full-screen and distraction-free: no navigation bars.
  // key = route: moving to the next lesson starts a fresh lesson screen (fixes "Next lesson")
  if (route.startsWith("lesson-")) return <LessonPage key={route} id={route.slice(7)} />;
  return (
    <div className="min-h-screen pb-24 sm:pb-0">
      <header className="hidden sm:block bg-white/90 backdrop-blur sticky top-0 z-40 border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center">
          <a href="#" className="font-bold text-lg text-emerald-700 mr-auto">Leer Afrikaans</a>
          <nav className="flex gap-1" aria-label="Main">
            {TABS.map((t) => (
              <a key={t.label} href={`#${t.route}`} className={`relative px-4 py-2 rounded-xl font-medium ${t.match(route) ? "bg-emerald-50 text-emerald-700" : "text-stone-500 hover:text-stone-800"}`}>
                {t.label}
                {t.route === "review" && due > 0 && <span className="absolute -top-1 -right-1 bg-amber-400 text-stone-900 rounded-full min-w-5 h-5 px-1 text-xs font-bold flex items-center justify-center">{due}</span>}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-5 sm:px-6 py-6 sm:py-10">
        <Page route={route} />
      </main>
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-stone-100 grid grid-cols-4 z-40" aria-label="Main" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {TABS.map((t) => {
          const on = t.match(route);
          return (
            <a key={t.label} href={`#${t.route}`} className={`flex flex-col items-center gap-0.5 pt-2.5 pb-2 text-xs font-medium relative ${on ? "text-emerald-700" : "text-stone-400"}`}>
              <t.icon active={on} />
              {t.label}
              {t.route === "review" && due > 0 && <span className="absolute top-1.5 left-1/2 ml-2 bg-amber-400 text-stone-900 rounded-full min-w-4 h-4 px-1 text-[10px] font-bold flex items-center justify-center">{due}</span>}
            </a>
          );
        })}
      </nav>
    </div>
  );
}

type IconProps = { active: boolean };
const ic = (active: boolean) => `w-6 h-6 ${active ? "stroke-emerald-700" : "stroke-stone-400"}`;
function LearnIcon({ active }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={ic(active)}><path d="M3 10l9-6 9 6-9 6-9-6z" /><path d="M7 12.5V17c0 1 2.2 3 5 3s5-2 5-3v-4.5" /></svg>;
}
function ReviewIcon({ active }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={ic(active)}><path d="M4 12a8 8 0 0 1 13.7-5.6L20 9" /><path d="M20 4v5h-5" /><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15" /><path d="M4 20v-5h5" /></svg>;
}
function BookIcon({ active }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={ic(active)}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" /><path d="M4 19a2 2 0 0 1 2-2h13" /></svg>;
}
function MoreIcon({ active }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" className={ic(active)}><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>;
}

export default function App() {
  const [data, setData] = useState<AppData>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    loadData().then(setData).catch((e) => setError(String(e)));
  }, []);
  if (error) return <div className="p-8 text-center text-rose-700">Couldn't load the course. Check your connection and refresh.<div className="text-xs text-stone-400 mt-2">{error}</div></div>;
  if (!data)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
        <div className="text-stone-500">Laai…</div>
      </div>
    );
  return (
    <DataCtx.Provider value={data}>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </DataCtx.Provider>
  );
}
