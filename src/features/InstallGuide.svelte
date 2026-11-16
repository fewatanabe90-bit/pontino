<script lang="ts">
  /** One-time "Add to Home Screen" guide, shown on iPhone when running in a browser tab. */
  import { db } from '../lib/db';
  import { isIos, isIosSafari, isStandalone } from '../lib/pwa.svelte';

  const KEY = 'installGuideDismissed';
  let show = $state(false);
  const safari = isIosSafari();
  const hasProgress = $state({ value: false });

  $effect(() => {
    if (!isIos() || isStandalone()) return;
    void Promise.all([db.kv.get(KEY), db.lessons.count()]).then(([dismissed, lessons]) => {
      show = !dismissed;
      hasProgress.value = lessons > 0;
    });
  });

  function dismiss() {
    show = false;
    void db.kv.put({ key: KEY, value: true });
  }
</script>

{#if show}
  <div class="card guide">
    <div class="row">
      <img src="./apple-touch-icon.png" alt="" width="52" height="52" />
      <div>
        <div class="h">Put Pontino on your Home Screen</div>
        <div class="sub">Opens like an app, works offline, and keeps your progress safe.</div>
      </div>
    </div>
    {#if safari}
      <ol>
        <li>Tap the <b>Share</b> button <span aria-hidden="true">(the square with an arrow)</span> in Safari's toolbar.</li>
        <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
        <li>Tap <b>Add</b>, then open Pontino from its new icon.</li>
      </ol>
    {:else}
      <p class="sub">Open this page in <b>Safari</b> first, then use Share → Add to Home Screen.</p>
    {/if}
    <p class="sub note">
      {#if hasProgress.value}
        The Home Screen app keeps its own progress, separate from this tab. To take yours along: Profile → Export here, then Profile → Restore in the app.
      {:else}
        Do this before you start: the Home Screen app keeps its own progress, separate from this tab.
      {/if}
    </p>
    <button class="btn ghost" type="button" onclick={dismiss}>Got it</button>
  </div>
{/if}

<style>
  .guide {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-color: var(--brand);
  }
  img {
    border-radius: 12px;
    flex: none;
  }
  .h {
    font-size: 17px;
  }
  ol {
    padding-left: 22px;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.5;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .note {
    background: var(--brand-soft);
    color: var(--ink);
    border-radius: 12px;
    padding: 10px 12px;
  }
</style>
