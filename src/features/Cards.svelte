<script lang="ts">
  /** Every flashcard the learner has collected, to read again at any time without affecting the review schedule. */
  import Ruby from '../components/Ruby.svelte';
  import Speak from '../components/Speak.svelte';
  import Pontino from '../design/Pontino.svelte';
  import { sfx } from '../lib/sfx';
  import { speak, stopSpeaking } from '../lib/tts';
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

  /** Flip-card practice over cards already learned. It never changes when a card is next due. */
  let queue = $state<SrsCard[] | null>(null);
  let practiceTitle = $state('');
  let total = $state(0);
  let flipped = $state(false);
  const current = $derived(queue?.[0]);

  function practise(list: SrsCard[], title: string) {
    const mixed = [...list];
    for (let i = mixed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mixed[i], mixed[j]] = [mixed[j]!, mixed[i]!];
    }
    queue = mixed;
    total = mixed.length;
    practiceTitle = title;
    flipped = false;
  }
  function flip() {
    flipped = !flipped;
    sfx.tick();
    if (flipped && current?.say && app.autoplay) speak(current.say, app.lang, app.rate);
  }
  function answer(known: boolean) {
    if (!queue) return;
    const card = queue.shift();
    flipped = false;
    if (card && !known) queue.push(card);
    if (!queue.length) sfx.complete();
  }
  function stop() {
    stopSpeaking();
    queue = null;
  }
  // Say each card as it comes up. A kanji's words would give the answer away, so they wait for the flip.
  $effect(() => {
    if (current && app.autoplay && !current.say) speak(current.front, app.lang, app.rate);
  });

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

{#if queue && current}
  <div class="screen">
    <div class="row">
      <button class="x" type="button" onclick={stop} aria-label="Stop practising">✕</button>
      <div class="eyebrow" style="flex:1">🗂️ {practiceTitle}</div>
      <div class="sub">{queue.length} left</div>
    </div>
    {#key current.id + queue.length}
      <div class="stage">
        <button class="flash" class:flipped type="button" onclick={flip} aria-label={flipped ? 'Show the front' : 'Flip the card to see the meaning'}>
          <span class="face fr">
            <span class="tl big" class:kanji={!!current.say}><Ruby text={current.front} /></span>
            <span class="hint">Tap to flip</span>
          </span>
          <span class="face bk" aria-hidden={!flipped}>
            <span class="meaning">{current.back}</span>
            {#if current.note}{#each current.note.split('\n') as n}<span class="tl extra"><Ruby text={n} /></span>{/each}{/if}
          </span>
        </button>
      </div>
    {/key}
    <div class="row speak" style="justify-content:center">{#if !current.say || flipped}<Speak text={current.say ?? current.front} />{/if}</div>
  </div>
  <div class="foot">
    {#if flipped}
      <div class="two">
        <button class="btn ghost" type="button" onclick={() => answer(false)}>Again later</button>
        <button class="btn ok" type="button" onclick={() => answer(true)}>Got it</button>
      </div>
    {:else}
      <button class="btn" type="button" onclick={flip}>Show meaning</button>
    {/if}
  </div>
{:else if queue}
  <div class="screen center">
    <div class="pop"><Pontino size={130} mood="cheer" /></div>
    <h1 class="h1">{total} card{total === 1 ? '' : 's'} practised</h1>
    <p class="sub">This was extra practice: your review dates have not changed.</p>
    <button class="btn" type="button" onclick={stop}>Back to my flashcards</button>
  </div>
{:else}
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
    <p class="sub">{cards.length} card{cards.length === 1 ? '' : 's'} you have already learned. Practise them whenever you like: it does not change when they come back for review.</p>
    <button class="btn" type="button" onclick={() => practise(cards, 'All my flashcards')}>Practise all {cards.length} as flashcards</button>
    <input class="search" type="search" placeholder="Search a word or a meaning" bind:value={query} aria-label="Search your flashcards" />
    <div class="row">
      <button class="chip" type="button" onclick={() => (showAll = !showAll)}>{showAll ? 'Hide meanings' : 'Show all meanings'}</button>
      {#if query}<span class="sub">{shown} found</span>{/if}
    </div>
    {#each groups as g (g.id)}
      <div class="row">
        <h2 class="h group" style="flex:1">{g.title} <span class="sub">· {g.list.length}</span></h2>
        <button class="chip" type="button" onclick={() => practise(g.list, g.title)} aria-label="Practise {g.title} as flashcards">Practise ›</button>
      </div>
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
            <Speak text={c.say ?? c.front} />
          </div>
        {/each}
      </div>
    {/each}
    {#if query && !shown}<p class="sub">Nothing matches "{query}".</p>{/if}
  {/if}
</div>
{/if}

<style>
  .center {
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  button.x {
    background: none;
    border: 0;
    font-size: 22px;
  }
  .stage {
    flex: 1;
    min-height: 300px;
    perspective: 1200px;
    display: flex;
  }
  .flash {
    position: relative;
    flex: 1;
    border: 0;
    padding: 0;
    background: none;
    color: inherit;
    font: inherit;
    transform-style: preserve-3d;
    transition: transform 0.45s cubic-bezier(0.3, 1.3, 0.5, 1);
  }
  .flash.flipped {
    transform: rotateY(180deg);
  }
  .face {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 24px 18px;
    border-radius: 28px;
    border: 2px solid var(--line);
    background: var(--card);
    box-shadow: 0 8px 0 var(--line);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    text-align: center;
  }
  .fr {
    background:
      radial-gradient(circle at 15% 12%, var(--brand-soft), transparent 55%),
      var(--card);
  }
  .bk {
    transform: rotateY(180deg);
    border-color: var(--brand);
    box-shadow: 0 8px 0 var(--brand-edge);
  }
  .big {
    font-size: 34px;
    line-height: 1.6;
  }
  .big.kanji {
    font-size: 96px;
    line-height: 1.2;
  }
  .speak {
    min-height: 48px;
  }
  .hint {
    font-size: 13px;
    font-weight: 800;
    color: var(--muted);
  }
  .meaning {
    font-size: 24px;
    font-weight: 900;
    line-height: 1.3;
  }
  .extra {
    font-size: 16px;
    color: var(--muted);
  }
  .foot {
    padding: 12px 16px calc(16px + var(--safe-b));
    border-top: 2px solid var(--line);
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  @media (prefers-reduced-motion: reduce) {
    .flash {
      transition: none;
    }
  }
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
