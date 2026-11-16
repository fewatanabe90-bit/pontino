<script lang="ts">
  import Ruby from '../components/Ruby.svelte';
  import Speak from '../components/Speak.svelte';
  import Pontino from '../design/Pontino.svelte';
  import { db } from '../lib/db';
  import { decks } from '../lib/decks';
  import { forYouFirst, matches } from '../lib/interests';
  import { rate, Rating, type Grade, type SrsCard } from '../lib/srs';
  import { addXp, app, markPractice, refreshDue } from '../lib/state.svelte';
  import TopBar from './TopBar.svelte';

  const SESSION = 20;
  const GRADES: { g: Grade; label: string; cls: string }[] = [
    { g: Rating.Again, label: 'Again', cls: 'bad' },
    { g: Rating.Hard, label: 'Hard', cls: 'ghost' },
    { g: Rating.Good, label: 'Good', cls: '' },
    { g: Rating.Easy, label: 'Easy', cls: 'ok' },
  ];

  let cards = $state<SrsCard[]>([]);
  let running = $state(false);
  let shown = $state(false);
  let reviewed = $state(0);
  const due = $derived(app.due[app.lang]);
  const card = $derived(cards[0]);

  const myDecks = $derived(forYouFirst(decks.filter((d) => d.lang === app.lang), app.interests));
  let learned = $state<Record<string, number>>({});
  $effect(() => {
    for (const d of myDecks) {
      void db.cards.where('itemId').startsWith(`${d.id}.`).count().then((n) => (learned[d.id] = n));
    }
  });

  async function start() {
    const lang = app.lang;
    cards = await db.cards.where('[lang+due]').between([lang, 0], [lang, Date.now()], true, true).limit(SESSION).toArray();
    reviewed = 0;
    shown = false;
    running = cards.length > 0;
  }

  async function answer(g: Grade) {
    const current = cards.shift();
    if (!current) return;
    const next = rate($state.snapshot(current) as SrsCard, g);
    await db.cards.put(next);
    // "Again" comes back in this session.
    if (g === Rating.Again) cards.push(next);
    else {
      reviewed++;
      addXp(2);
    }
    shown = false;
    if (!cards.length) {
      markPractice();
      await refreshDue();
    }
  }
</script>

{#if running && card}
  <div class="screen">
    <div class="row">
      <button class="x" type="button" onclick={() => { running = false; void refreshDue(); }} aria-label="Stop reviewing">✕</button>
      <div class="sub" style="margin-left:auto">{cards.length} left</div>
    </div>
    <div class="card face">
      <div class="tl big"><Ruby text={card.front} /></div>
      <Speak text={card.front} />
      {#if shown}
        <hr />
        <p class="back">{card.back}</p>
        {#if card.note}{#each card.note.split('\n') as n}<p class="sub tl small"><Ruby text={n} /></p>{/each}{/if}
      {/if}
    </div>
  </div>
  <div class="foot">
    {#if shown}
      <div class="grades">
        {#each GRADES as { g, label, cls }}
          <button class="btn {cls}" type="button" onclick={() => answer(g)}>{label}</button>
        {/each}
      </div>
    {:else}
      <button class="btn" type="button" onclick={() => (shown = true)}>Show answer</button>
    {/if}
  </div>
{:else}
  <div class="screen">
    <div class="pattern"></div>
    <TopBar />
    {#if running}
      <div class="center">
        <Pontino size={130} mood="cheer" />
        <h1 class="h1">Review done</h1>
        <p class="sub">{reviewed} card{reviewed === 1 ? '' : 's'} reviewed. They will come back when you are about to forget them.</p>
        <button class="btn" type="button" onclick={() => (running = false)}>OK</button>
      </div>
    {:else}
      <div class="card">
        <div class="row">
          <div class="ring big-ring" style="--p:{due ? 100 : 0}">{due}</div>
          <div>
            <div class="h">card{due === 1 ? '' : 's'} due</div>
            <div class="sub">{due ? `About ${Math.max(1, Math.round(Math.min(due, SESSION) / 5))} min · scheduled by FSRS` : 'Finish a lesson to add cards, or come back later.'}</div>
          </div>
        </div>
        <button class="btn" style="margin-top:16px" type="button" disabled={!due} onclick={start}>Start review</button>
      </div>
      <h2 class="h" style="margin-top:6px">Flashcard decks</h2>
      {#each myDecks as d (d.id)}
        {@const n = learned[d.id] ?? 0}
        <a class="card deck" href="#/deck/{d.id}">
          <span class="ico" aria-hidden="true">{d.icon}</span>
          <span class="body">
            <span class="h">{d.title}{#if matches(d.tags, app.interests)} <span class="foryou">For you</span>{/if}</span>
            <span class="sub">{d.description}</span>
            <span class="bar"><i style="width:{(n / d.cards.length) * 100}%"></i></span>
            <span class="sub">{n} of {d.cards.length} cards learned</span>
          </span>
        </a>
      {/each}
    {/if}
  </div>
{/if}

<style>
  .x {
    font-size: 22px;
    color: var(--muted);
    font-weight: 900;
    width: 44px;
    height: 44px;
    background: none;
    border: 0;
    margin-left: -10px;
  }
  .face {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    text-align: center;
  }
  .big {
    font-size: 30px;
  }
  .small {
    font-size: 16px;
  }
  .back {
    font-size: 18px;
    font-weight: 700;
    line-height: 1.45;
  }
  hr {
    width: 100%;
    border: 0;
    border-top: 2px solid var(--line);
  }
  .foot {
    padding: 12px 16px calc(16px + var(--safe-b));
    border-top: 2px solid var(--line);
  }
  .grades {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .grades .btn {
    padding: 14px 2px;
    font-size: 15px;
  }
  .center {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    text-align: center;
  }
  .deck {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 4px 0 var(--line);
  }
  .deck:active {
    transform: translateY(3px);
    box-shadow: none;
  }
  .ico {
    flex: none;
    width: 56px;
    height: 56px;
    border-radius: 18px;
    display: grid;
    place-items: center;
    font-size: 30px;
    background: var(--brand-soft);
  }
  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .body .h {
    font-size: 17px;
  }
  .body .bar {
    height: 10px;
  }
  .foryou {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #fff;
    background: var(--accent);
    border-radius: 999px;
    padding: 2px 8px;
    vertical-align: middle;
    white-space: nowrap;
  }
  .big-ring {
    width: 84px;
    height: 84px;
    font-size: 24px;
  }
</style>
