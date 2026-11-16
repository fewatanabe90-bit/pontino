<script lang="ts">
  import { app } from '../lib/state.svelte';
  import { speak } from '../lib/tts';
  import { explainNoVoice, voices } from '../lib/voices.svelte';

  let { text, big = false }: { text: string; big?: boolean } = $props();
  let slow = false;
  const ok = $derived(voices[app.lang]);

  // A second tap in a row plays slowly, the next one at normal speed again.
  function play() {
    if (!speak(text, app.lang, slow ? 0.7 : app.rate)) {
      explainNoVoice(app.lang);
      return;
    }
    slow = !slow;
  }
</script>

<button
  class="spk"
  class:big
  class:off={!ok}
  type="button"
  onclick={play}
  aria-label={ok ? 'Play audio. Tap again for slow speed.' : 'Audio unavailable on this device. Tap for details.'}
>{ok ? '🔊' : '🔇'}</button>

<style>
  .big {
    width: 72px;
    height: 72px;
    font-size: 30px;
    border-radius: 22px;
  }
  .off {
    background: var(--lock);
    box-shadow: 0 4px 0 var(--lock-edge);
  }
</style>
