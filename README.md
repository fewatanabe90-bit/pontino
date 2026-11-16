# Pontino

A personal, free, ad-free web app for learning Japanese and Italian. "Pontino" is Italian for "little bridge".

Live at https://fewatanabe90-bit.github.io/pontino/

Status: **Phase 1 in progress.** See [docs/PHASE0_PLAN.md](docs/PHASE0_PLAN.md) for the plan and decisions log, and `SPEC.md` (kept locally, not published) for the original brief.

## Run it on your computer

```bash
npm install
```

```bash
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

## Other commands

| Command | What it does |
|---|---|
| `npm test` | Unit tests (answer checking, streak, spaced repetition, backup) and content validation |
| `npm run validate:content` | Content validation only |
| `npm run check` | Type-check |
| `npm run e2e` | End-to-end tests on the production build (install, offline, romaji). Set `PW_CHANNEL=msedge` to use the Edge already installed |
| `npm run build` | Validate content, then build the static site into `dist/` |

## Where things are

- `content/` — lessons as JSON. `catalog.json` lists units in path order; a unit with a `file` is written, the rest show as "coming soon".
- `src/lib/` — logic with no UI: answer checking, normalisation, streak, spaced repetition (FSRS), storage, schemas.
- `src/exercises/` — one component per exercise family.
- `src/features/` — screens.
- `content/<lang>/decks/` — vocabulary flashcard decks.
- `docs/` — plan, curriculum maps, mockups, and the content guide (read it before writing lessons).

## Your progress

Progress lives only in the browser you use (IndexedDB). Profile → Export saves a backup file; Restore replaces everything on the device with a backup.

## What exists so far

- App shell with Home, Learn, Review, Profile; light and dark themes; Japanese and Italian looks.
- Lesson player with multiple choice, listen-and-choose, fill the gap, sentence tiles, typed answers and match pairs. A lesson always finishes: missed exercises are saved under Review → Mistakes and leave the list once answered right. A lesson resumes where you left it. Typed Japanese answers are hiragana-only vocabulary, never names.
- Review queue scheduled by FSRS, XP, streak with freezes, backup export/restore.
- Japanese unit A1-01 (5 lessons) and Italian unit R1 (3 lessons on the passato prossimo, with Portuguese tips).
- Audio that plays by itself (dialogue at lesson start, each exercise, the model answer), plus synthesised sounds for right, wrong and lesson complete. Both can be switched off in Profile.
- Original artwork only: character portraits, scene banners built from device emoji, confetti, Pontino one-liners and Pontino "memes". No third-party images.
- Installable and offline: web app manifest, icons, service worker that caches code, lessons and fonts, an update prompt, and an Add to Home Screen guide on iPhone.
- Romaji under kana as a reading aid (Profile → Romaji under kana), with furigana over kanji.
- Interests picker (travel, sports, history, geography, politics): matching decks and units are offered first.
- Dialogues play as conversations in illustrated scenes: one voice per speaker, pauses between turns, the speaker lights up. Voice picker in Profile; robotic novelty voices are never auto-selected.
- Japanese unit "Match day" (3 lessons on polite verbs and particles) and sports decks in both languages.
- Real photos of Japanese signs on the Signs deck (Wikimedia Commons, open licences, credited in the app and in docs/LICENSES.md).
- Flashcard decks: flip cards for vocabulary (130 cards in seven decks), which join the review queue as you learn them.
- Deployed to GitHub Pages on every push to main.

## Not built yet

Speaking exercises, diagnostic and placement tests, unit reviews, all other units, collections, trip countdown, daily-lesson import, deployment.
