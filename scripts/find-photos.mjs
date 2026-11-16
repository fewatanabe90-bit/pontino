// Finds openly licensed photo candidates on Wikimedia Commons for flashcards and builds a
// contact sheet to choose from. Nothing is added to the app by this script.
//   node scripts/find-photos.mjs <out-dir>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const out = process.argv[2];
mkdirSync(out, { recursive: true });

/** Card id suffix → search terms. */
const WANT = {
  '01 入口': '入口 sign Japan',
  '02 出口': '出口 sign Japan station',
  '03 駅': 'Japan railway station name sign 駅',
  '04 お手洗い': 'お手洗い sign',
  '07 営業中': '営業中',
  '08 準備中': '準備中',
  '09 禁煙': '禁煙 sign',
  '10 非常口': '非常口 sign',
  '11 改札': '改札口 station Japan',
  '12 切符': 'きっぷうりば ticket machines Japan station',
  '13 両替': '両替 sign',
  '14 免税': '免税 tax free shop Japan sign',
  '16 立入禁止': '立入禁止 sign',
  '17 受付': '受付 sign',
  '18 案内': '案内所 information Japan station',
};

// Licences that allow reuse with credit (or with none). Anything else is skipped.
const OK = /^(CC0|Public domain|PD|CC BY(-SA)? [1-4]\.0|CC BY(-SA)? 2\.5|CC BY(-SA)? 2\.1 jp)/i;
const UA = { 'User-Agent': 'language-learning-app-photo-finder/1.0 (personal, non-commercial)' };
const strip = (html = '') => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const picks = [];
for (const [label, q] of Object.entries(WANT)) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=12&gsrsearch=${encodeURIComponent(q + ' filetype:bitmap')}&prop=imageinfo&iiprop=url|extmetadata|mime|size&iiurlwidth=480`;
  const pages = Object.values((await (await fetch(url, { headers: UA })).json()).query?.pages ?? {}).sort((a, b) => a.index - b.index);
  let n = 0;
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    const meta = ii?.extmetadata ?? {};
    const licence = meta.LicenseShortName?.value ?? '';
    if (!ii?.thumburl || !/jpeg|png/.test(ii.mime) || !OK.test(licence)) continue;
    const key = `${label.slice(0, 2)}-${++n}`;
    const file = join(out, `${key}.jpg`);
    const img = await (await fetch(ii.thumburl, { headers: UA })).arrayBuffer();
    await sharp(Buffer.from(img)).resize(300, 220, { fit: 'cover' }).jpeg({ quality: 70 }).toFile(file);
    picks.push({ key, label, title: p.title, page: ii.descriptionurl, thumb: ii.thumburl, licence, licenceUrl: meta.LicenseUrl?.value ?? '', artist: strip(meta.Artist?.value) || 'Unknown', file });
    if (n === 4) break;
  }
}
writeFileSync(join(out, 'candidates.json'), JSON.stringify(picks, null, 2));

// Contact sheets of 20 (5 x 4), each tile labelled with its key.
for (let s = 0; s * 20 < picks.length; s++) {
  const tiles = picks.slice(s * 20, s * 20 + 20);
  const composite = tiles.flatMap((p, i) => {
    const left = (i % 5) * 304 + 4;
    const top = Math.floor(i / 5) * 250 + 4;
    const tag = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="26"><rect width="300" height="26" fill="#111"/><text x="6" y="19" font-family="sans-serif" font-size="16" font-weight="bold" fill="#fff">${p.key}  ${p.label.slice(3)}  ${p.licence.replace(/&/g, '+')}</text></svg>`);
    return [{ input: p.file, left, top }, { input: tag, left, top: top + 220 }];
  });
  await sharp({ create: { width: 1524, height: 1004, channels: 3, background: '#fff' } }).composite(composite).jpeg({ quality: 72 }).toFile(join(out, `sheet-${s + 1}.jpg`));
}
console.log(`${picks.length} candidates`);
