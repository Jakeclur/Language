import { useEffect, useState } from "react";
import { loadData, type AppData } from "./lib/data";
import { DataCtx } from "./lib/dataContext";
import { StoreProvider, useStore } from "./lib/store";
import { useRoute } from "./lib/router";
import { Home, CourseMap } from "./features/Learn";
import { LessonPage } from "./features/Lesson";
import { Review } from "./features/Review";
import { DictionaryPage, WordPage } from "./features/Dictionary";
import { AboutPage, GrammarPage, Onboarding, PhrasebookPage, ProgressPage, SettingsPage, SoundsPage } from "./features/Pages";
import { isDue } from "./lib/srs";

const NAV = [
  { route: "", icon: "🏠", label: "Home" },
  { route: "learn", icon: "📘", label: "Course" },
  { route: "review", icon: "🔁", label: "Review" },
  { route: "dictionary", icon: "📖", label: "Dictionary" },
  { route: "phrasebook", icon: "💬", label: "Phrases" },
];
const MORE = [
  { route: "grammar", icon: "📐", label: "Grammar" },
  { route: "sounds", icon: "👄", label: "Sounds" },
  { route: "progress", icon: "📊", label: "Progress" },
  { route: "settings", icon: "⚙️", label: "Settings" },
  { route: "about", icon: "ℹ️", label: "About" },
];

function Page({ route }: { route: string }) {
  if (route.startsWith("lesson-")) return <LessonPage id={route.slice(7)} />;
  if (route.startsWith("word-")) return <WordPage id={route.slice(5)} />;
  switch (route) {
    case "learn": return <CourseMap />;
    case "review": return <Review />;
    case "dictionary": return <DictionaryPage />;
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
  const active = (r: string) => route === r || (r === "learn" && route.startsWith("lesson-")) || (r === "dictionary" && route.startsWith("word-"));
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="bg-emerald-800 text-amber-50 sticky top-0 z-40 shadow">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="#" className="font-bold text-lg flex items-center gap-2"><img src="./icon.svg" alt="" className="w-7 h-7" /> Leer Afrikaans</a>
          <nav className="hidden md:flex gap-1 ml-4 text-sm" aria-label="Main">
            {[...NAV, ...MORE].map((n) => (
              <a key={n.route} href={`#${n.route}`} className={`px-2.5 py-1.5 rounded-lg ${active(n.route) ? "bg-emerald-950/40" : "hover:bg-emerald-700"}`}>
                {n.label}{n.route === "review" && due > 0 && <span className="ml-1 bg-amber-400 text-emerald-950 rounded-full px-1.5 text-xs font-bold">{due}</span>}
              </a>
            ))}
          </nav>
          <a href="#settings" className="md:hidden ml-auto" aria-label="Settings">⚙️</a>
          <a href="#about" className="md:hidden" aria-label="About">ℹ️</a>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Page route={route} />
        <div className="md:hidden mt-8 grid grid-cols-3 gap-2 text-sm">
          {MORE.slice(0, 3).map((n) => <a key={n.route} href={`#${n.route}`} className="rounded-xl bg-white border border-stone-200 py-2 text-center">{n.icon} {n.label}</a>)}
        </div>
      </main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 grid grid-cols-5 z-40" aria-label="Main" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {NAV.map((n) => (
          <a key={n.route} href={`#${n.route}`} className={`flex flex-col items-center py-2 text-xs relative ${active(n.route) ? "text-emerald-800 font-semibold" : "text-stone-500"}`}>
            <span className="text-xl">{n.icon}</span>{n.label}
            {n.route === "review" && due > 0 && <span className="absolute top-1 right-4 bg-amber-400 text-emerald-950 rounded-full px-1.5 text-[10px] font-bold">{due}</span>}
          </a>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<AppData>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    loadData().then(setData).catch((e) => setError(String(e)));
  }, []);
  if (error) return <div className="p-8 text-center text-red-700">Couldn't load the course data. {error}</div>;
  if (!data)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-emerald-900">
        <div className="text-5xl animate-bounce">🇿🇦</div>
        <div className="font-semibold">Laai… (loading)</div>
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
