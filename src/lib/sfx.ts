/**
 * Sound effects, synthesised in the browser. No audio files, so nothing to license or download.
 */
import { app } from './state.svelte';
import { ttsSupported } from './tts';

type Ctor = typeof AudioContext;
let ctx: AudioContext | undefined;

function audio(): AudioContext | undefined {
  const AC: Ctor | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
  if (!AC) return undefined;
  ctx ??= new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, at: number, dur: number, type: OscillatorType = 'triangle', peak = 0.16, glideTo?: number) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const on = () => app.sound;

export const sfx = {
  /** Bright two-note rise. */
  correct() {
    if (!on()) return;
    tone(659, 0, 0.14);
    tone(988, 0.11, 0.26);
  },
  /** Soft low "boop-boop", clearly different but not harsh. */
  wrong() {
    if (!on()) return;
    tone(330, 0, 0.18, 'sine', 0.2, 262);
    tone(247, 0.17, 0.3, 'sine', 0.2, 196);
  },
  /** Small fanfare for a finished lesson. */
  complete() {
    if (!on()) return;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.28));
    tone(1319, 0.5, 0.5, 'triangle', 0.12);
  },
  /** Tiny tick for a matched pair or a placed tile. */
  tick() {
    if (!on()) return;
    tone(880, 0, 0.07, 'triangle', 0.07);
  },
};

/**
 * iOS only lets a page make sound after the user has tapped something. Called on the first tap,
 * this starts the audio engine and speaks a silent utterance so later automatic playback works.
 */
export function unlockAudio() {
  audio();
  if (ttsSupported()) {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }
}
