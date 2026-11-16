<script lang="ts">
  /** Sentence builder: tap tiles to add them, tap a placed tile to take it back. */
  import Ruby from '../components/Ruby.svelte';
  import Speak from '../components/Speak.svelte';
  import type { Answer } from '../lib/grade';
  import type { Exercise } from '../lib/schema';
  import { sfx } from '../lib/sfx';
  import { shuffle } from '../lib/shuffle';

  type Ex = Extract<Exercise, { type: 'tiles' }>;
  let { ex, answer = $bindable(), locked }: { ex: Ex; answer: Answer; locked: boolean } = $props();

  const bank = $derived(shuffle(ex.tiles.map((t, i) => ({ t, i }))));
  let picked = $state<number[]>([]);

  function sync() {
    answer = picked.map((i) => ex.tiles[i]!);
  }
  function add(i: number) {
    picked.push(i);
    sfx.tick();
    sync();
  }
  function remove(at: number) {
    picked.splice(at, 1);
    sync();
  }
</script>

{#if ex.context}
  <div class="who">They say</div>
  <div class="row" style="align-items:flex-start">
    <Speak text={ex.context} />
    <div class="bubble tl"><Ruby text={ex.context} /></div>
  </div>
  <div class="who">You reply</div>
{/if}

<div class="slot" aria-label="Your answer" aria-live="polite">
  {#each picked as i, at (i)}
    <button type="button" class="tile tl" disabled={locked} onclick={() => remove(at)} aria-label="Remove this tile">
      <Ruby text={ex.tiles[i] ?? ''} />
    </button>
  {/each}
</div>

<div class="bank">
  {#each bank as { t, i } (i)}
    {@const used = picked.includes(i)}
    <button type="button" class="tile tl" class:used disabled={locked || used} aria-hidden={used} onclick={() => add(i)}>
      <Ruby text={t} />
    </button>
  {/each}
</div>

<style>
  .who {
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .slot {
    min-height: 124px;
    border-top: 2px solid var(--line);
    border-bottom: 2px solid var(--line);
    padding: 10px 0;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-content: flex-start;
  }
  .bank {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
  }
  .tile:disabled:not(.used) {
    opacity: 1;
    color: var(--ink);
  }
</style>
