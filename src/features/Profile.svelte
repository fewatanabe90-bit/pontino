<script lang="ts">
  import InterestChips from '../components/InterestChips.svelte';
  import { db, exportAll, importAll } from '../lib/db';
  import { photoCredits } from '../lib/decks';
  import { isStandalone, pwa } from '../lib/pwa.svelte';
  import { app, reloadAfterImport, setSetting, type Furigana, type Mode } from '../lib/state.svelte';
  import { localDay } from '../lib/streak';
  import { speak, voicesFor } from '../lib/tts';
  import { voices } from '../lib/voices.svelte';

  let message = $state('');
  const voiceKey = $derived(app.lang === 'ja' ? 'voiceJa' : 'voiceIt');
  // Re-read the list when the device finishes loading its voices.
  const voiceList = $derived((voices[app.lang], voicesFor(app.lang)));
  const SAMPLE = { ja: 'こんにちは。よろしくお願いします。', it: 'Ciao! Come stai oggi?' };

  function chooseVoice(e: Event) {
    setSetting(voiceKey, (e.currentTarget as HTMLSelectElement).value);
    speak(SAMPLE[app.lang], app.lang, app.rate);
  }
  let cardCount = $state(0);
  $effect(() => {
    void db.cards.count().then((n) => (cardCount = n));
  });

  async function exportBackup() {
    const blob = new Blob([JSON.stringify(await exportAll())], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pontino-backup-${localDay()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    message = 'Backup file saved. Keep it somewhere safe, such as Files or iCloud Drive.';
  }

  async function importBackup(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const data: unknown = JSON.parse(await file.text());
      if (!confirm('Restoring replaces ALL progress on this device with the backup. Continue?')) return;
      await importAll(data);
      await reloadAfterImport();
    } catch (err) {
      message = err instanceof Error ? err.message : 'Could not read that file.';
    }
  }
</script>

{#snippet seg<T extends string | number>(label: string, value: T, options: [T, string][], set: (v: T) => void)}
  <div class="set-row">
    <span>{label}</span>
    <div class="seg" role="group" aria-label={label}>
      {#each options as [v, text]}
        <button type="button" aria-pressed={value === v} onclick={() => set(v)}>{text}</button>
      {/each}
    </div>
  </div>
{/snippet}

<div class="screen">
  <h1 class="h1">Profile</h1>

  <div class="card stats">
    <div><div class="h c-streak">🔥 {app.streak.count}</div><div class="sub">streak (best {app.streak.best})</div></div>
    <div><div class="h c-xp">⚡ {app.xp}</div><div class="sub">XP</div></div>
    <div><div class="h c-br">{cardCount}</div><div class="sub">review cards</div></div>
  </div>

  <div class="card">
    <div class="eyebrow">Learning</div>
    {@render seg('Course', app.lang, [['ja', '日本語'], ['it', 'Italiano']], (v) => setSetting('lang', v))}
    {#if app.lang === 'ja'}
      {@render seg('Romaji under kana', app.romaji ? 'on' : 'off', [['on', 'Show'], ['off', 'Hide']], (v) => setSetting('romaji', v === 'on'))}
      {@render seg<Furigana>('Furigana over kanji', app.furigana, [['always', 'Show'], ['never', 'Hide']], (v) => setSetting('furigana', v))}
    {/if}
    {@render seg('Read aloud automatically', app.autoplay ? 'on' : 'off', [['on', 'On'], ['off', 'Off']], (v) => setSetting('autoplay', v === 'on'))}
    {@render seg('Sound effects', app.sound ? 'on' : 'off', [['on', 'On'], ['off', 'Off']], (v) => setSetting('sound', v === 'on'))}
    {@render seg('Voice speed', app.rate, [[0.75, 'Slow'], [0.9, 'Natural'], [1, 'Fast']], (v) => setSetting('rate', v))}
    <div class="set-row">
      <label for="voice">Voice</label>
      {#if voiceList.length}
        <select id="voice" value={app[voiceKey]} onchange={chooseVoice}>
          <option value="">Best available</option>
          {#each voiceList as v (v.voiceURI)}<option value={v.voiceURI}>{v.name}</option>{/each}
        </select>
      {:else}
        <span class="sub">None on this device</span>
      {/if}
    </div>
    <p class="sub" style="margin-top:10px">
      For a more human voice on iPhone: Settings → Accessibility → Spoken Content → Voices → {app.lang === 'ja' ? 'Japanese' : 'Italian'}, then download an
      <b>Enhanced</b> or <b>Premium</b> voice (free, from Apple). Reopen Pontino and it is used automatically.
    </p>
  </div>

  <div class="card">
    <div class="eyebrow" style="margin-bottom:10px">Interests</div>
    <InterestChips />
    <p class="sub" style="margin-top:10px">Decks and units on these topics are offered first. Core lessons stay the same for everyone.</p>
  </div>

  <div class="card">
    <div class="eyebrow">App</div>
    {@render seg<Mode>('Appearance', app.mode, [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], (v) => setSetting('mode', v))}
  </div>

  <div class="card">
    <div class="eyebrow">Your progress</div>
    <p class="sub" style="margin:8px 0 12px">Everything is stored only on this device. Export a backup now and then, and before changing phones.</p>
    <div class="row">
      <button class="btn ghost" type="button" onclick={exportBackup}>Export</button>
      <label class="btn ghost">Restore<input class="sr" type="file" accept="application/json,.json" onchange={importBackup} /></label>
    </div>
    {#if message}<p class="sub" role="status" style="margin-top:12px">{message}</p>{/if}
  </div>

  <details class="card">
    <summary class="eyebrow">Photo credits ({photoCredits.length})</summary>
    <ul class="credits">
      {#each photoCredits as c (c.file)}
        <li>
          <a href={c.source} target="_blank" rel="noopener noreferrer">{c.title}</a> by {c.author}.
          {#if c.licenceUrl}<a href={c.licenceUrl} target="_blank" rel="noopener noreferrer">{c.licence}</a>{:else}{c.licence}{/if}. {c.changes}.
        </li>
      {/each}
    </ul>
  </details>

  <div class="card">
    <div class="eyebrow">Offline</div>
    <p class="sub" style="margin-top:8px">
      {pwa.offlineReady || isStandalone() ? 'Ready: lessons and reviews work without a connection.' : 'After the first full load, lessons and reviews work without a connection.'}
      Audio uses the voices on your device.
    </p>
  </div>

  <div class="card">
    <div class="eyebrow">Credits</div>
    <p class="sub" style="margin-top:8px">
      Spaced repetition by ts-fsrs (MIT). Font: Nunito (SIL Open Font License). Built with Svelte, Vite, Dexie, Zod and Workbox (MIT / Apache-2.0).
      Photos of real signs come from Wikimedia Commons under open licences; each is listed below.
      Lesson content, illustrations, the Pontino mascot and jokes are original to Pontino. Sound effects are generated by the app; emoji come from your device. No ads, no trackers, no accounts.
    </p>
  </div>
</div>

<style>
  .set-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 56px;
    font-weight: 800;
    font-size: 15px;
    border-bottom: 2px solid var(--line);
  }
  .set-row:last-child {
    border: 0;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    text-align: center;
    gap: 8px;
  }
  select {
    font: inherit;
    font-weight: 800;
    font-size: 14px;
    max-width: 190px;
    min-height: 40px;
    border-radius: 12px;
    border: 2px solid var(--line);
    background: var(--card);
    color: var(--ink);
    padding: 0 8px;
  }
  summary {
    cursor: pointer;
    min-height: 28px;
  }
  .credits {
    margin-top: 10px;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--muted);
    overflow-wrap: anywhere;
  }
  .credits a {
    color: var(--brand);
  }
  label.btn {
    cursor: pointer;
  }
</style>
