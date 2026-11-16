// Renders the app icons from the Pontino mascot. Run: node scripts/make-icons.mjs
// Output goes to /public and is committed, so sharp is only needed when the icon changes.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(out, { recursive: true });

const BRAND = '#0C8388';
const EDGE = '#075E63';
const SCARF = '#E8452C';
const PAPER = '#FBF8F1';

/** `scale` is how much of the canvas the mascot fills; maskable icons need a wider safe margin. */
const icon = (scale) => {
  const w = 120 * scale;
  const x = (160 - w) / 2;
  const y = (160 - 104 * scale) / 2 - 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <rect width="160" height="160" fill="${PAPER}"/>
  <g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M14 66 Q1 62 4 48" fill="none" stroke="${EDGE}" stroke-width="7" stroke-linecap="round"/>
    <path d="M106 66 Q119 70 116 84" fill="none" stroke="${EDGE}" stroke-width="7" stroke-linecap="round"/>
    <path d="M14 98V58C14 30 34 14 60 14s46 16 46 44v40H76V76c0-10-7-14-16-14s-16 4-16 14v22Z" fill="${BRAND}" stroke="${EDGE}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M24 46C28 31 42 23 60 23s32 8 36 23" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="4" stroke-linecap="round"/>
    <rect x="9" y="92" width="40" height="11" rx="5.5" fill="${EDGE}"/><rect x="71" y="92" width="40" height="11" rx="5.5" fill="${EDGE}"/>
    <path d="M15 49Q60 58 105 49v8Q60 66 15 57Z" fill="${SCARF}"/><path d="M90 55l11 16-8 3-8-17Z" fill="#C4371F"/>
    <circle cx="47" cy="37" r="4.6" fill="#1D2230"/><circle cx="73" cy="37" r="4.6" fill="#1D2230"/>
    <circle cx="48.6" cy="35.4" r="1.5" fill="#fff"/><circle cx="74.6" cy="35.4" r="1.5" fill="#fff"/>
    <circle cx="38" cy="44" r="4" fill="#FF9B8A" opacity=".7"/><circle cx="82" cy="44" r="4" fill="#FF9B8A" opacity=".7"/>
    <path d="M54 42q6 6 12 0" fill="none" stroke="#1D2230" stroke-width="3" stroke-linecap="round"/>
  </g>
</svg>`;
};

const jobs = [
  ['icon-192.png', 192, 1.0],
  ['icon-512.png', 512, 1.0],
  ['icon-maskable-512.png', 512, 0.78],
  ['apple-touch-icon.png', 180, 0.95],
];

for (const [name, size, scale] of jobs) {
  await sharp(Buffer.from(icon(scale)), { density: 300 }).resize(size, size).png().toFile(join(out, name));
  console.log(name);
}
writeFileSync(join(out, 'favicon.svg'), icon(1.05));
console.log('favicon.svg');
