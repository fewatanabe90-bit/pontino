<script lang="ts">
  import { INTERESTS, type Interest } from '../lib/interests';
  import { app, setSetting } from '../lib/state.svelte';

  function toggle(id: Interest) {
    const next = app.interests.includes(id) ? app.interests.filter((i) => i !== id) : [...app.interests, id];
    setSetting('interests', next);
  }
</script>

<div class="chips" role="group" aria-label="Your interests">
  {#each INTERESTS as i (i.id)}
    <button type="button" class="pick" aria-pressed={app.interests.includes(i.id)} onclick={() => toggle(i.id)}>
      <span aria-hidden="true">{i.icon}</span>{i.label}
    </button>
  {/each}
</div>

<style>
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .pick {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border-radius: 999px;
    border: 2px solid var(--line);
    background: var(--card);
    color: var(--muted);
    font-weight: 800;
    font-size: 14px;
    box-shadow: 0 3px 0 var(--line);
  }
  .pick[aria-pressed='true'] {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--ink);
    box-shadow: 0 3px 0 var(--brand);
  }
</style>
