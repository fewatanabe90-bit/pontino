import type { Lang } from './normalise';
import { stripRuby } from './ruby';

const LOCALE: Record<Lang, string> = { ja: 'ja-JP', it: 'it-IT' };

export const ttsSupported = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window;

function pickVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  const prefix = LOCALE[lang].slice(0, 2);
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.replace('_', '-').startsWith(prefix));
  // Prefer voices installed on the device (they work offline) and the higher-quality variants.
  const score = (v: SpeechSynthesisVoice) =>
    (v.localService ? 2 : 0) + (/enhanced|premium|siri|natural/i.test(v.name) ? 1 : 0);
  return voices.sort((a, b) => score(b) - score(a))[0];
}

/** Is there a voice for this language? Without one the browser stays silent or reads with the wrong accent. */
export const hasVoice = (lang: Lang): boolean => ttsSupported() && pickVoice(lang) !== undefined;

function utterance(text: string, lang: Lang, rate: number): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(stripRuby(text).replace(/___/g, ' '));
  u.lang = LOCALE[lang];
  u.rate = rate;
  const voice = pickVoice(lang);
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

/**
 * Speak several lines one after another. `onLine(i)` fires as each starts and `onLine(-1)` at the end.
 * Returns a function that stops playback.
 */
export function speakAll(texts: string[], lang: Lang, rate: number, onLine: (i: number) => void): () => void {
  if (!hasVoice(lang) || !texts.length) return () => {};
  let stopped = false;
  speechSynthesis.cancel();
  texts.forEach((text, i) => {
    const u = utterance(text, lang, rate);
    u.onstart = () => !stopped && onLine(i);
    if (i === texts.length - 1) u.onend = () => !stopped && onLine(-1);
    speechSynthesis.speak(u);
  });
  return () => {
    stopped = true;
    speechSynthesis.cancel();
    onLine(-1);
  };
}

export const stopSpeaking = () => ttsSupported() && speechSynthesis.cancel();
