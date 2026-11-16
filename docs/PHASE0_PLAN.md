# Pontino — Phase 0 plan

Status: **waiting for your answers.** No application code has been written. This folder holds only `SPEC.md` and `docs/`.

Deliverables in this phase:
- This plan (understanding, stack, decisions, wireframes, questions, risks)
- [CURRICULUM_JA.md](CURRICULUM_JA.md) and [CURRICULUM_IT.md](CURRICULUM_IT.md)
- [mockups/phase0.html](mockups/phase0.html): six screens, three brand palettes, both language themes, light and dark

## 1. What I understand

1. A personal, free, ad-free, tracker-free **web app** (installable PWA, static hosting, no server, no account) for one learner, built well enough for a few friends later.
2. **Japanese:** strong A1 vocabulary, weak structure. Priority is survival Japanese for a **May 2027 trip** (24 weeks away), then A1 → B2.
3. **Italian:** strong A2 → conversational B2, using Brazilian Portuguese as an advantage and guarding against interference.
4. **iPhone Safari first.** Mobile-first, offline after first load, progress in IndexedDB with JSON export/import.
5. ~15 minutes per language per day, in a fixed lesson shape (review → input → practice → speak → write), driven by CEFR can-dos and FSRS.
6. All four skills in the browser using free built-in APIs (speech synthesis and recognition), with graceful fallbacks.
7. All content **original**; textbooks and syllabi guide scope only; open datasets with attribution.
8. Fun but kind: XP, streaks with freezes, path of bridges, stamp book and region map, one original mascot. No hearts, no leaderboards.
9. Daily lessons arrive by email from a Claude scheduled task now (I build the schema, import screen, snapshot export and deep links, not the sending), and from a Claude-free GitHub Actions pipeline later.
10. I validate main decisions with you first and never touch personal data, accounts or credentials without asking.

## 2. Decisions needing your OK

### D1 — Framework: Svelte 5 (recommended) vs Preact
| | Svelte 5 | Preact |
|---|---|---|
| Runtime size | Very small, compiled | ~4 KB + hooks/signals |
| Animation | Springs, tweens and transitions built in | Needs a library or hand-written code |
| Styling | Scoped CSS per component built in | Needs a convention or library |
| Ecosystem | Smaller | Larger (React-compatible) |

**Recommendation: Svelte 5 with plain Vite** (not SvelteKit), hash-based routing. The spec asks for spring animations with no animation library and a small bundle; Svelte gives both without extra dependencies. Hash routes (`/#/today/ja`) work on any static host with no redirect tricks.

### D2 — Architecture and data model
- Content is JSON in `/content`, validated by Zod at build time, split per unit and lazy-loaded. One `Lesson` schema serves unit lessons, daily emailed lessons and the Phase B queue.
- Storage: Dexie (IndexedDB) with tables `settings`, `cards` (ts-fsrs state, one per item × direction), `reviewLog`, `lessonProgress` (resumable), `unitProgress`, `xpLog`, `streak`, `importedLessons`, `collections`. Versioned migrations; an automatic export prompt before any migration that could lose data.
- Speech and audio sit behind `AudioProvider` and `SpeechChecker` interfaces with runtime capability detection.
- Dependencies (all MIT/Apache/ISC unless noted): `svelte`, `vite`, `vite-plugin-pwa`, `dexie`, `ts-fsrs`, `zod`, `wanakana`; dev: `vitest`, `@playwright/test`, `eslint`, `prettier`, `typescript`. Datasets as listed in spec section 6, slimmed at build time.

### D3 — Japanese pre-trip shape: 18 Trip units + 6 structure units
The spec lists ~24 Trip units **plus** A1 core units in the same 24 weeks. At 15 minutes a day one unit per week fits, so there are 24 slots.
- **A (recommended):** 18 Trip units + 6 A1 structure units, each structure unit placed right before the Trip units that need it. Fixes your actual gap (structure) while still covering every survival scenario in the spec.
- **B:** 24 Trip units, grammar taught only as phrases inside scenarios. More scenario polish, but you would arrive with memorised phrases and weak ability to vary them.
- **C:** A + 30 minutes on Japanese on weekends, which adds roughly 6 more units of capacity.

### D4 — Visual direction
Open the mockup and switch palettes. My recommendation is **A · Bridge Teal**: it stays distinct from both language accents (vermilion/indigo and terracotta/olive), whereas Sunset Coral collides with both red accents (Pontino's scarf disappears) and Lagoon Blue sits close to Japanese indigo. Mascot, fonts (Nunito + M PLUS Rounded 1c, both SIL OFL) and icons in the mockup are first drafts; the emoji icons will be replaced with a custom set.

### D5 — Hosting and repo
**Recommendation: GitHub Pages from a public repo**, free and simple. A private repo with Pages needs a paid GitHub plan; Cloudflare Pages deploys from a private repo for free. Nothing personal goes into the repo either way, and I will run a personal-data check before the first push.

### D6 — Content volume
Phase 1 content as specified (JA: diagnostic + 4 Trip + 2 A1 units; IT: placement + 3 units). I write **one unit first**, you review it for tone, difficulty and accuracy, then I continue in batches. Later levels are written just ahead of where you are, not all up front.

## 3. Wireframes

See [mockups/phase0.html](mockups/phase0.html). Summary:

| Screen | What's on it |
|---|---|
| **Home** | Language switcher, streak/XP/bridges, Pontino with one line, "Continue" card (always one tap from the next lesson), trip countdown + Ready-for-Japan score (Japanese) or level progress (Italian), daily-goal ring, review shortcut |
| **Learn** | A river with one bridge node per unit; done / current / locked; mastery stars; structure units coloured differently from Trip units; Pontino stands at the current node |
| **Lesson player** | Close button, progress bar, one exercise per screen, speaker button, large tiles or input, sticky Check button, feedback bottom sheet with the answer, a gloss or PT tip, and Continue |
| **Review** | Cards due and time estimate, breakdown by type, 7-day forecast, weak spots |
| **Collections** | Japanese: stamp book and prefecture count. Italian: map of the 20 regions (grid placeholder in the mockup). Badges for both |
| **Profile & settings** | Daily goal, furigana 3-way toggle, voice and speed, speech status, interests, sound, dark mode, export/import, import daily lesson, credits |

Not mocked yet: onboarding, placement/diagnostic, phrasebook, Atlas entry, import-lesson screen.

## 4. Risks and honest limits

| # | Risk | Impact | Plan |
|---|---|---|---|
| R1 | **Speech recognition is not on-device.** On iPhone, Safari sends audio to Apple for recognition; Chrome sends it to Google | Conflicts with "no data leaves the device" | Speech checking **off by default**, with a plain explanation when you enable it. Record-and-compare fallback is fully local |
| R2 | **Safari tab and Home Screen app keep separate storage on iOS**, and recognition may not work in the Home Screen app | You must pick one "home" for your progress | Recommend the Home Screen app as the main one (offline, storage not evicted, push later) with record-and-compare speaking; test recognition on your iPhone in week 1 of Phase 1 and decide with real results |
| R3 | Safari can delete site data after ~7 days without a visit for sites not on the Home Screen | Lost progress | Home Screen install guide, request persistent storage, export reminder every 2 weeks |
| R4 | iOS text-to-speech voice quality varies; better voices need a one-time download in iOS Settings | Listening quality | Voice picker, a setup tip, `AudioProvider` so recorded audio can replace TTS later |
| R5 | `navigator.vibrate` does not exist on iOS Safari | No haptics on your phone | Feature-detect; rely on animation and sound |
| R6 | I can write wrong or unnatural Japanese/Italian, and wrong facts | Learning errors | `factCheck` flags, validation script, cross-checks against JMdict, your review per batch. A native-speaker spot check before the trip would be worth arranging |
| R7 | **B2 Japanese is not reachable at 15 min/day** (see the time budget in the curriculum) | Expectation gap | Survival by May is realistic; beyond A2 the app pushes outside input and longer sessions |
| R8 | Content volume: ~120 units in total | Months of writing | Just-in-time batches; detailed content only for the next few weeks |
| R9 | Dataset size (JMdict, KanjiVG) vs offline cache | Slow first load | Bundle only entries that the content references |
| R10 | Share-alike licences (JMdict, KanjiVG, Wiktionary) | Obligations if the repo is public | Keep derived data files separate, attributed and under the same licence; documented in `LICENSES.md` |

## 5. Questions for you

1. **Trip dates and itinerary.** Exact dates if known (does it touch 29 Apr – 5 May, Golden Week?), and cities. Default: Tokyo, Kyoto, Osaka.
2. **D3:** A, B or C?
3. **D4:** which palette? Anything about Pontino you want changed?
4. **D1 and D2:** OK with Svelte 5 and the data model?
5. **D5:** public GitHub repo + GitHub Pages, or private repo + Cloudflare Pages? Do you have a GitHub account ready?
6. **Which phone "home"** do you prefer to start with: Home Screen app or Safari tab (R2)?
7. **Diet or allergies** to build into the restaurant units?
8. **Sports specifics:** which teams and sports should flavour the examples (football club, F1, baseball, sumo…)?
9. **Italian start:** begin with the placement test as planned, or do you already know which topics in the A2 review you can skip?
10. **Git:** may I initialise a local Git repository in this folder now (nothing is pushed anywhere)?

## Decisions log

| Date | Decision |
|---|---|
| 2026-11-16 | **Itinerary:** none fixed. Trip Mode and the Atlas are written for any Japan trip. Tokyo, Kyoto and Osaka appear only as the most common first-trip examples; the Atlas is organised by the 8 regions and 47 prefectures. The trip date is an optional setting; the countdown and Golden Week note show only if a date is set. |
| 2026-11-16 | **D3 approved:** 18 Trip units + 6 A1 structure units before May 2027. |
| 2026-11-16 | **Git:** local repository initialised. Nothing pushed. Commits use a neutral placeholder identity set for this folder only. |
| 2026-11-16 | **D1 approved:** Svelte 5 + plain Vite, hash routing. |
| 2026-11-16 | **D4 approved:** palette A, Bridge Teal. |
| 2026-11-16 | **D5 approved:** GitHub Pages from a public repo. A personal-data check and your explicit go-ahead come before the first push. |
| 2026-11-16 | **Fonts:** Nunito bundled locally (SIL OFL). Japanese text uses the phone's own rounded Japanese font for now; bundling M PLUS Rounded 1c is deferred because of its size. |
| 2026-11-16 | **Romaji:** shown under kana as a reading aid, on by default, switchable off in Profile. This replaces the spec's "romaji only in the kana bootcamp". The particle は is marked in content as `{は|wa}` so its romaji matches how it is said. |
| 2026-11-16 | **Dev tools added:** vite-plugin-pwa (MIT), sharp (Apache-2.0, icon rendering only), @playwright/test (Apache-2.0), @types/node (MIT). TypeScript pinned to 6 for svelte-check. |
| 2026-11-16 | **Imagery and humour:** only original art drawn in code (Pontino, character portraits, confetti, two-caption "Pontino memes" with our own captions) and emoji rendered by the device. No third-party images, so nothing to license. Real internet memes are not used because their images are copyrighted. |
| 2026-11-16 | **Sound:** effects are synthesised in the browser (no audio files). Speech plays automatically; iOS allows this only after the first tap in a session. |
| 2026-11-16 | **Published:** public repo fewatanabe90-bit/pontino, GitHub Pages via Actions. SPEC.md kept local only. |
| 2026-11-16 | **Direction:** every sentence must be something you would really say (see CONTENT_GUIDE.md); units are built around situations; interests personalise decks and settings. "Real-life missions" were proposed and **declined**. |
| 2026-11-16 | **Voices:** still the device's text-to-speech, now choosing the most natural voice, one per speaker, with turn-taking pauses and a 0.9 default speed. Pre-generated neural audio and licensed photos are proposals awaiting a decision. |
| 2026-11-16 | **Mistakes:** a wrong answer no longer returns inside the lesson; it is stored and practised from Review → Mistakes. Storage gained a `mistakes` table (additive, no data migrated). |
| 2026-11-16 | **Typing:** Japanese typed answers are hiragana-typable vocabulary only; names and katakana words go in tiles or multiple choice. Enforced by the validator. |

## 6. Next step once you answer

Phase 1 setup: scaffold the app, design tokens and Pontino from the approved palette, storage and SRS core with tests, then the lesson player with the first Japanese unit as the review sample.
