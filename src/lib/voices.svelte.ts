import type { Lang } from './normalise';
import { hasVoice, ttsSupported } from './tts';

/** Which course languages this device can speak. Voices load asynchronously, so this updates after start-up. */
export const voices = $state({ ja: false, it: false, toast: '' });

const NAMES: Record<Lang, string> = { ja: 'Japanese', it: 'Italian' };

function refresh() {
  voices.ja = hasVoice('ja');
  voices.it = hasVoice('it');
}

export function watchVoices() {
  if (!ttsSupported()) return;
  refresh();
  speechSynthesis.addEventListener('voiceschanged', refresh);
}

let timer: ReturnType<typeof setTimeout> | undefined;

export function explainNoVoice(lang: Lang) {
  voices.toast = ttsSupported()
    ? `This device has no ${NAMES[lang]} voice installed, so audio can't play here. iPhones include one. On a computer, add a ${NAMES[lang]} voice in the system speech settings, or try another browser.`
    : "This browser can't read text aloud. Try Safari or Chrome.";
  clearTimeout(timer);
  timer = setTimeout(() => (voices.toast = ''), 8000);
}
