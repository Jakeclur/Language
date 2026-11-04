// "Bokkie" the springbok: the app's friendly guide. ("bokkie" = little buck, and also "sweetheart")
type Mood = "happy" | "cheer" | "think" | "sad";

export function Mascot({ mood = "happy", size = 96, className = "" }: { mood?: Mood; size?: number; className?: string }) {
  const mouth = {
    happy: <path d="M50 70 q10 9 20 0" stroke="#3b2a1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />,
    cheer: <path d="M48 67 q12 16 24 0 z" fill="#3b2a1a" />,
    think: <path d="M53 72 h14" stroke="#3b2a1a" strokeWidth="3.5" strokeLinecap="round" />,
    sad: <path d="M51 75 q9 -7 18 0" stroke="#3b2a1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />,
  }[mood];
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true">
      {/* horns */}
      <path d="M44 30 C36 14 40 4 48 2 C44 12 46 20 52 28" fill="#5b4636" />
      <path d="M76 30 C84 14 80 4 72 2 C76 12 74 20 68 28" fill="#5b4636" />
      {/* ears */}
      <ellipse cx="26" cy="42" rx="15" ry="8" transform="rotate(-25 26 42)" fill="#d9925b" />
      <ellipse cx="94" cy="42" rx="15" ry="8" transform="rotate(25 94 42)" fill="#d9925b" />
      <ellipse cx="27" cy="42" rx="9" ry="4" transform="rotate(-25 27 42)" fill="#f7c9a5" />
      <ellipse cx="93" cy="42" rx="9" ry="4" transform="rotate(25 93 42)" fill="#f7c9a5" />
      {/* head */}
      <ellipse cx="60" cy="60" rx="34" ry="36" fill="#d9925b" />
      {/* white face stripe, like a springbok */}
      <path d="M60 30 C50 40 44 58 46 76 C48 92 72 92 74 76 C76 58 70 40 60 30 Z" fill="#fff7ee" />
      {/* cheeks */}
      <circle cx="38" cy="70" r="6" fill="#f2a07b" opacity=".7" />
      <circle cx="82" cy="70" r="6" fill="#f2a07b" opacity=".7" />
      {/* eyes */}
      {mood === "cheer" ? (
        <>
          <path d="M40 54 q6 -7 12 0" stroke="#3b2a1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M68 54 q6 -7 12 0" stroke="#3b2a1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="46" cy="55" r="5.5" fill="#3b2a1a" />
          <circle cx="74" cy="55" r="5.5" fill="#3b2a1a" />
          <circle cx="48" cy="53" r="1.8" fill="#fff" />
          <circle cx="76" cy="53" r="1.8" fill="#fff" />
        </>
      )}
      {/* nose */}
      <ellipse cx="60" cy="64" rx="5" ry="3.5" fill="#3b2a1a" />
      {mouth}
    </svg>
  );
}

/** Mascot with a speech bubble. */
export function Speech({ children, mood = "happy" }: { children: React.ReactNode; mood?: Mood }) {
  return (
    <div className="flex items-end gap-3">
      <Mascot mood={mood} size={64} className="shrink-0" />
      <div className="relative rounded-2xl border-2 border-stone-200 bg-white px-4 py-3 text-stone-700 font-semibold">
        <span className="absolute -left-2 bottom-4 w-3 h-3 bg-white border-l-2 border-b-2 border-stone-200 rotate-45" />
        {children}
      </div>
    </div>
  );
}
