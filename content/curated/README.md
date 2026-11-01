# Curated vocabulary

Hand-curated entries that are merged with the imported open dictionaries.
One entry per line, fields separated by `|`. Lines starting with `#` are comments.

```
headword | pos | translations (;) | register | severity | CEFR | topics (,) | forms | example AF | example EN | usage note
```

- **pos:** noun, verb, adj, adv, pron, prep, conj, interj, num, det, particle, phrase
- **register:** formal, neutral, informal, slang, rude, vulgar, offensive-slur, dated, literary
- **severity:** 0–4 (blank = 0); see PLAN.md §4.4
- **forms:** `pl=` plural, `dim=` diminutive, `pp=` past participle, `cmp=` comparative,
  `sup=` superlative, `attr=` attributive adjective, `past=` simple past (modals); separated by `;`
- **regions** can be given in the note as `[region: Kaaps]`

Every entry still goes through the verification pipeline (`npm run verify`).
