<script lang="ts">
  import Pontino from './design/Pontino.svelte';
  import Cards from './features/Cards.svelte';
  import Flashcards from './features/Flashcards.svelte';
  import Home from './features/Home.svelte';
  import Learn from './features/Learn.svelte';
  import Lesson from './features/Lesson.svelte';
  import Profile from './features/Profile.svelte';
  import Review from './features/Review.svelte';
  import { applyUpdate, pwa } from './lib/pwa.svelte';
  import { addPracticeTime, app } from './lib/state.svelte';
  import { voices } from './lib/voices.svelte';

  const TABS = [
    ['home', '🏠', 'Home'],
    ['learn', '🧭', 'Learn'],
    ['review', '🔁', 'Review'],
    ['profile', '👤', 'Profile'],
  ] as const;

  const parse = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  let route = $state(parse());
  const page = $derived(route[0] ?? 'home');

  // Study time counts towards the daily goal while a lesson, deck or review is open and in use.
  const STUDY = ['lesson', 'deck', 'review', 'mistakes'];
  const TICK = 5;
  $effect(() => {
    let lastTouch = Date.now();
    const touch = () => (lastTouch = Date.now());
    addEventListener('pointerdown', touch, true);
    addEventListener('keydown', touch, true);
    const timer = setInterval(() => {
      const active = document.visibilityState === 'visible' && Date.now() - lastTouch < 120_000;
      if (app.ready && active && STUDY.includes(page)) addPracticeTime(app.lang, TICK);
    }, TICK * 1000);
    return () => {
      clearInterval(timer);
      removeEventListener('pointerdown', touch, true);
      removeEventListener('keydown', touch, true);
    };
  });

  $effect(() => {
    const on = () => {
      route = parse();
    };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  });
</script>

{#if voices.toast}
  <div class="toast" role="status">
    <span>{voices.toast}</span>
    <button type="button" aria-label="Dismiss" onclick={() => (voices.toast = '')}>✕</button>
  </div>
{/if}
{#if pwa.updateReady && page !== 'lesson'}
  <div class="toast" role="status">
    <span>A new version of Pontino is ready.</span>
    <button class="upd" type="button" onclick={applyUpdate}>Update</button>
  </div>
{/if}
{#if !app.ready}
  <div class="screen" style="align-items:center;justify-content:center"><Pontino bob /></div>
{:else if page === 'lesson' && route[1] && route[2]}
  {#key route[2]}<Lesson unitId={route[1]} lessonId={route[2]} />{/key}
{:else if page === 'mistakes'}
  {#key app.lang}<Lesson mistakes />{/key}
{:else if page === 'cards'}
  {#key app.lang}<Cards />{/key}
{:else if page === 'deck' && route[1]}
  {#key route[1]}<Flashcards deckId={route[1]} />{/key}
{:else}
  {#if page === 'learn'}
    <Learn />
  {:else if page === 'review'}
    <Review />
  {:else if page === 'profile'}
    <Profile />
  {:else}
    <Home />
  {/if}
  <nav class="tabs" aria-label="Main">
    {#each TABS as [id, icon, label]}
      <a href="#/{id}" aria-current={page === id ? 'page' : undefined}><b aria-hidden="true">{icon}</b>{label}</a>
    {/each}
  </nav>
{/if}

<style>
  .toast {
    position: absolute;
    z-index: 20;
    top: calc(10px + var(--safe-t));
    left: 12px;
    right: 12px;
    display: flex;
    gap: 10px;
    align-items: flex-start;
    background: var(--ink);
    color: var(--paper);
    border: 0;
    border-radius: 16px;
    padding: 12px 14px;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.4;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  }
  .toast button {
    flex: none;
    width: 44px;
    height: 44px;
    margin: -8px -10px -8px 0;
    background: none;
    border: 0;
    color: inherit;
    font-weight: 900;
  }
  .toast .upd {
    width: auto;
    padding: 0 14px;
    margin: -4px -4px -4px 0;
    background: var(--brand);
    color: #fff;
    border-radius: 12px;
  }
</style>
