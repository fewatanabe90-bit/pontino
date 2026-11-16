<script lang="ts">
  /** Target-language text with optional furigana above kanji and romaji below kana. */
  import { readingChunks } from '../lib/ruby';
  import { app } from '../lib/state.svelte';

  let { text }: { text: string } = $props();
  const chunks = $derived(readingChunks(text));
  const furi = $derived(app.furigana === 'always');
  const romaji = $derived(app.lang === 'ja' && app.romaji);
</script>

{#each chunks as c}{#if romaji && c.ro}<span class="rm"><span>{#if furi && c.furi}<ruby>{c.t}<rt>{c.furi}</rt></ruby>{:else}{c.t}{/if}</span><span class="ro" aria-hidden="true">{c.ro}</span></span>{:else if furi && c.furi}<ruby>{c.t}<rt>{c.furi}</rt></ruby>{:else}{c.t}{/if}{/each}

<style>
  /* An inline-flex column takes its baseline from its first row, so the kana stay on the
     text baseline and the romaji hangs underneath. */
  .rm {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    vertical-align: baseline;
    line-height: 1.25;
  }
  .ro {
    font-family: var(--font);
    font-size: 0.5em;
    font-weight: 700;
    line-height: 1.2;
    color: var(--muted);
    padding: 0 1px;
    letter-spacing: 0;
    white-space: nowrap;
  }
</style>
