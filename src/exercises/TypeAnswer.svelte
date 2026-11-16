<script lang="ts">
  /** Type the answer; with `listen` it is a dictation. */
  import Ruby from '../components/Ruby.svelte';
  import Speak from '../components/Speak.svelte';
  import type { Answer } from '../lib/grade';
  import type { Exercise } from '../lib/schema';
  import { app } from '../lib/state.svelte';
  import { voices } from '../lib/voices.svelte';

  type Ex = Extract<Exercise, { type: 'type' }>;
  let { ex, answer = $bindable(), locked, onsubmit }: { ex: Ex; answer: Answer; locked: boolean; onsubmit: () => void } = $props();

  let value = $state('');
  $effect(() => {
    answer = value;
  });

  function keydown(e: KeyboardEvent) {
    // Enter while the Japanese keyboard is still converting kana must not submit.
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      onsubmit();
    }
  }
</script>

{#if ex.text}
  {#if ex.listen && !locked && voices[app.lang]}
    <div class="listen"><Speak text={ex.text} big /><span class="sub">Type what you hear.</span></div>
  {:else}
    <div class="row"><Speak text={ex.text} /><div class="tl"><Ruby text={ex.text} /></div></div>
  {/if}
{/if}

<label class="sr" for="typed">Your answer</label>
<textarea
  id="typed"
  class="tl"
  rows="3"
  lang={app.lang}
  bind:value
  readonly={locked}
  onkeydown={keydown}
  autocomplete="off"
  autocapitalize="off"
  spellcheck="false"
  enterkeyhint="done"
  placeholder={app.lang === 'ja' ? 'Type in hiragana (kanji is fine too)' : 'Scrivi in italiano'}
></textarea>

<style>
  textarea {
    width: 100%;
    resize: none;
    background: var(--card);
    border: 2px solid var(--line);
    border-radius: 16px;
    padding: 12px 14px;
    font-size: 20px;
  }
  textarea:focus {
    outline: none;
    border-color: var(--brand);
  }
  textarea::placeholder {
    font-size: 15px;
    font-weight: 600;
    color: var(--muted);
  }
  .listen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 12px 0;
  }
</style>
