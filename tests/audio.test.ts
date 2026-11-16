import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { clipId, clipJobs, spoken, voiceFor } from '../src/lib/clips';
import type { Deck, Unit } from '../src/lib/schema';

const read = <T>(f: string) => JSON.parse(readFileSync(f, 'utf8')) as T;
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

const files = walk('content');
const units = files.filter((f) => /unit-[^\\/]+\.json$/.test(f)).map((f) => read<Unit>(f));
const decks = files.filter((f) => /deck-[^\\/]+\.json$/.test(f)).map((f) => read<Deck>(f));
const jobs = clipJobs(units, decks);
const manifest = read<string[]>('src/lib/clips.json');

describe('recorded voices', () => {
  it('strips reading markup and blanks from what is said', () => {
    expect(spoken('{駅|えき}{は|wa}どこですか。')).toBe('駅はどこですか。');
    expect(spoken('Ieri ___ al mare.')).toBe('Ieri al mare.');
    expect(clipId('if_sara', 'Ciao')).not.toBe(clipId('im_nicola', 'Ciao'));
  });

  it('gives characters their own voice and everything else the narrator', () => {
    expect(voiceFor('ja', 'レオ')).toBe('jm_kumo');
    expect(voiceFor('it', 'Marco')).toBe('im_nicola');
    expect(voiceFor('ja')).toBe('jf_alpha');
    expect(voiceFor('it', 'Somebody new')).toBe('if_sara');
  });

  it('never asks a voice to read symbols such as arrows or slashes', () => {
    const odd = jobs.filter((j) => /[→←/+=*#@&%<>|\\]/.test(j.text)).map((j) => j.text);
    expect(odd).toEqual([]);
  });

  // If this fails after adding content, record the new lines: see scripts/make-voices.py.
  it('has a recording for every line the app can say', () => {
    const missing = jobs.filter((j) => !manifest.includes(j.id)).map((j) => j.text);
    expect(missing).toEqual([]);
  });

  it('lists only clips that exist, and keeps no stale files', () => {
    for (const id of manifest) expect(existsSync(join('public', 'audio', `${id}.mp3`)), id).toBe(true);
    const wanted = new Set(jobs.map((j) => j.id));
    const stale = readdirSync(join('public', 'audio')).filter((f) => !wanted.has(f.replace(/\.mp3$/, '')));
    expect(stale).toEqual([]);
  });
});
