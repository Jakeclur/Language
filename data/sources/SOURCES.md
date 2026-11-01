# Data sources and licences

Every dictionary entry records which of these sources it came from. Only sources that allow
**commercial redistribution** are used, because the app is published.

| File | Source | Licence | Used for |
|---|---|---|---|
| `freedict-afr-eng.tei` | [FreeDict Afrikaans–English](https://freedict.org/) (generated from Ergane) | GPL-2.0-or-later | Translations (AF→EN) |
| `freedict-eng-afr.tei` | [FreeDict English–Afrikaans](https://freedict.org/) (generated from Ergane) | GPL-2.0-or-later | Translations (EN→AF, reversed) |
| `frequency-af-opensubtitles.txt` | [FrequencyWords](https://github.com/hermitdave/FrequencyWords) by Hermit Dave, from OpenSubtitles 2016 | CC BY-SA 4.0 | Word frequency ranks; corpus attestation |
| `hunspell-af_ZA.dic` / `.aff` | [LibreOffice Afrikaans spellchecker](https://github.com/LibreOffice/dictionaries/tree/master/af_ZA) (Translate.org.za, Nieuwoudt & Viljoen word lists, Kris van der Merwe) | LGPL-2.1-or-later | Spell-checking every Afrikaans word |
| `apertium-eng-afr.dix` | [Apertium English–Afrikaans](https://github.com/apertium/apertium-eng-afr) bilingual dictionary | GPL-2.0 | Translations with part of speech (independent second source) |
| `nwu-afr-pronundict.txt` (+ phoneme map, COPYRIGHT) | [NWU MuST za_lex](https://github.com/NWU-MuST/za_lex), based on the RCRL Afrikaans Pronunciation Dictionary (CTexT, North-West University) for the Department of Arts and Culture | CC BY-SA 2.5 ZA | IPA pronunciations |
| `public/audio/mms/*` (generated) | Audio made with [Meta MMS-TTS Afrikaans](https://huggingface.co/facebook/mms-tts-afr) | CC BY-NC 4.0 | Recorded audio. **Non-commercial only**: replace with Azure/ElevenLabs audio before charging money |
| `content/curated/*.txt` | Leer Afrikaans editorial team (AI-drafted, machine-verified) | CC BY-SA 4.0 | Core vocabulary, slang, register and severity labels, examples |

Both FreeDict files come from the same original database (Ergane), so the verification pipeline
counts them as **one** independent source, not two. Independent source groups are: FreeDict,
Apertium, and the editorial list.

## Sources planned but not reachable from the build environment yet
- Wiktionary (via kaikki.org extracts), CC BY-SA
- Tatoeba sentence pairs, CC BY 2.0 FR
- SADiLaR NCHLT text and speech corpora, CC BY 3.0
- Leipzig Corpora Collection frequency data

Run `npm run import` on a machine with open internet access to refresh the files above.

## What the licences mean for the published app
- The **dictionary data** combines GPL and CC BY-SA material, so the generated dictionary must be
  shared under compatible terms with credit. The app's About page lists all credits.
- The app's **source code** is in this repository, which satisfies the GPL's source requirement for the data.
