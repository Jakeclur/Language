// Expands a Hunspell .dic/.aff pair into a Set of valid word forms (lower-case).
// Supports SFX/PFX with strip, append and conditions, and cross-products.
// Compound rules are not expanded; the app's compound splitter covers those.

function parseAff(aff) {
  const rules = new Map(); // flag -> { type, cross, entries: [{strip, add, cond: RegExp, contFlags}] }
  const lines = aff.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if ((parts[0] === "SFX" || parts[0] === "PFX") && parts.length === 4 && /^[YN]$/.test(parts[2])) {
      const [type, flag, cross, countStr] = parts;
      const count = Number(countStr);
      const entries = [];
      for (let j = 1; j <= count; j++) {
        const p = lines[i + j].trim().split(/\s+/);
        const strip = p[2] === "0" ? "" : p[2];
        let [add, contFlags = ""] = p[3].split("/");
        if (add === "0") add = "";
        const condSrc = p[4] && p[4] !== "." ? p[4] : ".";
        const cond = type === "SFX" ? new RegExp(`${condSrc}$`, "u") : new RegExp(`^${condSrc}`, "u");
        entries.push({ strip, add, cond, contFlags });
      }
      rules.set(flag, { type, cross: cross === "Y", entries });
      i += count;
    }
  }
  return rules;
}

function applyRule(word, rule) {
  const out = [];
  for (const e of rule.entries) {
    if (!e.cond.test(word)) continue;
    if (rule.type === "SFX") {
      if (e.strip && !word.endsWith(e.strip)) continue;
      out.push({ word: word.slice(0, word.length - e.strip.length) + e.add, contFlags: e.contFlags });
    } else {
      if (e.strip && !word.startsWith(e.strip)) continue;
      out.push({ word: e.add + word.slice(e.strip.length), contFlags: e.contFlags });
    }
  }
  return out;
}

/** @returns {Set<string>} */
export function expandHunspell(dic, aff) {
  const rules = parseAff(aff);
  const words = new Set();
  const lines = dic.split(/\r?\n/).slice(1);
  for (const line of lines) {
    if (!line) continue;
    const [stem, flags = ""] = line.split("/");
    const onlyInCompound = flags.includes("c");
    if (!onlyInCompound) words.add(stem.toLowerCase());
    const sfx = [];
    const pfx = [];
    for (const f of flags) {
      const r = rules.get(f);
      if (!r) continue;
      (r.type === "SFX" ? sfx : pfx).push(r);
    }
    const suffixed = [];
    for (const r of sfx) {
      for (const { word, contFlags } of applyRule(stem, r)) {
        words.add(word.toLowerCase());
        suffixed.push({ word, cross: r.cross });
        // one level of continuation flags
        for (const cf of contFlags) {
          const r2 = rules.get(cf);
          if (r2 && r2.type === "SFX") for (const w2 of applyRule(word, r2)) words.add(w2.word.toLowerCase());
        }
      }
    }
    for (const r of pfx) {
      for (const { word } of applyRule(stem, r)) words.add(word.toLowerCase());
      if (r.cross)
        for (const s of suffixed)
          if (s.cross) for (const { word } of applyRule(s.word, r)) words.add(word.toLowerCase());
    }
  }
  return words;
}
