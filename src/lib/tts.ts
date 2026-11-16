import { clipId, voiceFor } from './clips';
import clipList from './clips.json';
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

// ---- Recorded clips -------------------------------------------------------------------------

const CLIPS = new Set(clipList as string[]);
/** Clips are recorded at the app's "Natural" speed setting. */
const RECORDED_AT = 0.9;

let player: HTMLAudioElement | undefined;
const getPlayer = (): HTMLAudioElement | undefined => (typeof Audio === 'undefined' ? undefined : (player ??= new Audio()));
/** Bumped on every new playback or stop, so events from an earlier clip are ignored. */
let turn = 0;

function clipUrl(text: string, lang: Lang, who?: string): string | undefined {
  for (const voice of new Set([voiceFor(lang, who), voiceFor(lang)])) {
    const id = clipId(voice, text);
    if (CLIPS.has(id)) return `${import.meta.env.BASE_URL}audio/${id}.mp3`;
  }
  return undefined;
}

/** Is there a recording of this line? */
export const hasClip = (text: string, lang: Lang, who?: string): boolean => getPlayer() !== undefined && clipUrl(text, lang, who) !== undefined;

/** A very short silent sound, played on the first tap so iOS allows clips to start on their own later. */
function silence(): string {
  const n = 400;
  const b = new Uint8Array(44 + n).fill(128);
  const v = new DataView(b.buffer);
  const str = (at: number, s: string) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + n, true);
  str(8, 'WAVEfmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true);
  v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  str(36, 'data');
  v.setUint32(40, n, true);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
}

export function unlockClips() {
  const a = getPlayer();
  if (!a) return;
  a.src = silence();
  void a.play().catch(() => {});
}

interface Hooks {
  start?: () => void;
  end?: () => void;
}

/**
 * Say one line: the recording if there is one, otherwise the device voice.
 * Returns false if neither exists. Does not stop what is already playing.
 */
function say(text: string, lang: Lang, rate: number, who: string | undefined, part: { voice?: SpeechSynthesisVoice; pitch: number } | undefined, hooks: Hooks): boolean {
  const device = (): boolean => {
    if (!hasVoice(lang)) return false;
    const mine = turn;
    const u = utterance(text, lang, rate, part?.voice, part?.pitch);
    u.onstart = () => mine === turn && hooks.start?.();
    u.onend = () => mine === turn && hooks.end?.();
    u.onerror = () => mine === turn && hooks.end?.();
    speechSynthesis.speak(u);
    return true;
  };
  const a = getPlayer();
  const url = clipUrl(text, lang, who);
  if (!a || !url) return device();

  const mine = turn;
  // If the file cannot play (offline before it was saved, or blocked), use the device voice instead.
  const failed = () => {
    if (mine === turn && !device()) hooks.end?.();
  };
  a.onplaying = () => mine === turn && hooks.start?.();
  a.onended = () => mine === turn && hooks.end?.();
  a.onerror = failed;
  a.src = url;
  const speed = Math.min(1.25, Math.max(0.6, rate / RECORDED_AT));
  a.defaultPlaybackRate = speed;
  a.playbackRate = speed;
  a.play().catch(failed);
  return true;
}

export function stopSpeaking() {
  turn++;
  if (player) {
    player.onplaying = player.onended = player.onerror = null;
    player.pause();
  }
  if (ttsSupported()) speechSynthesis.cancel();
}

/** Speak target-language text; `who` picks a character's recorded voice. Returns false if nothing can be spoken. */
export function speak(text: string, lang: Lang, rate = 1, who?: string): boolean {
  stopSpeaking();
  return say(text, lang, rate, who, undefined, {});
}

/** Speak with the device voice only: used to try out the voice chosen in Profile. */
export function speakDevice(text: string, lang: Lang, rate = 1): boolean {
  stopSpeaking();
  if (!hasVoice(lang)) return false;
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
 * Play a dialogue as a conversation: one voice per speaker and a short pause between turns.
 * `onLine(i)` fires as each line starts and `onLine(-1)` at the end. Returns a function that stops playback.
 */
export function speakDialogue(lines: Line[], lang: Lang, rate: number, onLine: (i: number) => void): () => void {
  if (!lines.length) return () => {};
  stopSpeaking();
  const cast = castVoices(lines.map((l) => l.who), lang);
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const play = (i: number) => {
    const line = lines[i];
    if (stopped || !line) return onLine(-1);
    const next = () => {
      if (stopped) return;
      if (i === lines.length - 1) return onLine(-1);
      timer = setTimeout(() => play(i + 1), TURN_GAP);
    };
    const ok = say(line.text, lang, rate, line.who, cast.get(line.who), { start: () => !stopped && onLine(i), end: next });
    if (!ok) onLine(-1);
  };
  play(0);

  return () => {
    stopped = true;
    clearTimeout(timer);
    stopSpeaking();
    onLine(-1);
  };
}
