<script lang="ts">
  /** Multiple choice, listen-and-choose, and fill-the-gap (by choice). */
  import Ruby from '../components/Ruby.svelte';
  import Speak from '../components/Speak.svelte';
  import type { Answer } from '../lib/grade';
  import type { Exercise } from '../lib/schema';
  import { shuffle } from '../lib/shuffle';

  type Ex = Extract<Exercise, { type: 'mcq' | 'gap' }>;
  let { ex, answer = $bindable(), locked }: { ex: Ex; answer: Answer; locked: boolean } = $props();

  const order = $derived(shuffle(ex.options.map((_, i) => i)));
  const listen = $derived(ex.type === 'mcq' && !!ex.listen);
  const chosen = $derived(typeof answer === 'number' ? ex.options[answer] : undefined);
  const shown = $derived(ex.type === 'gap' ? ex.text.replace('___', chosen ? `【${chosen}】` : '＿＿') : ex.text);
</script>

{#if ex.text}
  {#if listen && !locked}
    <div class="listen"><Speak text={ex.text} big /><span class="sub">Tap to listen. Tap again for slow.</span></div>
  {:else}
    <div class="row stim">
      <Speak text={ex.type === 'gap' ? ex.text.replace('___', ex.options[ex.answer] ?? '') : ex.text} />
      <div class="tl"><Ruby text={shown ?? ''} /></div>
    </div>
  {/if}
{/if}
{#if ex.type === 'gap' && ex.meaning}<p class="sub">{ex.meaning}</p>{/if}

<div class="opts" role="radiogroup" aria-label="Answers">
  {#each order as i (i)}
    <button
      type="button"
      role="radio"
      aria-checked={answer === i}
      class="tile opt tl"
      class:sel={!locked && answer === i}
      class:right={locked && i === ex.answer}
      class:wrong={locked && answer === i && i !== ex.answer}
      disabled={locked}
      onclick={() => (answer = i)}
    >
      <Ruby text={ex.options[i] ?? ''} />
    </button>
  {/each}
</div>

<style>
  .opts {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .stim {
    align-items: flex-start;
  }
  .listen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 12px 0;
  }
  .opt {
    font-size: 17px;
    line-height: 1.6;
  }
  .opt:disabled {
    opacity: 1;
    color: var(--ink);
  }
</style>
