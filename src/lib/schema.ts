import { z } from 'zod';
import { INTEREST_IDS } from './interests';

export const LangSchema = z.enum(['ja', 'it']);
export const InterestSchema = z.enum(INTEREST_IDS);
export const PolitenessSchema = z.enum(['plain', 'polite', 'keigo']);

export const ItemSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['vocab', 'kanji', 'grammar', 'phrase']),
  /** Target language, may contain `{漢字|かんじ}` furigana markup. */
  front: z.string().min(1),
  /** English meaning or explanation. */
  back: z.string().min(1),
  note: z.string().optional(),
  /** Brazilian Portuguese note (Italian course). */
  pt: z.string().optional(),
});

const base = {
  id: z.string().min(1),
  prompt: z.string().min(1),
  /** Shown in the feedback sheet after answering. */
  explain: z.string().optional(),
};

export const ExerciseSchema = z.discriminatedUnion('type', [
  z.object({
    ...base,
    type: z.literal('mcq'),
    /** Target-language stimulus. With `listen: true` it is spoken and hidden until answered. */
    text: z.string().optional(),
    listen: z.boolean().optional(),
    options: z.array(z.string()).min(2),
    answer: z.number().int().nonnegative(),
  }),
  z.object({
    ...base,
    type: z.literal('gap'),
    /** Sentence with `___` where the answer goes. */
    text: z.string().includes('___'),
    meaning: z.string().optional(),
    options: z.array(z.string()).min(2),
    answer: z.number().int().nonnegative(),
  }),
  z.object({
    ...base,
    type: z.literal('tiles'),
    /** A line the learner is replying to, if any. */
    context: z.string().optional(),
    meaning: z.string(),
    tiles: z.array(z.string()).min(2),
    answer: z.string().min(1),
    alt: z.array(z.string()),
  }),
  z.object({
    ...base,
    type: z.literal('type'),
    text: z.string().optional(),
    /** Dictation: `text` is spoken, not shown. */
    listen: z.boolean().optional(),
    answer: z.string().min(1),
    alt: z.array(z.string()),
  }),
  z.object({
    ...base,
    type: z.literal('match'),
    pairs: z.array(z.tuple([z.string(), z.string()])).min(3),
  }),
]);

export const LessonSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  canDo: z.string().min(1),
  intro: z.object({
    /** Which illustrated scene the dialogue happens in. */
    place: z.enum(['lounge', 'station', 'stadium', 'cafe', 'train']).optional(),
    /** A few emoji that set the scene; shown as a banner when there is no `place`. */
    art: z.string().optional(),
    scene: z.string(),
    lines: z.array(
      z.object({ who: z.string(), text: z.string(), meaning: z.string(), politeness: PolitenessSchema.optional() }),
    ),
    notes: z.array(z.object({ title: z.string(), body: z.string() })),
  }),
  /**
   * A book-style lesson: a short text to read, or a story to listen to, followed by
   * comprehension questions written in the target language.
   */
  passage: z
    .object({
      kind: z.enum(['reading', 'listening']),
      /** One entry per sentence. `who` gives a line of speech to that character's voice. */
      sentences: z.array(z.object({ text: z.string().min(1), meaning: z.string().min(1), who: z.string().optional() })).min(4),
      /** Listening only: `hint` lets the learner open the text before answering; `after` shows it only at the end. */
      transcript: z.enum(['hint', 'after']).optional(),
      /** Words worth knowing before starting. */
      glossary: z.array(z.object({ word: z.string().min(1), meaning: z.string().min(1) })).optional(),
    })
    .optional(),
  exercises: z.array(ExerciseSchema).min(6),
  /** An original two-caption joke shown when the lesson is finished. */
  meme: z.object({ top: z.string(), bottom: z.string() }).optional(),
  /** Items that become SRS cards when the lesson is finished. */
  newItems: z.array(z.string()),
});

export const UnitSchema = z.object({
  id: z.string().min(1),
  lang: LangSchema,
  level: z.enum(['A1', 'A2', 'B1', 'B2']),
  track: z.enum(['core', 'trip']),
  title: z.string(),
  summary: z.string(),
  canDo: z.array(z.string()).min(2).max(4),
  grammar: z.array(z.string()),
  items: z.array(ItemSchema),
  lessons: z.array(LessonSchema).min(1),
  /** Things a human should verify. */
  factCheck: z.array(z.string()).optional(),
});

export const DeckSchema = z.object({
  id: z.string().min(1),
  lang: LangSchema,
  icon: z.string(),
  /** Interests this deck speaks to; matching decks are offered first. */
  tags: z.array(InterestSchema).optional(),
  title: z.string().min(1),
  description: z.string(),
  cards: z
    .array(
      z.object({
        id: z.string().min(1),
        front: z.string().min(1),
        back: z.string().min(1),
        note: z.string().optional(),
        pt: z.string().optional(),
        /** A photo under /public, credited in content/credits/photos.json. */
        image: z.string().optional(),
      }),
    )
    .min(5),
});

export const PhotoCreditSchema = z.object({
  file: z.string(),
  card: z.string(),
  title: z.string(),
  author: z.string().min(1),
  /** Only licences that allow reuse with credit. */
  licence: z.string().regex(/^(CC0|Public domain|CC BY(-SA)? \d\.\d)/),
  licenceUrl: z.string(),
  source: z.string().url(),
  changes: z.string(),
});

export const CatalogSchema = z.array(
  z.object({
    id: z.string(),
    lang: LangSchema,
    title: z.string(),
    sub: z.string(),
    track: z.enum(['core', 'trip']),
    icon: z.string(),
    tags: z.array(InterestSchema).optional(),
    /** Path under /content, without extension, once the unit is written. */
    file: z.string().optional(),
  }),
);

export type Item = z.infer<typeof ItemSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Unit = z.infer<typeof UnitSchema>;
export type PhotoCredit = z.infer<typeof PhotoCreditSchema>;
export type Deck = z.infer<typeof DeckSchema>;
export type Catalog = z.infer<typeof CatalogSchema>;
