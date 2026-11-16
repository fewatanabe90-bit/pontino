// Lists every line the app can say, for scripts/make-voices.py to record.
//   node scripts/voice-jobs.mjs             writes .voices/jobs.json
//   node scripts/voice-jobs.mjs --manifest  after recording: removes stale clips and writes src/lib/clips.json
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { clipJobs } from '../src/lib/clips.ts';

const read = (f) => JSON.parse(readFileSync(f, 'utf8'));
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

const files = walk('content');
const units = files.filter((f) => /unit-[^\\/]+\.json$/.test(f)).map(read);
const decks = files.filter((f) => /deck-[^\\/]+\.json$/.test(f)).map(read);
const jobs = clipJobs(units, decks);
const AUDIO = 'public/audio';

if (process.argv.includes('--manifest')) {
  const wanted = new Set(jobs.map((j) => j.id));
  mkdirSync(AUDIO, { recursive: true });
  for (const f of readdirSync(AUDIO)) if (!wanted.has(f.replace(/\.mp3$/, ''))) unlinkSync(join(AUDIO, f));
  const have = jobs.map((j) => j.id).filter((id) => existsSync(join(AUDIO, `${id}.mp3`))).sort();
  writeFileSync('src/lib/clips.json', JSON.stringify(have) + '\n');
  const bytes = have.reduce((n, id) => n + statSync(join(AUDIO, `${id}.mp3`)).size, 0);
  console.log(`${have.length} of ${jobs.length} clips recorded, ${(bytes / 1e6).toFixed(1)} MB`);
} else {
  mkdirSync('.voices', { recursive: true });
  writeFileSync('.voices/jobs.json', JSON.stringify(jobs, null, 1));
  const by = {};
  for (const j of jobs) by[j.voice] = (by[j.voice] ?? 0) + 1;
  console.log(jobs.length, 'lines', by);
}
