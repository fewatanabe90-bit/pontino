/**
 * Content validation. Run with `npm run validate:content`.
 * Checks schema, duplicate IDs, unknown item references, answer indexes,
 * tile answers that cannot be built, and catalog ↔ file consistency.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { canBuild } from '../src/lib/check';
import { CatalogSchema, UnitSchema, type Unit } from '../src/lib/schema';

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
      if (ex.type === 'tiles' && !canBuild(ex.answer, ex.tiles, unit.lang)) {
        problems.push(`${ex.id}: answer cannot be built from the tiles`);
      }
    }
  }
  const taught = new Set(unit.lessons.flatMap((l) => l.newItems));
  for (const id of itemIds) if (!taught.has(id)) problems.push(`item never taught in a lesson: ${id}`);
  return problems;
}

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
