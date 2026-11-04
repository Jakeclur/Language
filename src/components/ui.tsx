import type { ReactNode } from "react";
import type { Confidence, Register } from "../types";
import { REGISTER_LABEL, REGISTER_STYLE, SEVERITY_LABEL } from "../lib/register";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-3xl border-2 border-stone-100 ${className}`}>{children}</div>;
}

export function Button({
  children, onClick, variant = "primary", disabled, className = "", type = "button",
}: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger"; disabled?: boolean; className?: string; type?: "button" | "submit";
}) {
  const styles = {
    primary: "bg-emerald-500 text-white shadow-[0_4px_0_#047857] hover:bg-emerald-400 disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none",
    secondary: "bg-white text-stone-700 border-2 border-stone-200 shadow-[0_4px_0_#e7e5e4] hover:bg-stone-50 disabled:opacity-50",
    ghost: "text-emerald-700 hover:bg-emerald-50 disabled:opacity-50",
    danger: "bg-rose-500 text-white shadow-[0_4px_0_#be123c] hover:bg-rose-400",
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`btn-3d rounded-2xl px-5 py-3 font-extrabold ${styles} ${className}`}>
      {children}
    </button>
  );
}

const CONF: Record<Confidence, { label: string; style: string; tip: string }> = {
  verified: { label: "Verified", style: "text-emerald-700", tip: "Independent dictionaries agree, and the word is confirmed in real text and by the spellchecker." },
  checked: { label: "Checked", style: "text-sky-700", tip: "Confirmed by at least two independent sources." },
  unverified: { label: "Not yet verified", style: "text-amber-700", tip: "Only one source so far. Treat with care, and report mistakes." },
  community: { label: "Community", style: "text-violet-700", tip: "Added or corrected by learners." },
};

export function ConfidenceBadge({ c }: { c: Confidence }) {
  const x = CONF[c];
  return (
    <span title={x.tip} className={`inline-flex items-center gap-1 text-xs font-medium ${x.style}`}>
      {c === "unverified" ? "⚠" : "✓"} {x.label}
    </span>
  );
}

/** Register label, shown only when it tells the learner something (not for plain neutral words). */
export function RegisterTag({ r, severity }: { r: Register; severity?: number }) {
  if (r === "neutral" && !severity) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${REGISTER_STYLE[r]}`}>
      {REGISTER_LABEL[r]}
      {severity && r !== "offensive-slur" ? ` · ${SEVERITY_LABEL[severity]}` : ""}
    </span>
  );
}

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-4 rounded-full bg-stone-200 overflow-hidden ${className}`}>
      <div className="h-full rounded-full bg-emerald-500 transition-all duration-500 relative" style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }}>
        <div className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/35" />
      </div>
    </div>
  );
}

export function Dialog({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-black tracking-tight text-stone-800">{children}</h1>
      {sub && <p className="text-stone-500 mt-1">{sub}</p>}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-800 font-medium mb-4">‹ {children}</a>;
}
