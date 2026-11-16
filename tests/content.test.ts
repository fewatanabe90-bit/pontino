/**
 * Content validation. Run with `npm run validate:content`.
 * Checks schema, duplicate IDs, unknown item references, answer indexes,
 * tile answers that cannot be built, and catalog ↔ file consistency.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { canBuild } from '../src/lib/check';
import { existsSync } from 'node:fs';
import { CatalogSchema, DeckSchema, PhotoCreditSchema, UnitSchema, type Unit } from '../src/lib/schema';

const ROOT = join(__dirname, '..', 'content');

function unitFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return unitFiles(p);
    return /^unit-.*\.json$/.test(name) ? [p] : [];
  });
}

const read = (p: string): unknown => JSON.parse(readFileSync(p, 'utf8'));
const files = unitFiles(ROOT);
const catalog = CatalogSchema.parse(read(join(ROOT, 'catalog.json')));

export function unitProblems(unit: Unit): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  const once = (id: string) => {
    if (seen.has(id)) problems.push(`duplicate id: ${id}`);
    seen.add(id);
  };
  const itemIds = new Set(unit.items.map((i) => i.id));
  unit.items.forEach((i) => once(i.id));

  for (const lesson of unit.lessons) {
    once(lesson.id);
    for (const id of lesson.newItems) if (!itemIds.has(id)) problems.push(`${lesson.id}: unknown item ${id}`);
    for (const ex of lesson.exercises) {
      once(ex.id);
      if ((ex.type === 'mcq' || ex.type === 'gap') && ex.answer >= ex.options.length) {
        problems.push(`${ex.id}: answer index out of range`);
      }
      if ((ex.type === 'mcq' || ex.type === 'gap') && new Set(ex.options).size !== ex.options.length) {
        problems.push(`${ex.id}: repeated option`);
      }
      if (ex.type === 'mcq' && ex.listen && !ex.text) problems.push(`${ex.id}: listening exercise without audio text`);
      if (ex.type === 'type' && ex.listen && !ex.text) problems.push(`${ex.id}: dictation without audio text`);
      if (unit.lang === 'ja' && ex.type === 'type' && /[\u30a1-\u30fa]/.test(ex.answer)) {
        problems.push(`${ex.id}: typed answers must be typable in hiragana (no katakana words or names)`);
      }
      if (ex.type === 'match') {
        for (const side of [0, 1] as const) {
          if (new Set(ex.pairs.map((p) => p[side])).size !== ex.pairs.length) problems.push(`${ex.id}: repeated match item`);
        }
      }
      if (ex.type === 'tiles' && !canBuild(ex.answer, ex.tiles, unit.lang)) {
        problems.push(`${ex.id}: answer cannot be built from the tiles`);
      }
    }
  }
  const taught = new Set(unit.lessons.flatMap((l) => l.newItems));
  for (const id of itemIds) if (!taught.has(id)) problems.push(`item never taught in a lesson: ${id}`);
  return problems;
}

function deckFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return deckFiles(p);
    return /^deck-.*\.json$/.test(name) ? [p] : [];
  });
}

describe('decks', () => {
  const all = deckFiles(ROOT).map((f) => ({ rel: relative(ROOT, f).replace(/\\/g, '/'), deck: DeckSchema.parse(read(f)) }));

  it('exist for both languages', () => {
    expect(all.some((d) => d.deck.lang === 'ja')).toBe(true);
    expect(all.some((d) => d.deck.lang === 'it')).toBe(true);
  });

  it('have unique ids, sit in their language folder, and never repeat a card', () => {
    expect(new Set(all.map((d) => d.deck.id)).size).toBe(all.length);
    const cardIds = all.flatMap((d) => d.deck.cards.map((c) => c.id));
    expect(new Set(cardIds).size).toBe(cardIds.length);
    for (const { rel, deck } of all) {
      expect(rel.startsWith(`${deck.lang}/decks/`), rel).toBe(true);
      expect(deck.cards.every((c) => c.id.startsWith(`${deck.id}.`)), `${deck.id}: card ids must start with the deck id`).toBe(true);
      expect(new Set(deck.cards.map((c) => c.front)).size, `${deck.id}: repeated front`).toBe(deck.cards.length);
    }
  });
});

describe('photos', () => {
  const credits = PhotoCreditSchema.array().parse(read(join(ROOT, 'credits', 'photos.json')));
  const used = deckFiles(ROOT).flatMap((f) => DeckSchema.parse(read(f)).cards.flatMap((c) => (c.image ? [c.image] : [])));

  it('every photo on a card exists and has a credit with an open licence', () => {
    expect(used.length).toBeGreaterThan(0);
    for (const file of used) {
      expect(existsSync(join(ROOT, '..', 'public', file)), `missing file ${file}`).toBe(true);
      expect(credits.some((c) => c.file === file), `no credit for ${file}`).toBe(true);
    }
  });

  it('no credit is left without its photo', () => {
    for (const c of credits) expect(used, `unused credit ${c.file}`).toContain(c.file);
  });
});

describe('content', () => {
  it('has at least one unit file', () => expect(files.length).toBeGreaterThan(0));

  it.each(files.map((f) => [relative(ROOT, f).replace(/\\/g, '/'), f]))('%s is valid', (rel, file) => {
    const unit = UnitSchema.parse(read(file));
    expect(unitProblems(unit)).toEqual([]);
    const entry = catalog.find((c) => c.id === unit.id);
    expect(entry, `unit ${unit.id} missing from catalog.json`).toBeDefined();
    expect(entry!.file).toBe(rel.replace(/\.json$/, ''));
    expect(entry!.lang).toBe(unit.lang);
  });

  it('catalog has unique ids and only points at files that exist', () => {
    expect(new Set(catalog.map((c) => c.id)).size).toBe(catalog.length);
    const rels = new Set(files.map((f) => relative(ROOT, f).replace(/\\/g, '/').replace(/\.json$/, '')));
    for (const c of catalog) if (c.file) expect(rels.has(c.file), `${c.id} → ${c.file}`).toBe(true);
  });
});
