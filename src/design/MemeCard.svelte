<script lang="ts">
  /** An original Pontino "meme": our own mascot and our own captions, in the classic two-caption layout. */
  import Pontino from './Pontino.svelte';

  type Mood = 'happy' | 'cheer' | 'think' | 'sleepy';
  let { top, bottom, mood = 'think' }: { top: string; bottom: string; mood?: Mood } = $props();
</script>

<figure class="meme">
  <p class="cap">{top}</p>
  <Pontino size={96} {mood} />
  <p class="cap">{bottom}</p>
  <figcaption class="sr">Pontino meme: {top} / {bottom}</figcaption>
</figure>

<style>
  .meme {
    width: 100%;
    margin: 0;
    padding: 14px 12px;
    border-radius: 20px;
    background:
      radial-gradient(circle at 50% 55%, rgba(255, 255, 255, 0.16), transparent 60%),
      linear-gradient(160deg, var(--accent2), #1d2230);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    transform: rotate(-1.5deg);
    box-shadow: 0 6px 0 rgba(0, 0, 0, 0.18);
  }
  .cap {
    color: #fff;
    font-weight: 900;
    font-size: 17px;
    line-height: 1.2;
    text-transform: uppercase;
    text-align: center;
    letter-spacing: 0.02em;
    text-shadow:
      -2px -2px 0 #000,
      2px -2px 0 #000,
      -2px 2px 0 #000,
      2px 2px 0 #000,
      0 3px 0 #000;
  }
</style>
