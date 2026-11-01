// Text helpers shared by the content pipeline.

const STOP = new Set(["a", "an", "the", "to", "be", "of", "someone", "something", "one's", "oneself"]);

/** Normalise an English gloss for comparison: "to look (at)" -> "look" */
export function normaliseGloss(g) {
  return g
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z' -]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .join(" ")
    .trim();
}

/** Do two English glosses mean the same thing (loosely)? */
export function glossesAgree(a, b) {
  const x = normaliseGloss(a);
  const y = normaliseGloss(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const xs = x.split(" ");
  const ys = y.split(" ");
  // single-word gloss contained in a short multi-word gloss: "dog" ~ "dog (animal)", "house" ~ "a house"
  if (xs.length === 1 && ys.length <= 3 && ys.includes(xs[0])) return true;
  if (ys.length === 1 && xs.length <= 3 && xs.includes(ys[0])) return true;
  return false;
}

const FOLD = { ê: "e", ë: "e", é: "e", è: "e", ô: "o", ö: "o", ó: "o", û: "u", ü: "u", ú: "u", î: "i", ï: "i", í: "i", â: "a", ä: "a", á: "a" };

/** ASCII id for URLs: "môre" -> "more", "'n" -> "n", "ja-nee" -> "ja-nee" */
export function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[êëéèôöóûüúîïíâäá]/g, (c) => FOLD[c])
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
