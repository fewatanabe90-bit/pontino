<script lang="ts">
  /** Match pairs: tap one on the left, then its partner on the right. */
  import Ruby from '../components/Ruby.svelte';
  import type { Exercise } from '../lib/schema';
  import { sfx } from '../lib/sfx';
  import { shuffle } from '../lib/shuffle';

  type Ex = Extract<Exercise, { type: 'match' }>;
  let { ex, ondone }: { ex: Ex; ondone: (mistakes: number) => void } = $props();

  const left = $derived(shuffle(ex.pairs.map((_, i) => i)));
  const right = $derived(shuffle(ex.pairs.map((_, i) => i)));
  let selL = $state<number | null>(null);
  let selR = $state<number | null>(null);
  let matched = $state<number[]>([]);
  let wrong = $state<[number, number] | null>(null);
  let mistakes = 0;

  function tryPair() {
    if (selL === null || selR === null) return;
    if (selL === selR) {
      matched.push(selL);
      sfx.tick();
      selL = selR = null;
      if (matched.length === ex.pairs.length) ondone(mistakes);
    } else {
      mistakes++;
      wrong = [selL, selR];
      selL = selR = null;
      setTimeout(() => (wrong = null), 500);
    }
  }
  function pick(side: 'l' | 'r', i: number) {
    if (side === 'l') selL = i;
    else selR = i;
    tryPair();
  }
</script>

<div class="grid">
  <div class="col">
    {#each left as i (i)}
      <button type="button" class="tile tl" class:sel={selL === i} class:right={matched.includes(i)} class:wrong={wrong?.[0] === i} disabled={matched.includes(i)} onclick={() => pick('l', i)}>
        <Ruby text={ex.pairs[i]?.[0] ?? ''} />
      </button>
    {/each}
  </div>
  <div class="col">
    {#each right as i (i)}
      <button type="button" class="tile" class:sel={selR === i} class:right={matched.includes(i)} class:wrong={wrong?.[1] === i} disabled={matched.includes(i)} onclick={() => pick('r', i)}>
        {ex.pairs[i]?.[1]}
      </button>
    {/each}
  </div>
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .tile {
    width: 100%;
    min-height: 60px;
    font-size: 15px;
    line-height: 1.3;
  }
  .tile.tl {
    font-size: 18px;
  }
  .tile:disabled {
    opacity: 0.55;
    color: var(--ink);
  }
</style>
