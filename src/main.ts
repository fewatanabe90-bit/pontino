import { mount } from 'svelte';
import App from './App.svelte';
import './design/app.css';
import { startPwa } from './lib/pwa.svelte';
import { boot } from './lib/state.svelte';
import { watchVoices } from './lib/voices.svelte';

mount(App, { target: document.getElementById('app')! });
watchVoices();
startPwa();
void boot();
