import Dexie, { type Table } from 'dexie';
import type { Lang } from './normalise';
import type { SrsCard } from './srs';

export interface LessonProgress {
  /** Lesson id. */
  id: string;
  unitId: string;
  lang: Lang;
  status: 'started' | 'done';
  /** Index of the next exercise, for resuming. */
  step: number;
  completedAt?: number;
  /** Share of exercises right at the first attempt, 0–1. */
  score?: number;
}

export interface KV {
  key: string;
  value: unknown;
}

class PontinoDB extends Dexie {
  kv!: Table<KV, string>;
  cards!: Table<SrsCard, string>;
  lessons!: Table<LessonProgress, string>;

  constructor() {
    super('pontino');
    this.version(1).stores({
      kv: 'key',
      cards: 'id, itemId, [lang+due]',
      lessons: 'id, unitId, lang',
    });
  }
}

export const db = new PontinoDB();

export const BACKUP_FORMAT = 'pontino-backup';

export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: 1;
  exportedAt: string;
  kv: KV[];
  cards: SrsCard[];
  lessons: LessonProgress[];
}

export async function exportAll(): Promise<Backup> {
  const [kv, cards, lessons] = await Promise.all([db.kv.toArray(), db.cards.toArray(), db.lessons.toArray()]);
  return { format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(), kv, cards, lessons };
}

/** Parse a backup, restoring the dates JSON turned into strings. Throws if it is not a Pontino backup. */
export function parseBackup(data: unknown): Backup {
  const b = data as Partial<Backup> | null;
  if (
    !b ||
    b.format !== BACKUP_FORMAT ||
    b.version !== 1 ||
    !Array.isArray(b.kv) ||
    !Array.isArray(b.cards) ||
    !Array.isArray(b.lessons)
  ) {
    throw new Error('This file is not a Pontino backup.');
  }
  const cards = b.cards.map((c) => ({
    ...c,
    fsrs: {
      ...c.fsrs,
      due: new Date(c.fsrs.due),
      last_review: c.fsrs.last_review ? new Date(c.fsrs.last_review) : undefined,
    },
  }));
  return { ...(b as Backup), cards };
}

/** Replace everything with the backup. Nothing is touched if the file is invalid. */
export async function importAll(data: unknown): Promise<void> {
  const b = parseBackup(data);
  await db.transaction('rw', db.kv, db.cards, db.lessons, async () => {
    await Promise.all([db.kv.clear(), db.cards.clear(), db.lessons.clear()]);
    await Promise.all([db.kv.bulkPut(b.kv), db.cards.bulkPut(b.cards), db.lessons.bulkPut(b.lessons)]);
  });
}
