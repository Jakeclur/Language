// Minimal parser for FreeDict TEI files (entry > form > orth, sense > cit > quote).
const decode = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/‐/g, "-") // FreeDict uses the Unicode hyphen
    .trim();

/** @returns {{ headword: string, senses: string[][] }[]} */
export function parseTei(xml) {
  const entries = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = entryRe.exec(xml))) {
    const body = m[1];
    const orth = /<orth>([\s\S]*?)<\/orth>/.exec(body);
    if (!orth) continue;
    const senses = [];
    const senseRe = /<sense[^>]*>([\s\S]*?)<\/sense>/g;
    let s;
    while ((s = senseRe.exec(body))) {
      const quotes = [...s[1].matchAll(/<quote>([\s\S]*?)<\/quote>/g)].map((q) => decode(q[1]));
      if (quotes.length) senses.push(quotes);
    }
    entries.push({ headword: decode(orth[1]), senses });
  }
  return entries;
}
