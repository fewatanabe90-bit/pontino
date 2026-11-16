import type { Lang } from './normalise';

/** Pontino's one-liners. Encouraging, a bit cheeky, never guilt-tripping. All original. */
const RIGHT: Record<Lang, string[]> = {
  ja: [
    'Smooth as a Shinkansen.',
    'Particle placed with surgical precision.',
    'The konbini clerk would be impressed.',
    'That bridge did not even wobble.',
    'Somewhere, a vending machine plays a jingle for you.',
    'On time and correct. Very Japan Rail of you.',
    'Your vocabulary just found its skeleton.',
  ],
  it: [
    'Liscio come un espresso.',
    'Nonna approves. That is the highest court.',
    'No Portuñol detected.',
    'Dante would nod. Slightly.',
    'Goal! Under the crossbar.',
    'Al dente. Not a second over.',
    'The auxiliary police have nothing on you.',
  ],
};

const WRONG: Record<Lang, string[]> = {
  ja: [
    'Close! Even bridges need a second plank.',
    'Plot twist. We get it on the replay.',
    'Japanese did that on purpose.',
    'Filed under "things future-you finds easy".',
    'A small detour. The scenery is still nice.',
    'The particle gods demand one more try.',
  ],
  it: [
    'Quasi! Portuguese was whispering in your ear.',
    'A classic. Every Brazilian trips on this one.',
    'VAR is checking… we go again later.',
    'The sauce needs one more minute.',
    'Filed under "things future-you finds easy".',
    'Not a red card. Barely a yellow.',
  ],
};

let last = '';

export function quip(lang: Lang, ok: boolean): string {
  const pool = (ok ? RIGHT : WRONG)[lang];
  let pick = last;
  while (pick === last) pick = pool[Math.floor(Math.random() * pool.length)]!;
  last = pick;
  return pick;
}
