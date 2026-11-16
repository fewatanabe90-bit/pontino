# Pontino content guide

Rules for every lesson, deck and daily lesson, whoever writes it (a person, Claude, or a script).

## The one test: "Would I actually say this?"

Pontino exists because textbook sentences like "the spider is on the table" teach grammar nobody uses. Every sentence in the app must pass all three checks:

1. **Real.** A native speaker could say or hear it this week, in a situation the learner will plausibly be in.
2. **Useful.** The learner can reuse it, whole or with one word swapped, outside the app.
3. **Placed.** It belongs to a scene with people who have a reason to talk: a hostel lounge, a ticket gate, a bar on Monday morning. No isolated sentences about objects on furniture.

If a sentence only exists to show a grammar point, rewrite it until it also says something worth saying.

| Avoid | Write instead | Why |
|---|---|---|
| The cat is under the chair. | この{傘|かさ}{は|wa}だれのですか。 (Whose umbrella is this?) | Same grammar, a thing people ask |
| The boy eats an apple. | Ho fatto tardi al lavoro. (I worked late.) | Same tense, an everyday excuse |
| I am a penguin. | {会社員|かいしゃいん}です。 (I'm an office worker.) | What you say when introduced |

## Structure of a lesson

- **A scene, not a list.** Start from a situation and a small goal ("find out whose umbrella it is"). The dialogue is 4–6 short lines.
- **One idea per lesson**, taught through that scene, then practised in new but equally real sentences.
- **A can-do** the learner could go and do today.
- **Notes** explain the idea in two or three sentences, with one example. Italian lessons carry a `🇧🇷 PT tip` note that names the specific Brazilian-speaker mistake.
- **Exercises** (at least six, mixed types) reuse the scene's people and things. Wrong options should be mistakes a real learner makes, such as the Portuguese-looking form, not nonsense.
- **A meme and scene art** are optional. Humour is welcome when it helps the point stick; it never mocks the learner or a nationality.

## Personalisation

The learner's interests are travel, sports, politics, history and geography. Use them as the *setting* for core language: numbers through match scores, directions on a real city map, the past tense through last night's game. Politics content describes institutions and procedures only and takes no side.

## Language rules

- Natural, contemporary language. Japanese: mark the politeness of every dialogue line; default to です/ます. Italian: standard Italian; flag regional words.
- Stay inside what has been taught plus the new items; gloss anything else.
- Furigana on every kanji: `{漢字|かんじ}`. Mark the particle は as `{は|wa}` and the particle へ as `{へ|e}` so the romaji matches the sound.
- List every acceptable answer in `alt` for typed and tile exercises.
- **Typing in Japanese is hiragana only.** A typed answer is ordinary vocabulary the learner can enter with the hiragana keyboard. Never ask the learner to type a person's name, a place name or a katakana word; use tiles or multiple choice for those. The validator rejects katakana in a typed answer.
- Facts (history, geography, sport) must be true or clearly invented for the scene; record anything a human should verify in `factCheck`.

## Rights

Everything is original: text, jokes, artwork, sounds. Never copy or paraphrase textbook dialogues, news articles, song lyrics or internet memes. Emoji come from the device font. Third-party data may be added only if its licence allows it, with credit on the Credits screen and in `LICENSES.md`.

## Before you commit

```bash
npm test
```

```bash
npm run e2e
```

`npm test` validates the schema, ids, answers and tiles. `npm run e2e` plays every lesson to the end.
