import { Fragment, type ReactNode } from "react";

// Tiny, safe markdown: **bold**, *italic*, tables, and paragraphs. No HTML injection.
function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = key;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<strong key={i++} className="font-semibold text-emerald-900">{m[1]}</strong>);
    else out.push(<em key={i++}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Inline({ text }: { text: string }) {
  return <>{inline(text)}</>;
}

export function Md({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.split("\n");
  if (lines.length > 1 && lines.every((l) => l.trim().startsWith("|"))) {
    const rows = lines.filter((l) => !/^\|\s*-/.test(l)).map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
    const [head, ...body] = rows;
    return (
      <div className={`overflow-x-auto ${className}`}>
        <table className="min-w-full text-sm border border-stone-200 rounded-lg overflow-hidden">
          <thead className="bg-emerald-50">
            <tr>{head.map((c, i) => <th key={i} className="px-3 py-2 text-left font-semibold">{inline(c)}</th>)}</tr>
          </thead>
          <tbody>
            {body.map((r, i) => (
              <tr key={i} className="border-t border-stone-200">
                {r.map((c, j) => <td key={j} className="px-3 py-2">{inline(c)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <p className={className}>
      {lines.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {inline(l, i * 100)}
        </Fragment>
      ))}
    </p>
  );
}
