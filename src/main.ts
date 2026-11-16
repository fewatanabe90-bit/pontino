import { mount } from 'svelte';
import App from './App.svelte';
import './design/app.css';
import { boot } from './lib/state.svelte';
import { watchVoices } from './lib/voices.svelte';

mount(App, { target: document.getElementById('app')! });
watchVoices();
void boot();
