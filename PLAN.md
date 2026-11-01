# Afrikaans Learning App: Project Plan

**Working title:** *Leer Afrikaans* (rename later)
**Audience:** English speakers starting from zero, aiming for confident everyday and formal Afrikaans
**Status:** Planning

---

## 1. Goals and scope

### What "all of Afrikaans" means in practice
No app can teach every word and expression, so the target is defined as:

| Goal | Measurable target |
|---|---|
| Course | Structured path from **CEFR A1 to C1** (beginner to advanced) |
| Grammar | Every major grammar point in a standard Afrikaans grammar, each with a lesson and drills |
| Vocabulary | ~5,000 high-frequency words taught actively. That covers most everyday text and speech |
| Dictionary | 30,000+ entries searchable both ways (EN→AF and AF→EN), each tagged by register |
| Real-world Afrikaans | Slang, informal speech, regional varieties (e.g. Kaaps), idioms, and cultural notes |
| Four skills | Reading, writing, listening, speaking |

### Non-goals (for v1)
- Live tutors or chat with other learners
- Teaching other South African languages
- Native mobile apps (a web app that installs on phones comes first; see §6)

---

## 2. Core features

### 2.1 The course (learning path)
- **Units → Lessons → Exercises**, unlocked in order, with a placement test so experienced learners can skip ahead.
- Each lesson has: a short explanation (in English), example sentences with audio, new vocabulary, then 8–15 exercises.
- Each unit ends with a **checkpoint** that mixes everything in the unit.
- **Review** sessions are generated each day from the spaced-repetition queue (§2.3).

### 2.2 The dictionary
- Search in **either direction**, with fuzzy matching (handles missing accents: `se` finds `sê`, `ne` finds `nè`).
- Each entry shows:
  - Headword, part of speech, pronunciation (IPA + audio)
  - Forms: plural, diminutive, past participle, comparative/superlative
  - English translations, ordered by how common they are
  - **Register label:** `formal` · `neutral` · `informal` · `slang` · `vulgar` · `dated`
  - **Region label** where relevant: `Kaaps`, `Northern Cape`, `Namibia`, etc.
  - Example sentences (AF + EN)
  - Related words, synonyms, idioms that use the word
  - Usage notes, e.g. "*u* is the polite 'you'; use it with elders and in formal letters"
- Filters: register, part of speech, CEFR level, topic (food, family, work…).
- **"Add to my deck"** button on every entry, which feeds it into spaced repetition.
- A setting to **hide vulgar entries** (on by default for younger users).

### 2.3 Spaced repetition (SRS)
- Every word and grammar pattern the learner meets becomes a card.
- Scheduling algorithm: **FSRS** (open-source, better than the older SM-2 used by early Anki). A free JS library, `ts-fsrs`, implements it.
- Cards are tested in several directions: AF→EN, EN→AF, audio→meaning, and typing the word from memory.

### 2.4 Exercise types

| Type | What the learner does | Best for |
|---|---|---|
| Flashcard | Flip and self-rate | Vocabulary |
| Multiple choice | Pick the correct translation/word | Early vocab, comprehension |
| Type the translation | Free typing, with typo tolerance and accepted alternatives | Production, spelling |
| Word-order builder | Drag word tiles into the correct order | Afrikaans word order (verb-second, verb-final, double *nie*) |
| Fill in the blank | Complete the sentence (with or without a word bank) | Grammar points |
| Matching pairs | Connect AF and EN items | Fast vocab review |
| Listening dictation | Hear audio, type what was said | Listening + spelling |
| Listen and choose | Hear audio, pick meaning or picture | Listening |
| Speaking | Say the sentence; speech recognition checks it | Pronunciation (see risks, §9) |
| Transform the sentence | Turn present → past, positive → negative, active → passive | Grammar mastery |
| Register switch | Rewrite a slang sentence formally (or the reverse) | Formal / informal / slang |
| Reading + questions | Short story or dialogue with tap-to-translate words, then questions | Reading, context |
| Dialogue role-play | Choose or type replies in a scripted conversation | Real-life situations |

### 2.5 Other learning tools
- **Grammar reference:** every grammar explanation from the course collected in one searchable place.
- **Pronunciation guide:** each sound with audio and English comparisons (*g* like Scottish "loch", *ui*, *eu*, *ê*, *ô*, *'n*).
- **Phrasebook:** survival phrases grouped by situation (greetings, shops, braai, sport, school, emergencies).
- **Slang & culture corner:** short notes on how words like *lekker*, *jol*, *ja-nee*, *now-now*, *sommer* and *eish* are really used.
- **Progress dashboard:** streak, words learned, CEFR progress, weak areas.

---

## 3. Curriculum outline

Grammar is taught in this order because each step builds on the one before it.

### A1: Beginner
1. **Sounds & spelling:** alphabet, vowels, diphthongs, diacritics (ê ë ô û), *'n*
2. **Greetings & introductions:** *Hallo, Goeie môre, Hoe gaan dit?, Ek is…*
3. **Pronouns & *wees*:** *ek, jy/u, hy, sy, ons, julle, hulle*; *is* for everything
4. **Present tense:** verbs don't change for the subject (*ek loop, hy loop*), which is easier than English
5. **Articles & plurals:** *die*, *'n*; plurals with *-e* and *-s*, and the irregular ones
6. **Numbers, time, days, months**
7. **Basic word order:** verb in second position (V2): *Vandag gaan ek…*
8. **Questions:** *wie, wat, waar, wanneer, hoekom, hoe*; yes/no questions by inversion
9. **Negation part 1:** the double *nie*: *Ek praat nie Afrikaans nie.*
10. **Possession:** *my, jou, sy, haar, ons, julle, hulle*; *se* (*Jan se kar*)
11. **Topics:** family, food, home, school, weather, colours

### A2: Elementary
12. **Past tense:** *het + ge-*: *Ek het geëet.* (only one past tense to learn)
13. **Future:** *sal* and *gaan*
14. **Modal verbs:** *kan, moet, wil, mag*, and their past forms *kon, moes, wou, mog*
15. **Diminutives:** *-tjie, -ie, -jie, -pie, -kie* (*hond → hondjie*) and their emotional uses
16. **Adjectives:** attributive *-e* inflection (*'n groot huis* vs *'n mooi huis*, *die ou man*)
17. **Comparatives & superlatives:** *groter, grootste; meer, mees*
18. **Prepositions** and separable verbs (*opstaan → Ek staan op*)
19. **Negation part 2:** *niks, niemand, nooit, geen* (+ *nie*)
20. **Topics:** shopping, travel, health, hobbies, sport, directions

### B1: Intermediate
21. **Subordinate clauses:** verb goes to the end: *…omdat ek moeg **is***
22. **Conjunctions** and which word order each one triggers (*en/maar/want* vs *omdat/as/wanneer/dat*)
23. **Relative clauses:** *wat, waarmee, waarvan…*
24. **Conditional:** *sou*, *as… dan…*
25. **Passive voice:** *word* (present) / *is ge-* (past)
26. **Reflexive verbs:** *Ek was my*, *hulle verbeel hulle*
27. **Infinitive constructions:** *om te*
28. **Formal vs informal register:** *u* vs *jy*, formal letters and emails
29. **Topics:** work, news, opinions, telling stories, feelings

### B2: Upper intermediate
30. Complex word order (several verbs at the end, *te* + modals)
31. Indirect speech
32. **Idioms and expressions:** *nou-nou, sommer, darem, mos, tog, nogal* (the little "flavour" words)
33. **Slang and colloquial Afrikaans**, plus English–Afrikaans code-switching
34. **Regional varieties:** Kaaps, Namibian Afrikaans, Orange River Afrikaans
35. Reading authentic texts: news, song lyrics, short stories

### C1: Advanced
36. Formal writing: essays, reports, official letters
37. Literary Afrikaans and figurative language
38. History of the language (Dutch roots, Malay, Portuguese, Khoekhoe and Bantu-language influence)
39. Debate and argument, nuance and tone

---

## 4. The dictionary in detail

### 4.1 Entry data model
```ts
interface DictionaryEntry {
  id: string;
  headword: string;            // "lekker"
  partOfSpeech: PartOfSpeech;  // "adjective"
  ipa?: string;                // "/ˈlɛkər/"
  audioUrl?: string;
  forms?: {
    plural?: string;
    diminutive?: string;
    pastParticiple?: string;
    comparative?: string;
    superlative?: string;
    attributive?: string;      // "lekker" → "lekker" / "groot" → "groot", "oud" → "ou"
  };
  senses: Sense[];             // one word can have several meanings
  cefrLevel?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  frequencyRank?: number;      // 1 = most common
  topics: string[];            // ["food", "emotions"]
  related: string[];           // ids of synonyms/antonyms/derived words
  source: string;              // where the data came from (needed for licensing)
}

interface Sense {
  translations: string[];      // ["nice", "tasty", "great", "pleasant"]
  register: "formal" | "neutral" | "informal" | "slang" | "vulgar" | "dated";
  regions?: string[];          // ["Kaaps"]
  definition?: string;         // English explanation when no single word fits
  usageNote?: string;
  examples: { af: string; en: string; audioUrl?: string }[];
}
```

### 4.2 Where the data comes from
Building 30,000 entries by hand isn't realistic, so the dictionary is built in layers:

1. **Open data import (bulk):** check each source's licence before using it.
   - **Wiktionary** (Afrikaans entries; CC BY-SA, so we must credit it and share alike)
   - **Apertium** Afrikaans–English/Dutch translation data (GPL; useful word pairs)
   - Frequency lists from open corpora (e.g. Leipzig Corpora Collection) to rank words
2. **Curated core (hand-checked):** the ~5,000 words used in the course get full entries: register, examples, audio, notes.
3. **Slang & informal layer (hand-written):** standard dictionaries miss a lot of slang, so this layer is collected and reviewed by native speakers. Examples:

| Word | Meaning | Register |
|---|---|---|
| *lekker* | nice, great, tasty | informal (very common) |
| *jol* | party / have fun | slang |
| *kief / kif* | cool | slang |
| *bru, bra* | mate, bro | slang |
| *tjommie* | friend | slang |
| *ou* | guy, person | informal |
| *bakkie* | pickup truck | neutral (SA) |
| *dop* | alcoholic drink / fail an exam | informal |
| *skinder* | gossip | neutral |
| *eish* | expression of dismay | informal (borrowed) |
| *ja-nee* | "yes, indeed" | informal |
| *moerse* | huge, very | slang (mildly rude) |

4. **Community suggestions (later):** users can suggest corrections and new slang. Suggestions go into a review queue before they appear.

> ⚠️ **Accuracy rule:** No AI-generated or community content goes live without review by a fluent speaker. Wrong slang or wrong register labels would teach people to embarrass themselves.

---

## 5. How a learner's day works (example)
1. Open the app → "15 reviews due, Lesson 12 next"
2. Do 5 minutes of SRS review (mixed exercise types)
3. Do the next lesson: explanation, then exercises
4. Read a short dialogue and tap unknown words to look them up and add them to the deck
5. See the streak and progress update

---

## 6. Technical plan

### 6.1 Recommended stack
| Layer | Choice | Why |
|---|---|---|
| App type | **Progressive Web App (PWA)** | One codebase runs in the browser and installs on phones, and it works offline |
| Front end | **React + TypeScript + Vite** | Popular, well documented, fast to develop |
| Styling | Tailwind CSS | Quick, consistent UI |
| Local storage | **IndexedDB** (via Dexie.js) | Stores the dictionary and progress on the device, so it works offline |
| Search | MiniSearch or FlexSearch | Fast fuzzy search in the browser, no server needed |
| SRS | `ts-fsrs` | Ready-made FSRS scheduling |
| Audio | Pre-recorded native-speaker audio for core content, text-to-speech (af-ZA voice) as fallback | Real voices are best; TTS fills gaps |
| Speech recognition | Web Speech API / cloud speech service (af-ZA) | For speaking exercises; support varies by browser |
| Accounts & sync (Phase 3) | Supabase or Firebase | Login, sync progress across devices |
| Testing | Vitest + Playwright | Unit tests + end-to-end tests |
| Hosting | Netlify / Vercel / GitHub Pages | Free tier is enough to start |

**Why no server at first:** all content is static JSON files, and progress is saved on the device. That keeps v1 simple and free to host. Accounts are added once sync across devices is needed.

### 6.2 Project structure
```
/
├── content/                 # all learning content as data, not code
│   ├── dictionary/          # entries (JSON), split by letter
│   ├── course/
│   │   ├── a1/unit-01-sounds/lesson-01.json
│   │   └── ...
│   ├── phrasebook/
│   └── audio/
├── scripts/                 # import/convert open dictionary data, validate content
├── src/
│   ├── features/
│   │   ├── course/          # learning path, lesson player
│   │   ├── exercises/       # one component per exercise type
│   │   ├── dictionary/      # search, entry page, filters
│   │   ├── srs/             # review queue, FSRS wrapper
│   │   ├── grammar/         # grammar reference
│   │   └── progress/        # stats, streaks
│   ├── lib/                 # answer checking, text normalisation, storage
│   └── app/                 # routing, layout, PWA setup
└── tests/
```

### 6.3 Content format (example lesson)
```json
{
  "id": "a1-u09-l01",
  "title": "Saying no: the double nie",
  "explanation": "Afrikaans usually puts **nie** twice in a negative sentence...",
  "examples": [
    { "af": "Ek praat nie Afrikaans nie.", "en": "I don't speak Afrikaans." }
  ],
  "vocabulary": ["praat", "verstaan", "weet"],
  "exercises": [
    {
      "type": "word-order",
      "prompt": "I don't understand.",
      "tiles": ["Ek", "verstaan", "nie", "nie"],
      "answer": "Ek verstaan nie."
    },
    {
      "type": "translate",
      "prompt": "She doesn't know.",
      "accepted": ["Sy weet nie.", "Sy weet dit nie."]
    }
  ]
}
```
Keeping content as data means non-programmers (teachers, native speakers) can write lessons, and a validation script checks every file before it ships.

### 6.4 Answer checking
Answer checking makes or breaks typing exercises:
- Normalise case, punctuation and extra spaces
- Accept answers with missing diacritics, but point out the mistake (*"Correct, but remember: **sê**"*)
- Typo tolerance (Levenshtein distance ≤ 1 for longer words)
- Multiple accepted answers per prompt
- Targeted feedback for common errors, e.g. forgetting the second *nie*, wrong verb position

---

## 7. Build phases

### Phase 0: Setup (week 1)
- Create the project (Vite + React + TS), linting, tests, PWA setup
- Define content schemas and a validation script

### Phase 1: MVP (weeks 2–6)
- Dictionary: import ~5,000 words with search both ways and register labels
- Course: A1 Units 1–5 with 5 exercise types (flashcard, multiple choice, translate, word order, fill-in-blank)
- SRS review queue
- Progress saved on the device
- ✅ *Done when someone can learn to introduce themselves and use basic present-tense sentences*

### Phase 2: Full beginner course (weeks 7–12)
- All of A1 + A2
- Audio for all course content
- Listening, matching, and transformation exercises
- Grammar reference and pronunciation guide
- Slang & culture corner (first 200 slang entries)
- Phrasebook

### Phase 3: Intermediate + accounts (weeks 13–20)
- B1 content, reading passages with tap-to-translate
- Dialogue role-play, register-switch exercises
- Accounts and cloud sync
- Dictionary grows to 30,000+ entries
- Placement test

### Phase 4: Advanced + community (later)
- B2 and C1 content
- Speaking exercises with speech recognition
- Community slang suggestions with moderation
- Optional AI conversation practice (with clear "may contain errors" labelling)
- Native mobile wrappers (Capacitor) if needed for app stores

---

## 8. Content creation workflow
1. Write a lesson in JSON (or in a spreadsheet that a script converts to JSON)
2. Run `npm run validate-content` (checks schema, that every vocab word exists in the dictionary, and that audio files exist)
3. **Native-speaker review:** grammar, naturalness, register labels
4. Record audio
5. Merge

---

## 9. Risks and open questions

| Risk | Mitigation |
|---|---|
| **Content volume is huge.** Writing A1–C1 is the biggest job, bigger than the code | Start narrow (A1), use templates, reuse the dictionary's example sentences |
| **Accuracy of slang and register** | Native-speaker review is required; cite sources |
| **Dictionary licensing** | Record the source and licence for every entry; follow CC BY-SA attribution |
| **Afrikaans voices for TTS and speech recognition** are less common than for big languages | Prefer recorded audio; test which browsers/services support af-ZA before building speaking features |
| **Sensitive/vulgar words** | Vulgar filter on by default; clear labels; consider the audience (e.g. school students) |
| **Motivation and retention** | Streaks, short daily sessions, visible progress |

### Questions to decide
1. **Who is it for first?** School students, travellers, people moving to South Africa, or people with Afrikaans family? This changes the topics and tone.
2. **Who checks the Afrikaans?** Do we have a fluent speaker or teacher to review content?
3. **Web app first (recommended), or native mobile from day one?**
4. **Free/personal project, or something to publish?** This affects licensing choices and whether accounts are needed early.
5. **Should vulgar slang be included at all,** or only mild slang?

---

## 10. Next steps
1. Answer the questions in §9
2. Set up the project skeleton (Phase 0)
3. Write the content schemas and 1 complete sample lesson to test the format
4. Build the dictionary import script and search page
5. Build the lesson player with the first 5 exercise types
