import catalogJson from '../../content/catalog.json';
import type { Catalog, Unit } from './schema';

/** Content is validated at build time (`npm run validate:content`), so it is trusted here. */
export const catalog = catalogJson as Catalog;

const loaders = import.meta.glob<{ default: Unit }>('../../content/{ja,it}/**/unit-*.json');

export async function loadUnit(file: string): Promise<Unit> {
  const load = loaders[`../../content/${file}.json`];
  if (!load) throw new Error(`Unit file not found: ${file}`);
  return (await load()).default;
}

export const unitEntry = (id: string) => catalog.find((u) => u.id === id);
