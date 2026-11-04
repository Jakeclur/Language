// Each unit gets its own colour, so the course path is easy to scan.
// Class names are written out in full so Tailwind includes them.
export interface UnitTheme { solid: string; soft: string; text: string; ring: string; shadow: string; border: string }

const THEMES: UnitTheme[] = [
  { solid: "bg-emerald-500", soft: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", shadow: "shadow-[0_6px_0_#047857]", border: "border-emerald-600" },
  { solid: "bg-sky-500", soft: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200", shadow: "shadow-[0_6px_0_#0369a1]", border: "border-sky-600" },
  { solid: "bg-violet-500", soft: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200", shadow: "shadow-[0_6px_0_#6d28d9]", border: "border-violet-600" },
  { solid: "bg-amber-500", soft: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", shadow: "shadow-[0_6px_0_#b45309]", border: "border-amber-600" },
  { solid: "bg-rose-500", soft: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200", shadow: "shadow-[0_6px_0_#be123c]", border: "border-rose-600" },
  { solid: "bg-teal-500", soft: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200", shadow: "shadow-[0_6px_0_#0f766e]", border: "border-teal-600" },
];

export const unitTheme = (n: number): UnitTheme => THEMES[(n - 1) % THEMES.length];

const PRAISE = ["Mooi so!", "Baie goed!", "Uitstekend!", "Reg so!", "Lekker!", "Knap gedoen!"];
export const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];
