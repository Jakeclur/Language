import type { ReactNode } from "react";

/** Fixed action area at the bottom of the lesson screen (Check / Continue). */
export function BottomBar({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "good" | "bad" }) {
  const bg = { plain: "bg-white border-t-2 border-stone-100", good: "bg-emerald-100", bad: "bg-rose-100" }[tone];
  return (
    <div className={`fixed bottom-0 inset-x-0 z-30 ${bg} ${tone !== "plain" ? "animate-slide-up" : ""}`} style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="max-w-2xl mx-auto px-5 py-4">{children}</div>
    </div>
  );
}

/** Big chunky button classes. Add a colour from `btnColor`. */
export const bigButton =
  "btn-3d w-full rounded-2xl py-4 text-lg font-extrabold uppercase tracking-wide disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none";

export const btnColor = {
  green: "bg-emerald-500 text-white shadow-[0_4px_0_#047857] hover:bg-emerald-400",
  red: "bg-rose-500 text-white shadow-[0_4px_0_#be123c] hover:bg-rose-400",
  grey: "bg-white text-stone-600 border-2 border-stone-200 shadow-[0_4px_0_#e7e5e4] hover:bg-stone-50",
};
