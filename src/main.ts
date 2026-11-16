import { mount } from 'svelte';
import App from './App.svelte';
import './design/app.css';
import { saveAudioOffline, startPwa } from './lib/pwa.svelte';
import { unlockAudio } from './lib/sfx';
import { boot } from './lib/state.svelte';
import { watchVoices } from './lib/voices.svelte';

mount(App, { target: document.getElementById('app')! });
watchVoices();
// iOS allows sound only after a tap, so the first touch anywhere unlocks audio for the session.
addEventListener('pointerdown', unlockAudio, { once: true, capture: true });
startPwa();
void boot();
// Once the app is up, save the voice clips for offline use without slowing the start.
setTimeout(() => void saveAudioOffline(), 3000);
addEventListener('online', () => void saveAudioOffline());
