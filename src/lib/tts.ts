import type { Lang } from './normalise';
import { stripRuby } from './ruby';

const LOCALE: Record<Lang, string> = { ja: 'ja-JP', it: 'it-IT' };

export const ttsSupported = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * iPhones list a family of deliberately synthetic "Eloquence" and novelty voices for every language.
 * They sound robotic, so they are never chosen automatically.
 */
const ROBOTIC = /\b(Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley|Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Kathy|Ralph)\b/i;
/** The natural-sounding system voices for each language, best first. */
const PREFERRED: Record<Lang, RegExp> = {
  ja: /Kyoko|O-?ren|Hattori|Otoya|Nanami|Keita|Haruka|Ayumi|Ichiro|Sayaka|Google 日本語/i,
  it: /Alice|Federica|Emma|Luca|Paola|Isabella|Diego|Elsa|Cosimo|Google italiano/i,
};

/** Higher is better. Exported for tests. */
export function voiceScore(v: Pick<SpeechSynthesisVoice, 'name' | 'localService'>, lang: Lang): number {
  let s = 0;
  if (ROBOTIC.test(v.name)) s -= 100;
  if (/premium/i.test(v.name)) s += 40;
  else if (/enhanced|natural|neural/i.test(v.name)) s += 30;
  if (PREFERRED[lang].test(v.name)) s += 20;
  if (v.localService) s += 5; // works offline
  return s;
}

/** Usable voices for a language, best first. */
export function voicesFor(lang: Lang): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return [];
  const prefix = LOCALE[lang].slice(0, 2);
  return speechSynthesis
    .getVoices()
    .filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith(prefix))
    .sort((a, b) => voiceScore(b, lang) - voiceScore(a, lang));
}

/** The learner's own choice per language (a voiceURI), set from Profile. Empty means "best available". */
const chosen: Record<Lang, string> = { ja: '', it: '' };
export function setPreferredVoice(lang: Lang, uri: string) {
  chosen[lang] = uri;
}

function pickVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  const list = voicesFor(lang);
  return list.find((v) => v.voiceURI === chosen[lang]) ?? list[0];
}

/** Is there a voice for this language? Without one the browser stays silent or reads with the wrong accent. */
export const hasVoice = (lang: Lang): boolean => ttsSupported() && pickVoice(lang) !== undefined;

function utterance(text: string, lang: Lang, rate: number, voice = pickVoice(lang), pitch = 1): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(stripRuby(text).replace(/___/g, ' '));
  u.lang = LOCALE[lang];
  u.rate = rate;
  u.pitch = pitch;
  if (voice) u.voice = voice;
  return u;
}

/** Speak target-language text. Returns false if nothing can be spoken. */
export function speak(text: string, lang: Lang, rate = 1): boolean {
  if (!hasVoice(lang)) return false;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance(text, lang, rate));
  return true;
}

export interface Line {
  who: string;
  text: string;
}

/** Give each speaker their own voice where the device has several good ones, otherwise their own pitch. */
export function castVoices(speakers: string[], lang: Lang): Map<string, { voice?: SpeechSynthesisVoice; pitch: number }> {
  const good = voicesFor(lang).filter((v) => voiceScore(v, lang) >= 0);
  const main = pickVoice(lang);
  const pool = main ? [main, ...good.filter((v) => v !== main)] : good;
  const PITCH = [1, 0.82, 1.18, 0.92];
  return new Map(
    [...new Set(speakers)].map((who, i) => [
      who,
      pool.length > 1 ? { voice: pool[i % pool.length], pitch: i < pool.length ? 1 : PITCH[i % PITCH.length]! } : { voice: pool[0], pitch: PITCH[i % PITCH.length]! },
    ]),
  );
}

/** Pause between two speakers, in ms: long enough to feel like turn-taking, short enough to keep the flow. */
const TURN_GAP = 420;

/**
 * Play a dialogue as a conversation: one voice (or pitch) per speaker and a short pause between turns.
 * `onLine(i)` fires as each line starts and `onLine(-1)` at the end. Returns a function that stops playback.
 */
export function speakDialogue(lines: Line[], lang: Lang, rate: number, onLine: (i: number) => void): () => void {
  if (!hasVoice(lang) || !lines.length) return () => {};
  const cast = castVoices(lines.map((l) => l.who), lang);
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  speechSynthesis.cancel();

  const play = (i: number) => {
    const line = lines[i];
    if (stopped || !line) return onLine(-1);
    const part = cast.get(line.who);
    const u = utterance(line.text, lang, rate, part?.voice, part?.pitch);
    u.onstart = () => !stopped && onLine(i);
    u.onend = () => {
      if (stopped) return;
      if (i === lines.length - 1) return onLine(-1);
      timer = setTimeout(() => play(i + 1), TURN_GAP);
    };
    u.onerror = () => !stopped && onLine(-1);
    speechSynthesis.speak(u);
  };
  play(0);

  return () => {
    stopped = true;
    clearTimeout(timer);
    speechSynthesis.cancel();
    onLine(-1);
  };
}

export const stopSpeaking = () => ttsSupported() && speechSynthesis.cancel();
