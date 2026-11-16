<script lang="ts">
  import Pontino from './design/Pontino.svelte';
  import Home from './features/Home.svelte';
  import Learn from './features/Learn.svelte';
  import Lesson from './features/Lesson.svelte';
  import Profile from './features/Profile.svelte';
  import Review from './features/Review.svelte';
  import { app } from './lib/state.svelte';
  import { voices } from './lib/voices.svelte';

  const TABS = [
    ['home', '🏠', 'Home'],
    ['learn', '🧭', 'Learn'],
    ['review', '🔁', 'Review'],
    ['collections', '📔', 'Collections'],
    ['profile', '👤', 'Profile'],
  ] as const;

  const parse = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  let route = $state(parse());
  const page = $derived(route[0] ?? 'home');

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
{#if !app.ready}
  <div class="screen" style="align-items:center;justify-content:center"><Pontino bob /></div>
{:else if page === 'lesson' && route[1] && route[2]}
  {#key route[2]}<Lesson unitId={route[1]} lessonId={route[2]} />{/key}
{:else}
  {#if page === 'learn'}
    <Learn />
  {:else if page === 'review'}
    <Review />
  {:else if page === 'profile'}
    <Profile />
  {:else if page === 'collections'}
    <div class="screen" style="align-items:center;justify-content:center;text-align:center">
      <Pontino size={120} mood="think" />
      <h1 class="h1">Travel journal</h1>
      <p class="sub">
        {app.lang === 'ja' ? 'The stamp book of prefectures and neighbourhoods' : 'The map of the 20 regions'} opens in the next phase.
      </p>
    </div>
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
</style>
