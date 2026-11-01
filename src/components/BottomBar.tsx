import type { ReactNode } from "react";

/** Fixed action area at the bottom of the lesson screen (Check / Continue). */
export function BottomBar({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "good" | "bad" }) {
  const bg = { plain: "bg-white border-t border-stone-100", good: "bg-emerald-50", bad: "bg-rose-50" }[tone];
  return (
    <div className={`fixed bottom-0 inset-x-0 z-30 ${bg} ${tone !== "plain" ? "animate-slide-up" : ""}`} style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="max-w-2xl mx-auto px-5 py-4">{children}</div>
    </div>
  );
}

export const bigButton =
  "w-full rounded-2xl py-4 text-lg font-bold transition active:scale-[0.99] disabled:bg-stone-200 disabled:text-stone-400";
