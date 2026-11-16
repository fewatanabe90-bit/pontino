<script lang="ts">
  /** Original, hand-drawn-in-code portraits for the people in the dialogues. */
  type Look = { skin: string; hair: string; style: 'short' | 'bob' | 'curly' | 'long' | 'bun'; shirt: string; bg: string; glasses?: boolean };

  const CAST: Record<string, Look> = {
    中村: { skin: '#F3CDA6', hair: '#23262E', style: 'short', shirt: '#2E4A8B', bg: '#DCE6F7', glasses: true },
    レオ: { skin: '#D9A074', hair: '#4A2E1F', style: 'curly', shirt: '#F2B01E', bg: '#FDF0C8' },
    佐藤: { skin: '#F6D7B8', hair: '#3A2A26', style: 'bob', shirt: '#E8452C', bg: '#FBDDD6' },
    Leo: { skin: '#D9A074', hair: '#4A2E1F', style: 'curly', shirt: '#F2B01E', bg: '#FDF0C8' },
    Giulia: { skin: '#F0C7A4', hair: '#7A3E1D', style: 'long', shirt: '#6F7F2F', bg: '#E7EDCF' },
    Marco: { skin: '#E3B38C', hair: '#2B2420', style: 'short', shirt: '#C8643C', bg: '#F7DFD2' },
    Sara: { skin: '#C98F63', hair: '#1F1A18', style: 'bun', shirt: '#0C8388', bg: '#D9F1F1' },
  };
  const SPARE: Look[] = [
    { skin: '#F3CDA6', hair: '#5B4636', style: 'bun', shirt: '#0C8388', bg: '#D9F1F1' },
    { skin: '#C98F63', hair: '#1F1A18', style: 'short', shirt: '#7A5BB5', bg: '#E8E0F7' },
  ];

  let { name, size = 44, speaking = false }: { name: string; size?: number; speaking?: boolean } = $props();
  const look = $derived(CAST[name] ?? SPARE[[...name].reduce((a, c) => a + c.codePointAt(0)!, 0) % SPARE.length]!);
</script>

<svg class:speaking viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" style="flex:none">
  <circle cx="24" cy="24" r="24" fill={look.bg} />
  <g>
    {#if look.style === 'long'}<path d="M9 22c0-10 6-16 15-16s15 6 15 16v20H9Z" fill={look.hair} />{/if}
    <path d="M6 52c0-10 8-15 18-15s18 5 18 15Z" fill={look.shirt} />
    <rect x="20" y="30" width="8" height="9" rx="3" fill={look.skin} />
    <circle cx="24" cy="23" r="11" fill={look.skin} />
    {#if look.style === 'short'}
      <path d="M12.5 22c-1-9 4-14 11.500-14s12.500 5 11.500 14c-2-4-5-6-11.500-6s-9.500 2-11.500 6Z" fill={look.hair} />
    {:else if look.style === 'bob'}
      <path d="M11 27c-2-12 4-19 13-19s15 7 13 19c-1.500-6-3-9-5-10-4 1-11 1-16-1-2 2-4 5-5 11Z" fill={look.hair} />
    {:else if look.style === 'curly'}
      <g fill={look.hair}><circle cx="15" cy="15" r="5" /><circle cx="21" cy="11" r="5" /><circle cx="28" cy="11" r="5" /><circle cx="33.500" cy="15" r="5" /><circle cx="13" cy="20" r="3.500" /><circle cx="35" cy="20" r="3.500" /></g>
    {:else if look.style === 'bun'}
      <circle cx="24" cy="8" r="5" fill={look.hair} />
      <path d="M12.500 23c-1-9 4-13 11.500-13s12.500 4 11.500 13c-3-4-6-5-11.500-5s-8.500 1-11.500 5Z" fill={look.hair} />
    {:else}
      <path d="M12 24c-1-10 4-15 12-15s13 5 12 15c-2-5-5-7-12-7s-10 2-12 7Z" fill={look.hair} />
    {/if}
    <circle cx="20" cy="24" r="1.600" fill="#1D2230" /><circle cx="28" cy="24" r="1.600" fill="#1D2230" />
    {#if look.glasses}<g fill="none" stroke="#1D2230" stroke-width="1.200"><circle cx="20" cy="24" r="3.600" /><circle cx="28" cy="24" r="3.600" /><path d="M23.600 24h.800" /></g>{/if}
    <circle cx="17" cy="27.500" r="2" fill="#FF9B8A" opacity=".55" /><circle cx="31" cy="27.500" r="2" fill="#FF9B8A" opacity=".55" />
    {#if speaking}<ellipse cx="24" cy="29" rx="2.400" ry="2" fill="#1D2230" />{:else}<path d="M21 28.500q3 3 6 0" fill="none" stroke="#1D2230" stroke-width="1.500" stroke-linecap="round" />{/if}
  </g>
</svg>

<style>
  svg {
    border-radius: 50%;
    overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .speaking {
    box-shadow: 0 0 0 3px var(--brand);
  }
</style>
