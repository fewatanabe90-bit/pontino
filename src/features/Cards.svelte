<script lang="ts">
  /** Every flashcard the learner has collected, to read again at any time without affecting the review schedule. */
  import Ruby from '../components/Ruby.svelte';
  import Speak from '../components/Speak.svelte';
  import { unitEntry } from '../lib/content';
  import { db } from '../lib/db';
  import { deckById } from '../lib/decks';
  import { stripRuby } from '../lib/ruby';
  import type { SrsCard } from '../lib/srs';
  import { app } from '../lib/state.svelte';

  let cards = $state<SrsCard[]>([]);
  let loaded = $state(false);
  let query = $state('');
  /** Card whose meaning is showing, or ''. */
  let open = $state('');
  let showAll = $state(false);

  $effect(() => {
    const lang = app.lang;
    loaded = false;
    void db.cards
      .where('[lang+due]')
      .between([lang, 0], [lang, Infinity])
      .toArray()
      .then((rows) => {
        cards = rows;
        loaded = true;
      });
  });

  const source = (id: string) => {
    const deck = deckById(id);
    if (deck) return `${deck.icon} ${deck.title}`;
    const unit = unitEntry(id);
    return unit ? `${unit.icon} ${unit.title}` : 'Other';
  };

  const groups = $derived.by(() => {
    const q = query.trim().toLowerCase();
    const hit = (c: SrsCard) => !q || stripRuby(c.front).toLowerCase().includes(q) || c.back.toLowerCase().includes(q) || c.front.toLowerCase().includes(q);
    const by = new Map<string, SrsCard[]>();
    for (const c of cards.filter(hit)) by.set(c.unitId, [...(by.get(c.unitId) ?? []), c]);
    return [...by.entries()].map(([id, list]) => ({ id, title: source(id), list }));
  });
  const shown = $derived(groups.reduce((n, g) => n + g.list.length, 0));

  function when(c: SrsCard): string {
    const days = Math.round((c.due - Date.now()) / 86_400_000);
    if (c.due <= Date.now()) return 'due now';
    return days < 1 ? 'due today' : `back in ${days} day${days === 1 ? '' : 's'}`;
  }
</script>

<div class="screen">
  <div class="row">
    <a class="x" href="#/review" aria-label="Back to review">‹</a>
    <h1 class="h1" style="flex:1">My flashcards</h1>
  </div>
  {#if !loaded}
    <p class="sub">Loading…</p>
  {:else if !cards.length}
    <div class="card">
      <p class="sub">No cards yet. Finish a lesson or study a deck, and every word you meet is kept here.</p>
    </div>
  {:else}
    <p class="sub">{cards.length} card{cards.length === 1 ? '' : 's'} collected. Reading them here does not change when they come back for review.</p>
    <input class="search" type="search" placeholder="Search a word or a meaning" bind:value={query} aria-label="Search your flashcards" />
    <div class="row">
      <button class="chip" type="button" onclick={() => (showAll = !showAll)}>{showAll ? 'Hide meanings' : 'Show all meanings'}</button>
      {#if query}<span class="sub">{shown} found</span>{/if}
    </div>
    {#each groups as g (g.id)}
      <h2 class="h group">{g.title} <span class="sub">· {g.list.length}</span></h2>
      <div class="card list">
        {#each g.list as c (c.id)}
          <div class="item">
            <button type="button" class="word" onclick={() => (open = open === c.id ? '' : c.id)} aria-expanded={showAll || open === c.id}>
              <span class="tl front"><Ruby text={c.front} /></span>
              {#if showAll || open === c.id}
                <span class="back">{c.back}</span>
                {#if c.note}{#each c.note.split('\n') as n}<span class="sub tl"><Ruby text={n} /></span>{/each}{/if}
                <span class="sub when">{when(c)}</span>
              {/if}
            </button>
            <Speak text={c.front} />
          </div>
        {/each}
      </div>
    {/each}
    {#if query && !shown}<p class="sub">Nothing matches "{query}".</p>{/if}
  {/if}
</div>

<style>
  .x {
    font-size: 30px;
    color: var(--muted);
    font-weight: 900;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    text-decoration: none;
    margin-left: -10px;
  }
  .search {
    width: 100%;
    font: inherit;
    font-weight: 700;
    padding: 12px 14px;
    border-radius: 16px;
    border: 2px solid var(--line);
    background: var(--card);
    color: var(--ink);
  }
  .group {
    font-size: 16px;
    margin-top: 6px;
  }
  .list {
    padding: 4px 12px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 2px solid var(--line);
  }
  .item:last-child {
    border-bottom: 0;
  }
  .word {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    text-align: left;
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    color: inherit;
  }
  .front {
    font-size: 20px;
    line-height: 1.6;
  }
  .back {
    font-weight: 800;
    line-height: 1.4;
  }
  .when {
    font-size: 12px;
  }
</style>
