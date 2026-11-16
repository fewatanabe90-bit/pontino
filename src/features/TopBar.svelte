<script lang="ts">
  import { app, setSetting } from '../lib/state.svelte';
  import { localDay, streakStatus } from '../lib/streak';

  const status = $derived(streakStatus(app.streak, localDay()));
  const bridges = $derived(Object.values(app.lessons).filter((l) => l.status === 'done').length);
</script>

<div class="top">
  <div class="seg" role="group" aria-label="Course">
    <button type="button" aria-pressed={app.lang === 'ja'} onclick={() => setSetting('lang', 'ja')}>日本語</button>
    <button type="button" aria-pressed={app.lang === 'it'} onclick={() => setSetting('lang', 'it')}>Italiano</button>
  </div>
  <div class="stat">
    <span class="c-streak" aria-label="{status.count} day streak">🔥 {status.count}</span>
    <span class="c-xp" aria-label="{app.xp} XP">⚡ {app.xp}</span>
    <span class="c-br" aria-label="{bridges} bridges crossed">🌉 {bridges}</span>
  </div>
</div>
