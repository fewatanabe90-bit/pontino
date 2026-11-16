import { mount } from 'svelte';
import App from './App.svelte';
import './design/app.css';
import { boot } from './lib/state.svelte';

mount(App, { target: document.getElementById('app')! });
void boot();
