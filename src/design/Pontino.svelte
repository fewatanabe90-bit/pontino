<script lang="ts">
  import { app } from '../lib/state.svelte';

  type Mood = 'happy' | 'cheer' | 'think' | 'sleepy';
  let { size = 84, mood = 'happy', bob = false }: { size?: number; mood?: Mood; bob?: boolean } = $props();
</script>

<svg class:bob viewBox="0 -4 120 114" width={size} role="img" aria-label="Pontino, the little bridge" style="flex:none;overflow:visible">
  <ellipse cx="60" cy="105" rx="42" ry="4" fill="#000" opacity=".08" />
  {#if mood === 'cheer'}
    <path d="M14 62 Q0 50 6 34" fill="none" stroke="var(--brand-edge)" stroke-width="7" stroke-linecap="round" />
    <path d="M106 62 Q120 50 114 34" fill="none" stroke="var(--brand-edge)" stroke-width="7" stroke-linecap="round" />
  {:else}
    <path d="M14 66 Q1 62 4 48" fill="none" stroke="var(--brand-edge)" stroke-width="7" stroke-linecap="round" />
    <path d="M106 66 Q119 70 116 84" fill="none" stroke="var(--brand-edge)" stroke-width="7" stroke-linecap="round" />
  {/if}
  <path d="M14 98V58C14 30 34 14 60 14s46 16 46 44v40H76V76c0-10-7-14-16-14s-16 4-16 14v22Z" fill="var(--brand)" stroke="var(--brand-edge)" stroke-width="3" stroke-linejoin="round" />
  <path d="M24 46C28 31 42 23 60 23s32 8 36 23" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="4" stroke-linecap="round" />
  <rect x="9" y="92" width="40" height="11" rx="5.5" fill="var(--brand-edge)" />
  <rect x="71" y="92" width="40" height="11" rx="5.5" fill="var(--brand-edge)" />
  <path d="M15 49Q60 58 105 49v8Q60 66 15 57Z" fill="var(--accent)" />
  <path d="M90 55l11 16-8 3-8-17Z" fill="var(--accent)" />
  <path d="M90 55l11 16-8 3-8-17Z" fill="#000" opacity=".15" />
  {#if mood === 'sleepy'}
    <path d="M42 38q5 3 10 0M68 38q5 3 10 0" fill="none" stroke="#1D2230" stroke-width="3" stroke-linecap="round" />
  {:else if mood === 'cheer'}
    <path d="M42 39q5-7 10 0M68 39q5-7 10 0" fill="none" stroke="#1D2230" stroke-width="3" stroke-linecap="round" />
  {:else}
    <circle cx="47" cy="37" r="4.6" fill="#1D2230" /><circle cx="73" cy="37" r="4.6" fill="#1D2230" />
    <circle cx={mood === 'think' ? 49.4 : 48.6} cy="35.4" r="1.5" fill="#fff" /><circle cx={mood === 'think' ? 75.4 : 74.6} cy="35.4" r="1.5" fill="#fff" />
  {/if}
  <circle cx="38" cy="44" r="4" fill="#FF9B8A" opacity=".7" /><circle cx="82" cy="44" r="4" fill="#FF9B8A" opacity=".7" />
  {#if mood === 'think'}
    <path d="M55 45h10" fill="none" stroke="#1D2230" stroke-width="3" stroke-linecap="round" />
  {:else if mood === 'cheer'}
    <path d="M53 42q7 9 14 0Z" fill="#1D2230" stroke="#1D2230" stroke-width="2" stroke-linejoin="round" />
  {:else}
    <path d="M54 42q6 6 12 0" fill="none" stroke="#1D2230" stroke-width="3" stroke-linecap="round" />
  {/if}
  {#if app.lang === 'ja'}
    <path d="M27 30Q60 15 93 30" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" />
    <circle cx="60" cy="22.5" r="3.2" fill="var(--accent)" />
  {:else}
    <ellipse cx="60" cy="19" rx="33" ry="6.5" fill="#F2D48A" stroke="#C9A24E" stroke-width="2" />
    <path d="M43 19V9a6 6 0 0 1 6-6h22a6 6 0 0 1 6 6v10Z" fill="#F2D48A" stroke="#C9A24E" stroke-width="2" />
    <rect x="44" y="11" width="32" height="5.5" fill="var(--accent)" />
  {/if}
</svg>
