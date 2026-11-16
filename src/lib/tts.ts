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

/** Speak target-language text. On iOS this must be called from a tap. Returns false if nothing can be spoken. */
export function speak(text: string, lang: Lang, rate = 1): boolean {
  if (!ttsSupported()) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(stripRuby(text).replace(/___/g, ' '));
  u.lang = LOCALE[lang];
  u.rate = rate;
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
  return true;
}
