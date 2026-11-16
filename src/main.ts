import { mount } from 'svelte';
import App from './App.svelte';
import './design/app.css';
import { startPwa } from './lib/pwa.svelte';
import { unlockAudio } from './lib/sfx';
import { boot } from './lib/state.svelte';
import { watchVoices } from './lib/voices.svelte';

mount(App, { target: document.getElementById('app')! });
watchVoices();
// iOS allows sound only after a tap, so the first touch anywhere unlocks audio for the session.
addEventListener('pointerdown', unlockAudio, { once: true, capture: true });
startPwa();
void boot();
