<script lang="ts">
  import { parseRuby } from '../lib/ruby';
  import { app } from '../lib/state.svelte';

  let { text }: { text: string } = $props();
  const segs = $derived(parseRuby(text));
</script>

{#each segs as s}{#if s.rt && app.furigana === 'always'}<ruby>{s.t}<rt>{s.rt}</rt></ruby>{:else}{s.t}{/if}{/each}
