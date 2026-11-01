import type { ReactNode } from "react";
import type { Confidence, Register } from "../types";
import { REGISTER_LABEL, REGISTER_STYLE, SEVERITY_LABEL } from "../lib/register";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl shadow-sm border border-stone-200 ${className}`}>{children}</div>;
}

export function Button({
  children, onClick, variant = "primary", disabled, className = "", type = "button",
}: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger"; disabled?: boolean; className?: string; type?: "button" | "submit";
}) {
  const styles = {
    primary: "bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-stone-300",
    secondary: "bg-white text-emerald-800 border-2 border-emerald-700 hover:bg-emerald-50 disabled:opacity-50",
    ghost: "text-emerald-800 hover:bg-emerald-50 disabled:opacity-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`rounded-xl px-4 py-2.5 font-semibold transition ${styles} ${className}`}>
      {children}
    </button>
  );
}

const CONF: Record<Confidence, { icon: string; label: string; style: string; tip: string }> = {
  verified: { icon: "✅", label: "Verified", style: "bg-emerald-100 text-emerald-800", tip: "2+ independent dictionaries agree, the word appears in real text or the pronunciation lexicon, and it passes the spellchecker." },
  checked: { icon: "☑️", label: "Checked", style: "bg-sky-100 text-sky-800", tip: "2+ independent dictionaries agree, or one dictionary plus 2+ independent word lists confirm the word." },
  unverified: { icon: "⚠️", label: "Unverified", style: "bg-amber-100 text-amber-800", tip: "Only one source so far. Treat with care, and report mistakes." },
  community: { icon: "👥", label: "Community", style: "bg-violet-100 text-violet-800", tip: "Added or corrected by learners." },
};

export function ConfidenceBadge({ c, compact }: { c: Confidence; compact?: boolean }) {
  const x = CONF[c];
  return (
    <span title={x.tip} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${x.style}`}>
      {x.icon}
      {!compact && x.label}
    </span>
  );
}

export function RegisterTag({ r, severity }: { r: Register; severity?: number }) {
  if (r === "neutral" && !severity) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${REGISTER_STYLE[r]}`}>
      {REGISTER_LABEL[r]}
      {severity ? ` · ${severity}/4 ${SEVERITY_LABEL[severity]}` : ""}
    </span>
  );
}

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700 ${className}`}>{children}</span>;
}

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-2.5 rounded-full bg-stone-200 overflow-hidden ${className}`}>
      <div className="h-full bg-emerald-600 transition-all" style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }} />
    </div>
  );
}

export function Dialog({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl sm:text-3xl font-bold text-emerald-900">{children}</h1>
      {sub && <p className="text-stone-600 mt-1">{sub}</p>}
    </div>
  );
}
