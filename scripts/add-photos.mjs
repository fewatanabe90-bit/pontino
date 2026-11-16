// Adds chosen Wikimedia Commons photos to the "Signs" deck, with credits.
//   node scripts/add-photos.mjs <dir with candidates.json from find-photos.mjs>
// Each pick was looked at by a person (or Claude) on the contact sheet before being listed here.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const dir = process.argv[2];
const candidates = JSON.parse(readFileSync(join(dir, 'candidates.json'), 'utf8'));

/** candidate key → [card number in ja-deck-signs, crop focus] */
const CHOSEN = {
  '01-1': ['01', 'centre'],
  '03-2': ['03', 'north'],
  '04-1': ['04', 'centre'],
  '07-2': ['07', 'centre'],
  '08-3': ['08', 'centre'],
  '11-1': ['11', 'centre'],
  '12-3': ['12', 'north'],
  '13-4': ['13', 'southwest'],
  '16-2': ['16', 'centre'],
  '17-3': ['17', 'north'],
};
const UA = { 'User-Agent': 'language-learning-app-photo-finder/1.0 (personal, non-commercial)' };

mkdirSync('public/photos', { recursive: true });
const deckFile = 'content/ja/decks/deck-signs.json';
const deck = JSON.parse(readFileSync(deckFile, 'utf8'));
const credits = [];

for (const [key, [num, focus]] of Object.entries(CHOSEN)) {
  const c = candidates.find((x) => x.key === key);
  if (!c) throw new Error(`candidate ${key} not found`);
  const id = `${deck.id}.${num}`;
  const file = `photos/${id}.jpg`;
  const big = c.thumb.replace(/\/\d+px-/, '/960px-');
  let res = await fetch(big, { headers: UA });
  if (!res.ok) res = await fetch(c.thumb, { headers: UA });
  await sharp(Buffer.from(await res.arrayBuffer()))
    .resize(640, 400, { fit: 'cover', position: focus })
    .jpeg({ quality: 74, mozjpeg: true })
    .toFile(join('public', file));
  const card = deck.cards.find((x) => x.id === id);
  if (!card) throw new Error(`card ${id} not found`);
  card.image = file;
  credits.push({
    file,
    card: id,
    title: c.title.replace(/^File:/, ''),
    author: c.artist,
    licence: c.licence,
    licenceUrl: c.licenceUrl,
    source: c.page,
    changes: 'Resized and cropped',
  });
  console.log(id, c.licence, '·', c.artist.slice(0, 40));
}

writeFileSync(deckFile, JSON.stringify(deck, null, 2) + '\n');
mkdirSync('content/credits', { recursive: true });
writeFileSync('content/credits/photos.json', JSON.stringify(credits, null, 2) + '\n');
