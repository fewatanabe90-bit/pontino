<script lang="ts">
  /** Original scene illustrations, drawn in code. One per kind of place a dialogue happens in. */
  import type { Snippet } from 'svelte';

  export type Place = 'lounge' | 'station' | 'stadium' | 'cafe' | 'train';
  let { place, children }: { place: Place; children?: Snippet } = $props();
</script>

<div class="scene">
  <svg viewBox="0 0 340 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    {#if place === 'lounge'}
      <rect width="340" height="170" fill="#F6E7CF" />
      <rect y="118" width="340" height="52" fill="#C99B6B" />
      <path d="M0 118h340" stroke="#A97C4F" stroke-width="3" />
      <!-- window with an evening city -->
      <rect x="196" y="18" width="118" height="72" rx="6" fill="#274472" />
      <circle cx="292" cy="36" r="9" fill="#FCE9A9" />
      <path d="M196 90V62h14V50h12v18h10V40h16v30h12V56h14v14h10V46h14v24h16v20Z" fill="#16284A" />
      <g fill="#FCE9A9"><rect x="236" y="46" width="3" height="3" /><rect x="242" y="54" width="3" height="3" /><rect x="216" y="56" width="3" height="3" /><rect x="282" y="52" width="3" height="3" /><rect x="262" y="62" width="3" height="3" /></g>
      <path d="M196 18h118v72H196ZM255 18v72M196 54h118" fill="none" stroke="#FBF8F1" stroke-width="4" />
      <!-- paper lantern and scroll -->
      <path d="M60 0v14" stroke="#7A5A3A" stroke-width="2" /><ellipse cx="60" cy="30" rx="15" ry="17" fill="#FBF3DC" stroke="#E8452C" stroke-width="2" /><path d="M47 24h26M46 32h28M48 39h24" stroke="#E8452C" stroke-width="1.200" opacity=".6" />
      <rect x="112" y="20" width="44" height="58" rx="3" fill="#FBF8F1" stroke="#7A5A3A" stroke-width="2" /><circle cx="134" cy="42" r="10" fill="#E8452C" /><path d="M120 62h28M124 68h20" stroke="#2E4A8B" stroke-width="2" stroke-linecap="round" />
      <!-- sofa, table, tea, plant -->
      <rect x="18" y="86" width="150" height="46" rx="14" fill="#2E4A8B" /><rect x="10" y="100" width="24" height="38" rx="10" fill="#22396E" /><rect x="152" y="100" width="24" height="38" rx="10" fill="#22396E" /><rect x="34" y="108" width="118" height="22" rx="8" fill="#3A5BA6" />
      <rect x="206" y="124" width="92" height="9" rx="4" fill="#7A5A3A" /><path d="M218 133v22M286 133v22" stroke="#7A5A3A" stroke-width="5" stroke-linecap="round" />
      <path d="M240 114h18v6a9 9 0 0 1-18 0Z" fill="#FBF8F1" /><path d="M244 108q3-4 0-8M252 108q3-4 0-8" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8" />
      <rect x="312" y="120" width="20" height="26" rx="4" fill="#B5553A" /><path d="M322 120c-14-10-14-30-6-38 4 12 6 22 6 38Zm0 0c12-12 14-28 8-40-6 10-8 24-8 40Z" fill="#4E8B4A" />
    {:else if place === 'station'}
      <rect width="340" height="170" fill="#DCEEF7" />
      <rect width="340" height="22" fill="#B8C4CF" /><path d="M30 22v96M310 22v96" stroke="#8C99A6" stroke-width="6" />
      <!-- sign board -->
      <rect x="92" y="30" width="156" height="34" rx="5" fill="#fff" stroke="#1D2230" stroke-width="2" /><rect x="92" y="52" width="156" height="6" fill="#4E8B4A" /><rect x="128" y="38" width="84" height="8" rx="4" fill="#1D2230" /><path d="M104 55h14M222 55h14" stroke="#fff" stroke-width="2" />
      <!-- train -->
      <rect x="-20" y="70" width="270" height="62" rx="16" fill="#F4F6F8" stroke="#8C99A6" stroke-width="2" /><rect x="-20" y="104" width="270" height="12" fill="#4E8B4A" />
      <g fill="#274472"><rect x="6" y="80" width="40" height="20" rx="4" /><rect x="58" y="80" width="40" height="20" rx="4" /><rect x="162" y="80" width="40" height="20" rx="4" /></g>
      <rect x="110" y="78" width="40" height="52" rx="4" fill="#DCE3EA" stroke="#8C99A6" stroke-width="2" /><path d="M130 78v52" stroke="#8C99A6" stroke-width="2" />
      <path d="M232 76q18 6 18 30v26" fill="none" stroke="#8C99A6" stroke-width="2" />
      <!-- clock and platform -->
      <circle cx="286" cy="52" r="15" fill="#fff" stroke="#1D2230" stroke-width="3" /><path d="M286 43v9l6 4" fill="none" stroke="#1D2230" stroke-width="2.500" stroke-linecap="round" />
      <rect y="132" width="340" height="38" fill="#A7B1BC" /><rect y="132" width="340" height="7" fill="#F2B01E" /><g fill="#D99A0F"><rect x="12" y="134" width="14" height="3" /><rect x="52" y="134" width="14" height="3" /><rect x="92" y="134" width="14" height="3" /><rect x="132" y="134" width="14" height="3" /><rect x="172" y="134" width="14" height="3" /><rect x="212" y="134" width="14" height="3" /><rect x="252" y="134" width="14" height="3" /><rect x="292" y="134" width="14" height="3" /></g>
    {:else if place === 'stadium'}
      <rect width="340" height="170" fill="#2B3A67" /><rect y="60" width="340" height="110" fill="#3A4C80" />
      <g fill="#FCE9A9"><circle cx="40" cy="20" r="1.500" /><circle cx="120" cy="12" r="1.500" /><circle cx="210" cy="24" r="1.500" /><circle cx="300" cy="14" r="1.500" /><circle cx="170" cy="8" r="1" /></g>
      <!-- floodlights -->
      <g><path d="M34 30v64M306 30v64" stroke="#8C99A6" stroke-width="4" /><rect x="18" y="14" width="32" height="18" rx="3" fill="#F4F6F8" /><rect x="290" y="14" width="32" height="18" rx="3" fill="#F4F6F8" /><path d="M34 32 90 130H-10ZM306 32 350 130H250Z" fill="#FCE9A9" opacity=".12" /></g>
      <!-- stands with a crowd -->
      <path d="M0 62q170-34 340 0v52H0Z" fill="#1D2748" />
      <g>
        {#each Array(34) as _, i}
          <circle cx={8 + i * 10} cy={74 - Math.sin((i / 33) * Math.PI) * 14 + (i % 2) * 5} r="3.600" fill={['#E8452C', '#FCE9A9', '#F4F6F8', '#F2B01E', '#7FB7E6'][i % 5]} />
          <circle cx={13 + i * 10} cy={90 - Math.sin((i / 33) * Math.PI) * 12 + (i % 3) * 3} r="3.600" fill={['#F4F6F8', '#E8452C', '#7FB7E6', '#FCE9A9'][i % 4]} />
        {/each}
      </g>
      <!-- pitch -->
      <path d="M0 112h340v58H0Z" fill="#3F9B57" /><path d="M0 126h340M0 146h340" stroke="#48AD62" stroke-width="12" opacity=".6" />
      <g fill="none" stroke="#fff" stroke-width="2.500" opacity=".9"><path d="M170 112v58" /><ellipse cx="170" cy="142" rx="34" ry="14" /><path d="M0 124h40v36H0M340 124h-40v36h40" /></g>
      <circle cx="170" cy="142" r="5" fill="#fff" stroke="#1D2230" stroke-width="1.500" />
    {:else if place === 'cafe'}
      <rect width="340" height="170" fill="#FBEBD3" />
      <!-- striped awning -->
      <g>{#each Array(9) as _, i}<path d="M{i * 40 - 10} 0h40l-6 26q-14 10-28 0Z" fill={i % 2 ? '#FFF8EC' : '#C8643C'} />{/each}</g>
      <!-- shelves with bottles -->
      <path d="M20 58h180M20 92h180" stroke="#7A5A3A" stroke-width="4" stroke-linecap="round" />
      <g>{#each [30, 52, 74, 96, 118, 140, 162, 184] as x, i}<rect x={x - 5} y={i % 2 ? 36 : 40} width="10" height={i % 2 ? 22 : 18} rx="3" fill={['#6F7F2F', '#C8643C', '#274472', '#B5892E'][i % 4]} /><rect x={x - 2} y={i % 2 ? 30 : 34} width="4" height="7" fill="#7A5A3A" />{/each}</g>
      <g>{#each [34, 62, 90, 118, 146, 174] as x}<path d="M{x - 8} 76h16v7a8 8 0 0 1-16 0Z" fill="#fff" stroke="#C9A98A" stroke-width="1.500" />{/each}</g>
      <!-- espresso machine -->
      <rect x="226" y="46" width="88" height="62" rx="8" fill="#D8DEE4" stroke="#8C99A6" stroke-width="2" /><rect x="236" y="56" width="68" height="14" rx="4" fill="#C8402F" /><circle cx="250" cy="82" r="5" fill="#1D2230" /><circle cx="290" cy="82" r="5" fill="#1D2230" /><path d="M262 92h16v10h-16Z" fill="#8C99A6" /><path d="M264 106h12v6a6 6 0 0 1-12 0Z" fill="#fff" stroke="#C9A98A" stroke-width="1.500" />
      <path d="M268 40q4-5 0-10M276 40q4-5 0-10" fill="none" stroke="#C9A98A" stroke-width="2" stroke-linecap="round" />
      <!-- counter -->
      <rect y="118" width="340" height="52" fill="#8A5A3C" /><rect y="112" width="340" height="10" rx="3" fill="#E9E1D6" /><path d="M0 138h340" stroke="#6E452C" stroke-width="2" />
      <!-- cornetto and espresso -->
      <ellipse cx="96" cy="112" rx="24" ry="4" fill="#fff" /><path d="M78 110q18-20 36 0q-18 6-36 0Z" fill="#E0A458" /><path d="M88 104l3 7M96 101v10M104 104l-3 7" stroke="#B9772F" stroke-width="2" stroke-linecap="round" />
      <ellipse cx="160" cy="113" rx="16" ry="3" fill="#fff" /><path d="M150 102h20v5a10 6 0 0 1-20 0Z" fill="#fff" stroke="#C9A98A" stroke-width="1.500" /><ellipse cx="160" cy="103" rx="8" ry="2" fill="#5A3A22" />
    {:else}
      <!-- train through the hills -->
      <rect width="340" height="170" fill="#BFE3F5" /><circle cx="282" cy="34" r="18" fill="#FCE9A9" />
      <path d="M0 96q60-50 130-14q50-36 110-6q50-22 100 4v90H0Z" fill="#A9C97A" /><path d="M0 120q90-36 190-10q80-24 150 0v60H0Z" fill="#8DB45C" />
      <g fill="#3F6B3A"><path d="M54 104q-7-24 0-40q7 16 0 40Z" /><path d="M72 108q-6-20 0-32q6 12 0 32Z" /><path d="M250 100q-7-24 0-40q7 16 0 40Z" /></g>
      <path d="M150 74h30v18h-30Z" fill="#F3D9B8" /><path d="M146 76l19-14 19 14Z" fill="#C8643C" /><rect x="161" y="80" width="8" height="12" fill="#8A5A3C" />
      <rect y="140" width="340" height="30" fill="#7C8B5A" /><path d="M0 146h340" stroke="#5E5348" stroke-width="3" /><g stroke="#5E5348" stroke-width="3">{#each Array(18) as _, i}<path d="M{i * 20 + 4} 142v10" />{/each}</g>
      <rect x="30" y="104" width="250" height="38" rx="12" fill="#C8402F" /><path d="M280 116q26 4 30 26h-30Z" fill="#C8402F" /><rect x="30" y="126" width="280" height="6" fill="#F4F6F8" />
      <g fill="#DDF1FA"><rect x="44" y="110" width="34" height="14" rx="3" /><rect x="88" y="110" width="34" height="14" rx="3" /><rect x="132" y="110" width="34" height="14" rx="3" /><rect x="176" y="110" width="34" height="14" rx="3" /><rect x="220" y="110" width="34" height="14" rx="3" /><path d="M268 110h14q10 2 14 14h-28Z" /></g>
      <g fill="#1D2230"><circle cx="70" cy="144" r="6" /><circle cx="110" cy="144" r="6" /><circle cx="210" cy="144" r="6" /><circle cx="250" cy="144" r="6" /></g>
    {/if}
  </svg>
  {#if children}<div class="cast">{@render children()}</div>{/if}
</div>

<style>
  .scene {
    position: relative;
    flex: none;
    height: 170px;
    border-radius: 24px;
    overflow: hidden;
    border: 2px solid var(--line);
    box-shadow: 0 5px 0 var(--line);
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .cast {
    position: absolute;
    inset: auto 0 0 0;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 34px;
    padding-bottom: 6px;
  }
</style>
