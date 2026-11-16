import type { Deck } from './schema';

/** Vocabulary decks are small, so they ship with the app instead of loading on demand. */
const files = import.meta.glob<{ default: Deck }>('../../content/*/decks/deck-*.json', { eager: true });

export const decks: Deck[] = Object.values(files)
  .map((m) => m.default)
  .sort((a, b) => a.id.localeCompare(b.id));

export const deckById = (id: string): Deck | undefined => decks.find((d) => d.id === id);

/** How many flashcards a study session introduces at most. */
export const SESSION_SIZE = 10;
