<script lang="ts">
  import Pontino from './design/Pontino.svelte';
  import Home from './features/Home.svelte';
  import Learn from './features/Learn.svelte';
  import Lesson from './features/Lesson.svelte';
  import Profile from './features/Profile.svelte';
  import Review from './features/Review.svelte';
  import { app } from './lib/state.svelte';

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
