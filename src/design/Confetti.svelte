<script lang="ts">
  /** A short burst for a finished lesson: paper confetti, plus cherry petals in Japanese mode. */
  import { app } from '../lib/state.svelte';

  const COLORS = ['var(--brand)', 'var(--accent)', 'var(--accent2)', '#F2B01E', '#FF9B8A'];
  const pieces = Array.from({ length: 36 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    dur: 1.8 + Math.random() * 1.6,
    drift: (Math.random() - 0.5) * 120,
    spin: 360 + Math.random() * 720,
    color: COLORS[i % COLORS.length]!,
    petal: app.lang === 'ja' && i % 3 === 0,
  }));
</script>

<div class="confetti" aria-hidden="true">
  {#each pieces as p}
    <i
      class:petal={p.petal}
      style="left:{p.left}%;background:{p.petal ? '#F7B6C8' : p.color};animation-delay:{p.delay}s;animation-duration:{p.dur}s;--drift:{p.drift}px;--spin:{p.spin}deg"
    ></i>
  {/each}
</div>

<style>
  .confetti {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 5;
  }
  i {
    position: absolute;
    top: -16px;
    width: 9px;
    height: 14px;
    border-radius: 2px;
    opacity: 0;
    animation: fall linear forwards;
  }
  .petal {
    width: 12px;
    height: 12px;
    border-radius: 12px 0 12px 0;
  }
  @keyframes fall {
    0% {
      opacity: 1;
      transform: translate(0, 0) rotate(0);
    }
    100% {
      opacity: 0.9;
      transform: translate(var(--drift), 105dvh) rotate(var(--spin));
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .confetti {
      display: none;
    }
  }
</style>
