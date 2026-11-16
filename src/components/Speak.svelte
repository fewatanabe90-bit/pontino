<script lang="ts">
  import { app } from '../lib/state.svelte';
  import { speak, ttsSupported } from '../lib/tts';

  let { text, big = false }: { text: string; big?: boolean } = $props();
  let slow = false;

  // Second tap in a row plays slowly, the next one at normal speed again.
  function play() {
    speak(text, app.lang, slow ? 0.7 : app.rate);
    slow = !slow;
  }
</script>

{#if ttsSupported()}
  <button class="spk" class:big type="button" onclick={play} aria-label="Play audio. Tap again for slow speed.">🔊</button>
{/if}

<style>
  .big {
    width: 72px;
    height: 72px;
    font-size: 30px;
    border-radius: 22px;
  }
</style>
