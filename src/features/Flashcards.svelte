<script lang="ts">
  /** Flip-card study for a vocabulary deck. New cards join the spaced-repetition queue as you rate them. */
  import Ruby from '../components/Ruby.svelte';
  import Speak from '../components/Speak.svelte';
  import Pontino from '../design/Pontino.svelte';
  import { db } from '../lib/db';
  import { deckById, SESSION_SIZE } from '../lib/decks';
  import type { Deck } from '../lib/schema';
  import { sfx } from '../lib/sfx';
  import { newCard, rate, Rating } from '../lib/srs';
  import { addXp, app, markPractice, refreshDue, setSetting } from '../lib/state.svelte';
  import { speak, stopSpeaking } from '../lib/tts';

  type Card = Deck['cards'][number];
  let { deckId }: { deckId: string } = $props();

  const deck = $derived(deckById(deckId));
  let queue = $state<Card[]>([]);
  let flipped = $state(false);
  let learned = $state(0);
  let remaining = $state(0);
  /** `new` adds cards to the review queue; `browse` just flips through a finished deck. */
  let mode = $state<'new' | 'browse'>('new');
  let phase = $state<'loading' | 'study' | 'done'>('loading');
  const card = $derived(queue[0]);

  async function begin() {
    if (!deck) return;
    if (app.lang !== deck.lang) setSetting('lang', deck.lang);
    const have = new Set(await db.cards.where('itemId').startsWith(`${deck.id}.`).primaryKeys());
    const fresh = deck.cards.filter((c) => !have.has(`${c.id}:recognise`));
    mode = fresh.length ? 'new' : 'browse';
    queue = (fresh.length ? fresh : deck.cards).slice(0, fresh.length ? SESSION_SIZE : deck.cards.length);
    remaining = Math.max(0, fresh.length - queue.length);
    learned = 0;
    flipped = false;
    phase = 'study';
  }

  $effect(() => {
    void begin();
    return () => {
      stopSpeaking();
    };
  });

  // Say each card as it comes up.
  $effect(() => {
    if (phase === 'study' && card && deck && app.autoplay) speak(card.front, deck.lang, app.rate);
  });

  function flip() {
    flipped = !flipped;
    sfx.tick();
  }

  async function answer(known: boolean) {
    const current = queue.shift();
    if (!current || !deck) return;
    flipped = false;
    if (mode === 'new') {
      const note = [current.note, current.pt && `🇧🇷 ${current.pt}`].filter(Boolean).join('\n') || undefined;
      const fresh = newCard({ itemId: current.id, lang: deck.lang, unitId: deck.id, front: current.front, back: current.back, note });
      await db.cards.put(rate(fresh, known ? Rating.Good : Rating.Again));
    }
    if (known) {
      learned++;
      if (mode === 'new') addXp(2);
    } else {
      // Not known yet: see it again before the session ends.
      queue.push(current);
    }
    if (!queue.length) {
      phase = 'done';
      sfx.complete();
      if (mode === 'new') markPractice();
      await refreshDue();
    }
  }
</script>

{#if !deck}
  <div class="screen center">
    <Pontino mood="think" />
    <p class="h">That deck does not exist.</p>
    <a class="btn" href="#/review">Back</a>
  </div>
{:else if phase === 'done'}
  <div class="screen center">
    <div class="pop"><Pontino size={130} mood="cheer" /></div>
    <h1 class="h1">{mode === 'new' ? `${learned} new cards learned` : 'Deck refreshed'}</h1>
    <p class="sub">
      {mode === 'new'
        ? 'They are now in your review queue and will come back just before you would forget them.'
        : 'These cards are already in your review queue.'}
    </p>
    {#if remaining > 0}<button class="btn" type="button" onclick={begin}>Next {Math.min(remaining, SESSION_SIZE)} cards</button>{/if}
    <a class="btn ghost" href="#/review">Back to decks</a>
  </div>
{:else if card}
  <div class="screen">
    <div class="row">
      <a class="x" href="#/review" aria-label="Close deck">✕</a>
      <div class="eyebrow" style="flex:1">{deck.icon} {deck.title}</div>
      <div class="sub">{queue.length} left</div>
    </div>

    {#key card.id}
      <div class="stage">
        <button class="flash" class:flipped type="button" onclick={flip} aria-label={flipped ? 'Show the front' : 'Flip the card to see the meaning'}>
          <span class="face front">
            <span class="tl word"><Ruby text={card.front} /></span>
            <span class="hint">Tap to flip</span>
          </span>
          <span class="face back" aria-hidden={!flipped}>
            <span class="meaning">{card.back}</span>
            {#if card.note}<span class="tl extra"><Ruby text={card.note} /></span>{/if}
            {#if card.pt}<span class="pt">🇧🇷 {card.pt}</span>{/if}
          </span>
        </button>
      </div>
    {/key}
    <div class="row" style="justify-content:center"><Speak text={card.front} /></div>
  </div>
  <div class="foot">
    {#if flipped}
      <div class="two">
        <button class="btn ghost" type="button" onclick={() => answer(false)}>Still learning</button>
        <button class="btn ok" type="button" onclick={() => answer(true)}>Got it</button>
      </div>
    {:else}
      <button class="btn" type="button" onclick={flip}>Show meaning</button>
    {/if}
  </div>
{:else}
  <div class="screen center"><Pontino bob /></div>
{/if}

<style>
  .center {
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  .x {
    font-size: 22px;
    color: var(--muted);
    font-weight: 900;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    text-decoration: none;
    margin-left: -10px;
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
  .front {
    background:
      radial-gradient(circle at 15% 12%, var(--brand-soft), transparent 55%),
      var(--card);
  }
  .back {
    transform: rotateY(180deg);
    border-color: var(--brand);
    box-shadow: 0 8px 0 var(--brand-edge);
  }
  .word {
    font-size: 34px;
    line-height: 1.6;
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
    font-size: 17px;
    color: var(--muted);
  }
  .pt {
    font-size: 15px;
    font-weight: 700;
    line-height: 1.4;
    background: color-mix(in srgb, var(--accent2) 12%, var(--card));
    border-radius: 12px;
    padding: 8px 12px;
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
</style>
