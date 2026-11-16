import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from 'ts-fsrs';
import type { Lang } from './normalise';

export { Rating };
export type { Grade };

export interface SrsCard {
  /** `${itemId}:${direction}` */
  id: string;
  itemId: string;
  lang: Lang;
  unitId: string;
  front: string;
  back: string;
  note?: string;
  /** Milliseconds, duplicated from `fsrs.due` so it can be indexed. */
  due: number;
  fsrs: Card;
}

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

export function newCard(
  base: Pick<SrsCard, 'itemId' | 'lang' | 'unitId' | 'front' | 'back' | 'note'>,
  now: Date = new Date(),
): SrsCard {
  const card = createEmptyCard(now);
  return { ...base, id: `${base.itemId}:recognise`, due: card.due.getTime(), fsrs: card };
}

export function rate(card: SrsCard, grade: Grade, now: Date = new Date()): SrsCard {
  const next = scheduler.next(card.fsrs, now, grade).card;
  return { ...card, fsrs: next, due: next.due.getTime() };
}

export const isDue = (card: SrsCard, now: Date = new Date()): boolean => card.due <= now.getTime();
