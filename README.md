# Pontino

A personal, free, ad-free web app for learning Japanese and Italian. "Pontino" is Italian for "little bridge".

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
- `docs/` — plan, curriculum maps, mockups.

## Your progress

Progress lives only in the browser you use (IndexedDB). Profile → Export saves a backup file; Restore replaces everything on the device with a backup.

## What exists so far

- App shell with Home, Learn, Review, Profile; light and dark themes; Japanese and Italian looks.
- Lesson player with multiple choice, listen-and-choose, fill the gap, sentence tiles, typed answers and match pairs. Missed exercises come back at the end. A lesson resumes where you left it.
- Review queue scheduled by FSRS, XP, streak with freezes, backup export/restore.
- Japanese unit A1-01, lessons 1–2, as a sample for review.
- Installable and offline: web app manifest, icons, service worker that caches code, lessons and fonts, an update prompt, and an Add to Home Screen guide on iPhone.
- Romaji under kana as a reading aid (Profile → Romaji under kana), with furigana over kanji.
- A GitHub Pages deploy workflow, ready but not yet used.

## Not built yet

Speaking exercises, diagnostic and placement tests, the remaining lessons of A1-01 and all other units, Italian content, collections, trip countdown, daily-lesson import, deployment.
