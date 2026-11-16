# Pontino — how the learning is designed

This note records the research ideas behind the app and exactly where each one shows up, so design choices can be checked against a reason. It summarises well-established findings from memory of the literature; it was not compiled from a fresh literature search, and page-level citations still need to be added and verified.

## Principles and where they live in the app

| Idea | Source | What it says | In Pontino |
|---|---|---|---|
| **Comprehensible input** | Krashen | We acquire language we mostly understand, slightly above our level | Dialogues use known words plus a few new items; every line has a translation, furigana and optional romaji |
| **Four strands** | Nation | Balance input, output, deliberate study and fluency practice | Dialogue (input) → notes (study) → tiles and typing (output) → review and flashcards (fluency) |
| **Retrieval practice** | Roediger & Karpicke | Recalling strengthens memory more than re-reading | Every exercise makes you produce or choose before showing the answer; missed items return in the same lesson |
| **Spacing** | Ebbinghaus; FSRS algorithm | Reviews spread over time beat cramming | Review queue scheduled by FSRS; flashcards join it as they are learned |
| **Dual coding and the picture effect** | Paivio; Nelson | Words tied to an image are remembered better than words alone | Each dialogue happens in an illustrated place with visible speakers. Planned: pictures on vocabulary cards |
| **Multimedia principles** | Mayer | People learn better from words and pictures together, when extras are removed (coherence), key parts are highlighted (signalling), words sit next to what they describe (contiguity), and material comes in learner-paced pieces (segmenting) | The speaker and their line light up as they talk; upcoming lines stay faded; one exercise per screen; no decorative clutter in exercises |
| **Personalisation and voice** | Mayer | Conversational style and a human-sounding voice help | Scenes are conversations between recurring people; one voice per speaker, turn-taking pauses, a natural default speed |
| **Situated, task-based learning** | Long; Ellis | Language sticks when it is used to get something done in a real situation | Units are built around situations (meeting people, match day, the konbini), not grammar lists. See `CONTENT_GUIDE.md` |
| **Contrastive awareness** | Lado; later transfer research | A learner's first language predicts specific errors | 🇧🇷 PT tips and wrong options built from real Brazilian-speaker mistakes; the false-friends deck |
| **Interest and motivation** | Self-determination theory (Deci & Ryan); Hidi & Renninger on interest | Choice and personal relevance sustain effort | Interests picker; topics you chose are offered first and set the scene for core lessons |
| **Kind gamification** | Research on streaks and loss aversion is mixed | Rewards help habit; punishment and guilt backfire | XP, streak with freezes, no hearts, no guilt messages |

## What visuals are for

Pictures earn their place when they carry meaning: who is speaking, where, about what. They hurt when they are decoration competing for attention. So:

- Scene art is tied to the dialogue's setting and its speakers, and it reacts to the audio.
- Exercises stay visually quiet.
- Emoji are used as small labels, not as the main illustration.

## Honest limits

- The voices are the phone's own text-to-speech. They are clearer with Apple's free Enhanced or Premium voices, but still synthetic. Recorded or neural-generated audio is the real fix and is a planned, optional upgrade.
- The illustrations are simple drawings made in code. Photographs of real signs, menus and stations would serve "reading the real world" better; adding them needs properly licensed images and credits.
- No native speaker has reviewed the content yet.
