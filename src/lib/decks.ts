import creditsJson from '../../content/credits/photos.json';
import type { Deck, PhotoCredit } from './schema';

export const photoCredits = creditsJson as PhotoCredit[];
export const creditFor = (file: string | undefined): PhotoCredit | undefined => photoCredits.find((c) => c.file === file);

/** Vocabulary decks are small, so they ship with the app instead of loading on demand. */
const files = import.meta.glob<{ default: Deck }>('../../content/*/decks/deck-*.json', { eager: true });

export const decks: Deck[] = Object.values(files)
  .map((m) => m.default)
  .sort((a, b) => a.id.localeCompare(b.id));

export const deckById = (id: string): Deck | undefined => decks.find((d) => d.id === id);

/** How many flashcards a study session introduces at most. */
export const SESSION_SIZE = 10;
