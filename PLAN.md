# Afrikaans Learning App: Project Plan

**Working title:** *Leer Afrikaans* (rename before launch; check the name is free to use)
**Audience:** English speakers starting from zero: school students, travellers, people moving to South Africa or Namibia, and people with Afrikaans family
**Goal:** A published app that takes learners from no Afrikaans to near-native understanding, including real everyday, slang, rude and formal Afrikaans
**Status:** Phases 0–2 built (MVP built). See "Build status" below and README.md

### Decisions made so far
| Question | Decision |
|---|---|
| Who is it for? | **Everyone listed above**, with a goal picker that tailors topics (see §2.1) |
| Who checks the Afrikaans? | **No reliance on a fluent reviewer.** Accuracy comes from an automated multi-source verification pipeline (see §5) |
| Rude/vulgar slang? | **Included**, fully labelled by severity, behind an opt-in age gate (see §4.4) |
| Personal or published? | **Published**, so licensing, privacy, age ratings and store requirements are part of the plan (see §9) |
| Vocabulary size | **Expanded:** 10,000+ words taught, 80,000+ dictionary headwords (see §4) |
| Audio | **Human-sounding neural voices only**, generated in advance and quality-checked. No robotic fallback, ever (see §6) |

---

## 1. Goals and scope

| Goal | Measurable target |
|---|---|
| Course | Structured path from **CEFR A1 to C2** (complete beginner to near-native) |
| Grammar | Every major grammar point in a standard Afrikaans grammar, each with a lesson and drills |
| Vocabulary taught | **10,000+ words** taught actively with spaced repetition |
| Dictionary | **80,000+ headwords** both directions, plus inflected-form lookup and a compound-word splitter that handles words not in the list |
| Idioms & sayings | **2,000+** idioms, proverbs and fixed expressions |
| Slang & informal | **1,500+** slang/informal entries, **300+** rude/vulgar entries, each with a severity rating |
| Audio | Natural, human-sounding audio for **every** word, example sentence, dialogue and story |
| Four skills | Reading, writing, listening, speaking |

### Non-goals (for v1)
- Live human tutors
- Teaching other South African languages (loanwords from them *are* covered)

---

## 2. Core features

### 2.1 Goal picker (one app for all audiences)
At sign-up the learner picks one or more goals. **Grammar is the same for everyone**, but the topics, example sentences and extra units are reordered to match:

| Goal | Extra emphasis |
|---|---|
| 🎒 **School** | School subjects, classroom language, essays and comprehension, exam-style exercises, set-work style reading |
| ✈️ **Travel** | Survival phrases early, transport, food, accommodation, directions, money, emergencies |
| 🏠 **Moving to SA / Namibia** | Work, banking, renting, doctors, officialdom, formal letters, workplace slang, small talk with neighbours |
| 👪 **Family / heritage** | Family words, terms of endearment, recipes, traditions, religion, childhood songs and rhymes, talking with older relatives (formal *u*) |
| 🗣️ **Just for fun / culture** | Music, sport, braai culture, humour, slang early |

### 2.2 The course (learning path)
- **Units → Lessons → Exercises**, unlocked in order, with a **placement test** so experienced learners can skip ahead.
- Each lesson has a short explanation in English, example sentences with audio, new vocabulary, then 8–15 exercises.
- Each unit ends with a **checkpoint** that mixes everything in it.
- A **daily review** is generated from the spaced-repetition queue (§2.4).

### 2.3 The dictionary
- Search **both directions** with fuzzy matching. Missing accents are fine: `se` finds `sê`.
- **Inflected-form lookup:** typing `geëet`, `honde` or `mooier` finds `eet`, `hond` and `mooi`.
- **Compound splitter:** Afrikaans joins words together (`kombuistafel` = `kombuis` + `tafel`, "kitchen table"). Unknown compounds are broken into known parts, so the dictionary can handle words that aren't in it.
- Each entry shows:
  - Headword, part of speech, IPA, and **natural human-sounding audio**
  - Forms: plural, diminutive, past participle, comparative/superlative, attributive form
  - English translations, most common first
  - **Register:** `formal` · `neutral` · `informal` · `slang` · `rude` · `vulgar` · `offensive slur` · `dated` · `literary`
  - **Severity** for rude words (0–4, see §4.4)
  - **Region:** `Kaaps`, `Namibia`, `Northern Cape`, `Orange River`, etc.
  - Example sentences (AF + EN) with audio
  - Word family (e.g. `werk → werker, werkloos, werkswinkel, gewerk`), synonyms, antonyms, idioms that use the word
  - Usage notes ("*u* is polite 'you'; use it with elders, strangers and in formal letters")
  - **Confidence badge:** how well the entry is verified (see §5)
- Filters: register, severity, part of speech, CEFR level, topic, region.
- **"Add to my deck"** on every entry.
- **"Report a mistake"** on every entry, which feeds the correction queue (§5.3).

### 2.4 Spaced repetition (SRS)
- Every word, phrase and grammar pattern the learner meets becomes a card.
- Scheduling uses **FSRS**, a modern open-source algorithm (`ts-fsrs` library).
- Cards are tested in several directions: AF→EN, EN→AF, audio→meaning, typed from memory, and used in a sentence.

### 2.5 Exercise types

| Type | What the learner does | Best for |
|---|---|---|
| Flashcard | Flip and self-rate | Vocabulary |
| Multiple choice | Pick the correct translation/word | Early vocab, comprehension |
| Type the translation | Free typing with typo tolerance and alternatives | Production, spelling |
| Word-order builder | Drag word tiles into order | Verb-second, verb-final, double *nie* |
| Fill in the blank | Complete the sentence | Grammar points |
| Matching pairs | Connect AF and EN items | Fast vocab review |
| Listening dictation | Hear audio, type it | Listening + spelling |
| Listen and choose | Hear audio, pick meaning/picture | Listening |
| **Shadowing** | Hear a sentence, record yourself, play both back side by side | Pronunciation |
| Speaking | Say the sentence; speech recognition checks it | Speaking |
| Transform the sentence | Present → past, positive → negative, active → passive | Grammar mastery |
| Register switch | Rewrite slang formally or the reverse | Formal / informal / slang |
| **"How rude is this?"** | Rate a sentence's rudeness, or pick when it would be OK to say | Understanding vulgar language safely |
| **Word building** | Combine prefixes, roots and suffixes (`on- + gelukkig`) | Growing vocabulary fast |
| Reading + questions | Story/dialogue with tap-to-translate words | Reading |
| Dialogue role-play | Choose or type replies in a conversation | Real-life situations |

### 2.6 Other learning tools
- **Grammar reference:** all explanations in one searchable place.
- **Pronunciation guide:** every sound, with audio from several voices and English comparisons (*g* like Scottish "lo**ch**", *r* rolled, *ui*, *eu*, *ê*, *ô*, *'n*).
- **Phrasebook:** survival phrases by situation, adapted to the learner's goal.
- **Slang & culture corner:** how words like *lekker*, *kuier*, *jol*, *ja-nee*, *sommer*, *mos* and *eish* are really used.
- **Street Afrikaans (18+):** the rude and vulgar module (§4.4).
- **Progress dashboard:** streak, words learned, CEFR progress, weak areas.

---

## 3. Curriculum outline

### A1: Beginner (~700 words)
1. **Sounds & spelling:** alphabet, vowels, diphthongs, diacritics (ê ë ô û î), *'n*
2. **Greetings & introductions:** *Hallo, Goeie môre, Hoe gaan dit?, Ek is…*
3. **Pronouns & *wees*:** *ek, jy/u, hy, sy, ons, julle, hulle*; *is* for every person
4. **Present tense:** verbs don't change for the subject (*ek loop, hy loop*)
5. **Articles & plurals:** *die*, *'n*; *-e*, *-s*, and irregular plurals
6. **Numbers, time, dates, days, months, money**
7. **Basic word order:** verb second (V2): *Vandag gaan ek…*
8. **Questions:** *wie, wat, waar, wanneer, hoekom, hoe, hoeveel*
9. **Negation part 1:** the double *nie*
10. **Possession:** possessive pronouns; *se* (*Jan se kar*)
11. **Topics:** family, food, home, school, weather, colours, body, clothes

### A2: Elementary (~1,500 words cumulative)
12. **Past tense:** *het + ge-*: *Ek het geëet.*
13. **Future:** *sal* and *gaan*
14. **Modal verbs:** *kan, moet, wil, mag* and *kon, moes, wou, mog*
15. **Diminutives:** *-tjie, -ie, -jie, -pie, -kie*, and their emotional uses
16. **Adjective inflection:** *'n groot huis*, *'n mooi huis*, *die ou man*
17. **Comparatives & superlatives**
18. **Prepositions & separable verbs:** *opstaan → Ek staan op*
19. **Negation part 2:** *niks, niemand, nooit, geen, nêrens*
20. **Topics:** shopping, travel, health, hobbies, sport, directions, animals, jobs

### B1: Intermediate (~3,000 words)
21. **Subordinate clauses:** verb to the end: *…omdat ek moeg **is***
22. **Conjunctions** and the word order each one triggers
23. **Relative clauses:** *wat, waarmee, waarvan, waarin…*
24. **Conditional:** *sou*, *as… dan…*
25. **Passive voice:** *word* / *is ge-*
26. **Reflexive verbs:** *Ek was my*, *Hy skaam hom*
27. **Infinitives:** *om te*, *te*
28. **Word formation:** prefixes (*on-, ver-, be-, ont-, her-*) and suffixes (*-heid, -lik, -ing, -er, -loos, -baar*). This lets learners work out thousands of new words
29. **Formal vs informal:** *u* vs *jy*, formal emails and letters
30. **Topics:** work, news, opinions, storytelling, feelings, technology, environment

### B2: Upper intermediate (~5,500 words)
31. Complex verb clusters (*Ek sou dit kon gedoen het*)
32. Indirect speech
33. **"Flavour" words:** *nou-nou, sommer, darem, mos, tog, nogal, maar, al*
34. **Idioms and proverbs**
35. **Slang and colloquial Afrikaans**, English–Afrikaans code-switching
36. **Street Afrikaans (18+, opt-in):** rude words, insults, swearing, and when (not) to use them
37. **Regional varieties:** Kaaps, Namibian, Orange River, Eastern Cape
38. Authentic texts: news, song lyrics, social media, short stories

### C1: Advanced (~8,000 words)
39. Formal writing: essays, reports, official and business letters
40. Literary Afrikaans and figurative language
41. Language history: Dutch roots and Malay, Portuguese, Khoekhoe, Bantu-language and English influence
42. Debate, argument, nuance, tone, sarcasm and humour

### C2: Mastery (10,000+ words)
43. Specialist vocabulary packs: law, medicine, business, farming, science, religion
44. Poetry and classic literature excerpts
45. Spotting regional accents and social registers by ear
46. Fine distinctions between near-synonyms

---

## 4. Vocabulary and dictionary

### 4.1 Vocabulary targets by level
| Level | Taught words (cumulative) | Idioms/phrases | Roughly what you can do |
|---|---|---|---|
| A1 | 700 | 50 | Introduce yourself, basic survival |
| A2 | 1,500 | 150 | Everyday conversations on familiar topics |
| B1 | 3,000 | 400 | Handle most travel and social situations, simple news |
| B2 | 5,500 | 800 | Follow TV, chat naturally, understand slang |
| C1 | 8,000 | 1,400 | Work and study in Afrikaans |
| C2 | 10,000+ | 2,000+ | Near-native comprehension, literature |

Words are chosen by **frequency** (from corpus counts) first, then by **topic need** for the learner's goal.

### 4.2 Topic packs (45 packs, ~100–400 words each)
**Everyday:** greetings · family & relationships · body & health · food & cooking · drinks · clothes · home & furniture · kitchen · colours & shapes · numbers & maths · time & calendar · weather & seasons · emotions & personality · hobbies · sport (rugby, cricket, soccer) · music & dance · shopping & money

**Places & travel:** town & directions · transport & driving (incl. *robot* = traffic light) · accommodation · nature & landscape · animals (incl. SA wildlife) · plants · farm life · beach & sea

**School & work:** school & subjects · university · jobs & workplace · office & computers · technology & internet · business & finance · law & government · medicine & hospital · science · media & news

**Culture & society:** braai & food culture · celebrations & holidays · religion · history · politics · environment · crime & safety · social media & texting abbreviations · humour & insults · terms of endearment

### 4.3 Entry data model
```ts
interface DictionaryEntry {
  id: string;
  headword: string;             // "lekker"
  partOfSpeech: PartOfSpeech;
  ipa?: string;                 // "/ˈlɛkər/"
  audio: AudioRef[];            // several voices (see §6)
  forms?: {
    plural?: string;
    diminutive?: string;
    pastParticiple?: string;
    comparative?: string;
    superlative?: string;
    attributive?: string;       // "oud" → "ou"
  };
  senses: Sense[];
  cefrLevel?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  frequencyRank?: number;       // 1 = most common
  topics: string[];
  wordFamily: string[];         // derived/related entry ids
  compoundParts?: string[];     // ["kombuis", "tafel"]
  verification: Verification;   // see §5
}

interface Sense {
  translations: string[];
  register: "formal" | "neutral" | "informal" | "slang" | "rude"
          | "vulgar" | "offensive-slur" | "dated" | "literary";
  severity?: 0 | 1 | 2 | 3 | 4; // rude/vulgar words only
  regions?: string[];
  definition?: string;
  usageNote?: string;
  examples: { af: string; en: string; audio?: AudioRef[]; source: string }[];
}

interface Verification {
  sources: { name: string; licence: string; url?: string }[];
  corpusHits?: number;          // times the word/sense appears in real text
  checks: string[];             // which automated checks passed
  confidence: "verified" | "checked" | "unverified" | "community";
  reports: number;              // open "report a mistake" count
}
```

### 4.4 Slang, rude and vulgar language
Real Afrikaans is full of slang and swearing, and learners need to *understand* it even if they never say it. All of it is included and **clearly labelled**.

**Severity scale**
| Level | Meaning | Examples |
|---|---|---|
| 0 | Clean slang, fine anywhere casual | *lekker, kief, bru, tjommie, kuier* |
| 1 | Mild, a bit cheeky | *jissis, vrek* (of people), *sies* |
| 2 | Rude: not with grandparents or teachers | *kak, gat, gatvol, bliksem, donner, drol* |
| 3 | Strong swearing | *fok, fokken, fokol, befok, doos* |
| 4 | Extremely offensive | *poes* (as an insult) |
| ⛔ | **Offensive slur** (racial, ethnic, homophobic) | Defined and explained, never taught for use |

**Rules**
- Levels 0–1 appear in the normal course.
- Levels 2–4 appear only in the **Street Afrikaans** module and dictionary, which need an **18+ confirmation** and are switched off by default.
- **Slurs** have dictionary entries only, so learners can recognise them and understand why they are hurtful. They come with a warning and historical context, are never used in exercises or flashcards, and have no auto-play audio. Some slurs have legal consequences in South Africa (hate speech and *crimen injuria* cases), and the entry says so.
- Every rude entry has a **"When would people say this?"** note and a **"Safer alternative"** (e.g. *kak* → *nonsens / sleg*).

**Sample slang and informal entries** (the full list targets 1,500+)
| Word | Meaning | Register | Sev. |
|---|---|---|---|
| *lekker* | nice, great, tasty | informal | 0 |
| *kuier* | visit, hang out socially | neutral | 0 |
| *jol* | party; have fun | slang | 0 |
| *kief / kif* | cool | slang | 0 |
| *kwaai* | cool, awesome (also standard: strict, angry) | slang | 0 |
| *bru / bra / broer* | bro, mate | slang | 0 |
| *tjommie / pel* | friend | slang | 0 |
| *ou / outjie* | guy | informal | 0 |
| *ballie* | old man, dad | slang | 0 |
| *bokkie* | sweetheart | informal | 0 |
| *howzit / hoesit* | how's it going | slang | 0 |
| *lank laas* | long time no see | informal | 0 |
| *dop* | alcoholic drink; fail an exam | informal | 0 |
| *babbelas* | hangover | informal | 0 |
| *lus* | to feel like (*Ek is lus vir pizza*) | informal | 0 |
| *sommer* | just (for no reason) | informal | 0 |
| *mos* | after all, you know | informal | 0 |
| *nou-nou* | in a moment (not "right now") | informal | 0 |
| *ja-nee* | yes, indeed | informal | 0 |
| *yslik* | huge | informal | 0 |
| *foeitog* | shame, aww | informal | 0 |
| *eish* | expression of dismay | informal | 0 |
| *jislaaik* | wow, gosh | informal | 0 |
| *sies* | yuck, gross | informal | 1 |
| *jissis* | geez (from "Jesus") | informal | 1 |
| *vrek* | to die (animals; rude of people); very (*vrek koud*) | informal | 1 |
| *moerse* | massive, very | slang | 1 |
| *gatvol* | fed up | rude | 2 |
| *kak* | crap, shit | vulgar | 2 |
| *bliksem* | to hit; damn | rude | 2 |
| *donner* | to beat up; damn | rude | 2 |
| *drol* | turd; jerk | rude | 2 |
| *fok / fokken* | fuck / fucking | vulgar | 3 |
| *fokol* | fuck all, nothing | vulgar | 3 |
| *befok* | crazy; awesome | vulgar | 3 |
| *doos* | idiot (vulgar) | vulgar | 3 |
| *poes* | extremely vulgar insult | vulgar | 4 |

> These meanings and severities are a starting draft. They go through the same verification pipeline as everything else (§5) before launch.

### 4.5 Where the data comes from
Building this by hand isn't realistic, so the dictionary is built in layers. **Every entry records its source and licence.**

1. **Open data (bulk import)**
   - **Wiktionary**, Afrikaans entries (CC BY-SA: credit required, and the dictionary data must stay share-alike)
   - **Tatoeba**, Afrikaans–English example sentence pairs (CC BY)
   - **Apertium**, Afrikaans word pairs (GPL; used as a cross-checking source)
   - **SADiLaR** (South African Centre for Digital Language Resources): NCHLT Afrikaans text and speech corpora, several under CC BY
   - **Leipzig Corpora Collection**, word frequency
   - **Hunspell af_ZA** spell-check word list, for spelling validation
2. **Generated layer:** inflected forms, diminutives, plurals and compounds generated by rules, then validated against corpora (§5).
3. **Curated core:** the 10,000 course words get full entries with notes, examples and audio.
4. **Slang layer:** collected from multiple sources (slang dictionaries and glossaries, song lyrics, social media and forums, Wiktionary slang categories) and cross-checked.
5. **Community layer (after launch):** user suggestions and corrections (§5.3).

> ⚖️ Check the licence of each source before importing. Avoid anything marked **NC (non-commercial)** or "all rights reserved", because the app is going to be published.

---

## 5. Accuracy without a fluent reviewer

With no human checker, accuracy has to be **built into the pipeline**: content is only trusted when independent sources agree.

### 5.1 Verification pipeline (runs automatically on every content change)
| # | Check | What it catches |
|---|---|---|
| 1 | **Multi-source agreement:** each translation must match in ≥2 independent sources | Wrong translations |
| 2 | **Corpus attestation:** the word, and ideally the sense, appears in real Afrikaans text (SADiLaR, Leipzig, Tatoeba) | Made-up words, wrong forms |
| 3 | **Spell check:** every Afrikaans word passes Hunspell af_ZA or is a known slang/regional entry | Typos, wrong diacritics |
| 4 | **Grammar rules engine** (written by us): double *nie* present, verb in 2nd position in main clauses, verb-final after *omdat/dat/as…*, *het + ge-* past participles, adjective inflection | Grammatically wrong example sentences |
| 5 | **Back-translation:** translate each Afrikaans sentence back to English with two different machine-translation engines and compare the meaning to the intended English | Sentences that say something other than intended |
| 6 | **AI cross-review:** any AI-drafted content is reviewed by a *second, independent* model prompted to find errors; disagreements are flagged | Unnatural phrasing, register mistakes |
| 7 | **Audio round-trip:** speech recognition transcribes every audio file and compares it to the text (§6.4) | Mispronounced or garbled audio |
| 8 | **Consistency checks:** every word used in a lesson exists in the dictionary; every exercise has a valid answer; no slur appears in an exercise | Broken content |

### 5.2 Confidence badges (shown to learners)
| Badge | Rule (as implemented in `pipeline/build-content.mjs`) | Used in course? |
|---|---|---|
| ✅ **Verified** | 2+ independent dictionaries agree on the meaning + word found in real text or the pronunciation lexicon + passes the spellchecker | Yes |
| ☑️ **Checked** | 2+ independent dictionaries agree, or 1 dictionary + the word is confirmed by 2+ independent word lists (corpus, lexicon, spellchecker) | Yes |
| ⚠️ **Unverified** | Anything else | Dictionary only, with a warning |
| 👥 **Community** | Added or corrected by users and upvoted | Dictionary only, until it reaches "Checked" |

**Course content may only use Verified or Checked words and sentences.**

### 5.3 Self-correcting after launch
- **"Report a mistake"** button on every entry, sentence and exercise.
- Reports, upvotes and downvotes go into a public correction queue.
- Users who show they are fluent (e.g. they pass the C2 placement test, or have a long accurate reporting history) earn **trusted reviewer** status, so the native-speaking user base gradually becomes the reviewer pool without anyone being relied on up front.
- Entries with many reports are automatically demoted to ⚠️ until fixed.

> Honest limit: this greatly reduces errors but can't remove all of them. Slang in particular changes fast. The badges and report button exist so learners know how much to trust each item.

---

## 6. Audio: natural, human-sounding pronunciation

**Rule: no robotic audio, ever.** Classic browser text-to-speech is not used. The one exception: devices that offer a *natural/neural* Afrikaans voice through the browser (e.g. Microsoft Edge's "Adri Online (Natural)"); the app uses those live until recorded clips exist, and shows no speaker button otherwise. Afrikaans voices are often missing from devices, and the ones that exist sound robotic. Instead, all audio is **generated in advance** with the best neural voices, quality-checked, and stored as audio files. If an item has no audio yet, the app shows "audio coming soon" instead of falling back to a robotic voice.

### 6.1 Voice engines (as of late 2026; re-check before building)
| Engine | Afrikaans voices | Notes | Use for |
|---|---|---|---|
| **ElevenLabs** (v3 or newer model) | Afrikaans supported; many voice styles | Most expressive and human-like; emotion and natural rhythm; costs more | **Dialogues, stories, slang, emotional speech** |
| **Microsoft Azure AI Speech** | `af-ZA-AdriNeural` (female), `af-ZA-WillemNeural` (male) | Natural neural voices; full SSML control (speed, pauses, exact phonemes); cheaper | **Dictionary words, example sentences, slow-speed audio** |
| Google Cloud TTS | Only a "Standard" af-ZA voice found | Older, more robotic voice type | ❌ Not used |
| Browser `speechSynthesis` | Often unavailable | Robotic | ❌ Not used |
| Open models with **non-commercial** licences | Some have Afrikaans | Can't be used in a published app | ❌ Not used |

**Step 1 of audio work is a "voice bake-off":** generate the same 50 test items (single words, tricky sounds like *g*, *ui*, *ê*, *'n*, long sentences, questions, slang, swearing, a dialogue) with each candidate engine and voice. Score each on:
1. **Automatic accuracy:** speech-recognition word error rate (§6.4)
2. **Naturalness:** blind listening: does it sound like a real person? (You don't need to speak Afrikaans to judge this.)
3. **Content policy:** confirm the engine will actually say vulgar words, since some services filter them
4. **Cost and commercial licence terms**

### 6.2 Making it sound human
- **Speak in full sentences.** Never stitch single-word clips together; that is what sounds robotic.
- **Several voices:** at least 2 female and 2 male, of different ages, so dialogues sound like real conversations and learners hear variety.
- **Speaking style matches register:** relaxed, casual delivery for slang and street language; clear and careful for formal content.
- **Natural pauses and intonation** via SSML or engine settings: questions rise, lists pause, emotion where the text has it.
- **Two speeds:** normal speed, plus a slow version **generated by the voice engine** (not stretched audio, which sounds distorted).
- **Pronunciation dictionary:** when an engine says a word wrong, an override (IPA phoneme or respelling) is saved and reused everywhere.
- **Audio polish:** loudness normalisation, trimmed silence, consistent volume across voices, compressed to small files (Opus/MP3).

### 6.3 Optional upgrade: real voice recordings
Once the app earns money, hire paid voice actors to record the **top ~2,000 words and core dialogues**. That means recording, not checking content. Recorded audio replaces the AI audio for those items.

### 6.4 Automatic audio quality check
For every generated file:
1. Transcribe it with a speech-recognition model that supports Afrikaans (e.g. Whisper, or Azure Speech-to-Text `af-ZA`)
2. Compare the transcript with the intended text
3. **Pass** → publish. **Fail** → regenerate with different settings or voice, then flag for a pronunciation-dictionary fix if it still fails
4. Also check for clipping, long silences, and wrong duration (too short or long for the text)

### 6.5 Learner pronunciation practice
- **Shadowing:** play the model audio, record yourself, play both back-to-back with a pitch/waveform visual.
- **Speaking check:** speech recognition (`af-ZA`) transcribes the learner and highlights words it couldn't recognise.
- The SADiLaR NCHLT Afrikaans speech corpus (CC BY) can be used to **test** how well the speech recogniser handles different South African accents.

### 6.6 Cost estimate (rough; check current prices)
- Dictionary + sentences: a few million characters in total. On Azure neural voices that is roughly tens of US dollars for a full generation pass.
- Dialogues/stories on ElevenLabs: a paid plan with commercial rights; budget roughly the cost of a monthly subscription during generation months.
- Audio is generated **once** and stored, so the ongoing cost is just hosting the files.

---

## 7. Technical plan

### 7.1 Recommended stack
| Layer | Choice | Why |
|---|---|---|
| App type | **Progressive Web App (PWA)** first; wrapped with **Capacitor** for iOS/Android app stores | One codebase everywhere, works offline |
| Front end | **React + TypeScript + Vite** | Popular, well documented |
| Styling | Tailwind CSS | Quick, consistent UI |
| On-device storage | IndexedDB via Dexie.js | Offline dictionary and progress |
| Search | MiniSearch / FlexSearch | Fast fuzzy search, no server needed |
| SRS | `ts-fsrs` | FSRS scheduling |
| Backend | Supabase (Postgres + auth + storage) | Accounts, sync, community reports, moderation queue |
| Audio hosting | Object storage + CDN (e.g. Cloudflare R2) | Cheap, fast delivery of thousands of audio files |
| Content pipeline | Node/Python scripts in `/scripts` | Import, generate, verify, synthesise audio |
| Testing | Vitest + Playwright | Unit + end-to-end tests |
| Hosting | Vercel / Netlify / Cloudflare Pages | Free tier to start |

### 7.2 Project structure
```
/
├── content/
│   ├── dictionary/          # entries (JSON), split by letter
│   ├── course/a1 … c2/      # units and lessons
│   ├── topics/              # topic pack definitions
│   ├── phrasebook/
│   ├── slang/               # slang + street Afrikaans source data
│   └── pronunciation-overrides.json
├── pipeline/
│   ├── import/              # Wiktionary, Tatoeba, SADiLaR, Apertium importers
│   ├── generate/            # inflections, compounds, word families
│   ├── verify/              # the checks in §5.1
│   └── audio/               # TTS generation + speech-recognition QA (§6)
├── src/
│   ├── features/
│   │   ├── onboarding/      # goal picker, placement test, age gate
│   │   ├── course/
│   │   ├── exercises/       # one component per exercise type
│   │   ├── dictionary/
│   │   ├── srs/
│   │   ├── grammar/
│   │   ├── pronunciation/   # shadowing, speaking checks
│   │   ├── community/       # report-a-mistake, reviewer queue
│   │   └── progress/
│   ├── lib/                 # answer checking, normalisation, storage
│   └── app/
└── tests/
```

### 7.3 Example lesson file
```json
{
  "id": "a1-u09-l01",
  "title": "Saying no: the double nie",
  "goals": ["all"],
  "explanation": "Afrikaans usually puts **nie** twice in a negative sentence...",
  "examples": [
    { "af": "Ek praat nie Afrikaans nie.", "en": "I don't speak Afrikaans.",
      "audio": ["adri/a1-u09-001.opus", "willem/a1-u09-001.opus"] }
  ],
  "vocabulary": ["praat", "verstaan", "weet"],
  "exercises": [
    { "type": "word-order", "prompt": "I don't understand.",
      "tiles": ["Ek", "verstaan", "nie", "nie"], "answer": "Ek verstaan nie." },
    { "type": "translate", "prompt": "She doesn't know.",
      "accepted": ["Sy weet nie.", "Sy weet dit nie."] }
  ]
}
```

### 7.4 Answer checking
- Normalise case, punctuation and spaces
- Accept missing diacritics but point them out ("Correct, but remember: **sê**")
- Typo tolerance (edit distance ≤ 1 on longer words)
- Several accepted answers per prompt
- Targeted feedback for common mistakes: missing second *nie*, wrong verb position, missing *ge-*

---

## 8. Build phases

### Phase 0: Foundations (weeks 1–2)
- Project setup (Vite + React + TS, PWA, tests, linting)
- Content schemas and validation script
- Licence register (a spreadsheet listing every data source and its licence)

### Phase 1: Data and audio pipeline (weeks 3–8)
- Importers for Wiktionary, Tatoeba, SADiLaR, frequency lists
- Verification checks 1–4 and 8 (§5.1)
- **Voice bake-off**, then pick engines and voices (§6.1)
- Audio generation and speech-recognition QA for the first 2,000 words

### Phase 2: MVP app (weeks 9–14)
- Dictionary with search, inflection lookup, compound splitter, register labels and badges
- Goal picker, A1 course (all units), 6 exercise types, SRS, offline progress
- ✅ *Done when a learner can complete A1 with natural audio throughout*

### Phase 3: Beginner → intermediate (weeks 15–26)
- A2 + B1 content, all remaining exercise types
- Back-translation and AI cross-review checks (5–6)
- Grammar reference, pronunciation guide, shadowing, phrasebook
- Accounts and sync (Supabase)
- Dictionary reaches 40,000+ headwords

### Phase 4: Launch prep (weeks 27–32)
- Street Afrikaans module + 18+ gate
- Report-a-mistake + correction queue
- Privacy policy, terms of use, licence credits page
- Public **beta**: invite learners and Afrikaans speakers; fix what they report
- App store builds (Capacitor) and store listings
- 🚀 **Launch**

### Phase 5: After launch
- B2, C1, C2 content and specialist packs
- Dictionary reaches 80,000+ headwords
- Trusted community reviewers
- Speaking checks with speech recognition
- Optional: AI conversation partner, paid voice-actor recordings

---

## 9. Publishing checklist

| Area | What's needed |
|---|---|
| **Licences** | Credit page for all sources; dictionary data released under CC BY-SA if Wiktionary data is used; no non-commercial sources; TTS plan must allow commercial use. Get advice if unsure |
| **Privacy** | Privacy policy covering the laws where users live: Australia (Privacy Act), South Africa (POPIA), EU/UK (GDPR), USA (COPPA if under-13s can sign up). Collect as little personal data as possible |
| **Age rating** | App stores rate apps by the content they *can* show. Profanity will raise the rating. Options: (a) accept a higher rating, or (b) keep Street Afrikaans on the web version only and ship a cleaner store app. **Decide before store submission** |
| **Age gate** | 18+ confirmation for severity 2–4 content; parental setting to lock it off |
| **Name & branding** | Check the app name isn't trademarked or already taken in the app stores |
| **Money** | Audio generation and hosting cost money. Options: free with a paid "Pro" tier (offline packs, advanced levels), one-off purchase, or donations |
| **Accessibility** | Captions/transcripts for all audio, screen-reader support, adjustable text size, colour contrast |

---

## 10. Risks
| Risk | Mitigation |
|---|---|
| **Content volume is huge.** A1–C2 is the biggest job, bigger than the code | Pipeline-generated drafts + automatic verification; launch at B1 and keep adding |
| **Errors without a fluent reviewer** | Multi-source verification, confidence badges, report button, community reviewers (§5) |
| **TTS mispronounces or refuses words** | Bake-off, pronunciation overrides, speech-recognition QA, second engine as backup |
| **Licensing mistakes** | Licence register from day one; avoid NC sources |
| **Vulgar content and age ratings** | Severity labels, 18+ gate, off by default; decide the store strategy early |
| **Slurs misused** | Recognition-only entries, warnings, never in exercises |
| **Costs** | Generate audio once; free hosting tiers; Pro tier later |

---

## Build status (November 2026)

| Phase | Status |
|---|---|
| 0 Foundations | ✅ Vite + React + TypeScript PWA, schemas, validation, licence register (`data/sources/SOURCES.md`) |
| 1 Data & audio pipeline | ✅ Importers (FreeDict, Apertium, FrequencyWords, Hunspell, NWU pronunciation lexicon, optional Wiktionary); verification checks 1–4 and 8; audio generation + QA scripts. ⏳ Bake-off and audio generation need API keys |
| 2 MVP app | ✅ Dictionary (8,684 headwords, inflection lookup, compound splitter, badges), goal picker, A1 + A2 core + B1 slang + 18+ street unit (30 lessons), 9 exercise types, FSRS review, progress, phrasebook, grammar, pronunciation guide |
| 3 Intermediate + accounts | ⏳ Next: B1 grammar units, back-translation / AI cross-review checks (5–6), accounts & sync |
| 4 Launch prep | 🟡 Partly done: 18+ gate, report-a-mistake (GitHub issues), credits page, Pages deploy workflow. Still needed: privacy policy, store builds |

Gaps compared with the targets in §1, stated plainly:
- The dictionary has **8,684** headwords, not 80,000. Wiktionary, Tatoeba and SADiLaR were blocked in the build environment. Running `npm run import` with open internet adds Wiktionary.
- **No audio yet.** The pipeline is written and dry-run tested, but it needs ElevenLabs/Azure keys. Until then the app shows 🔈 and never uses robotic TTS.
- Course content currently covers A1–A2 plus selected B1/B2 topics. C1–C2 are still to be written.

## 11. Next steps
1. Set up the project skeleton and content schemas (Phase 0)
2. Build the Wiktionary + Tatoeba importers and see how many entries pass verification
3. Run the voice bake-off (ElevenLabs vs Azure) on 50 test items and pick the voices
4. Write one complete sample lesson (A1 Unit 9, double *nie*) end to end: content → verification → audio → lesson player
