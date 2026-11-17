<script lang="ts">
  import { app, setSetting } from '../lib/state.svelte';
  import { localDay, streakStatus } from '../lib/streak';

  const status = $derived(streakStatus(app.streak, localDay()));
  const bridges = $derived(Object.values(app.lessons).filter((l) => l.status === 'done').length);
  /** The explanation of the three numbers, opened by tapping them. */
  let open = $state(false);
</script>

<div class="top">
  <div class="seg" role="group" aria-label="Course">
    <button type="button" aria-pressed={app.lang === 'ja'} onclick={() => setSetting('lang', 'ja')}>日本語</button>
    <button type="button" aria-pressed={app.lang === 'it'} onclick={() => setSetting('lang', 'it')}>Italiano</button>
  </div>
  <button class="stat" type="button" aria-expanded={open} aria-label="Your progress: {status.count} day streak, {app.xp} points, {bridges} lessons finished. Tap for details." onclick={() => (open = !open)}>
    <span class="c-streak"><b>🔥 {status.count}</b><small>{status.count === 1 ? 'day' : 'days'}</small></span>
    <span class="c-xp"><b>⚡ {app.xp}</b><small>points</small></span>
    <span class="c-br"><b>🌉 {bridges}</b><small>{bridges === 1 ? 'lesson' : 'lessons'}</small></span>
  </button>
</div>
{#if open}
  <div class="card legend">
    <p><span class="c-streak">🔥 Streak</span> Days in a row with some practice. Now: {status.count}.</p>
    <p><span class="c-xp">⚡ Points</span> Earned for correct answers, finished lessons and reviewed flashcards.</p>
    <p><span class="c-br">🌉 Bridges</span> Lessons you have finished, in both languages.</p>
    <button class="chip" type="button" onclick={() => (open = false)}>Got it</button>
  </div>
{/if}

<style>
  .stat {
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    font-weight: 900;
    gap: 12px;
    cursor: pointer;
  }
  .stat span {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.1;
  }
  .stat b {
    font-size: 16px;
    white-space: nowrap;
  }
  .stat small {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: var(--muted);
  }
  .legend {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    font-size: 13px;
    line-height: 1.4;
  }
  .legend p {
    margin: 0;
  }
  .legend p span {
    font-weight: 900;
    margin-right: 4px;
  }
  .legend .chip {
    align-self: flex-start;
  }
</style>
