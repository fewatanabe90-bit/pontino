<script lang="ts">
  import Ruby from '../components/Ruby.svelte';
  import Speak from '../components/Speak.svelte';
  import Pontino from '../design/Pontino.svelte';
  import Choice from '../exercises/Choice.svelte';
  import Match from '../exercises/Match.svelte';
  import Tiles from '../exercises/Tiles.svelte';
  import TypeAnswer from '../exercises/TypeAnswer.svelte';
  import type { CheckResult } from '../lib/check';
  import { loadUnit, unitEntry } from '../lib/content';
  import { grade, hasAnswer, type Answer } from '../lib/grade';
  import type { Lesson, Unit } from '../lib/schema';
  import { addXp, app, completeLesson, saveLessonStep } from '../lib/state.svelte';

  let { unitId, lessonId }: { unitId: string; lessonId: string } = $props();

  const XP_FIRST = 10;
  const XP_RETRY = 5;
  const XP_BONUS = 20;
  const PRAISE = { ja: 'すごい！', it: 'Ottimo!' };

  let unit = $state<Unit | null>(null);
  let lesson = $state<Lesson | null>(null);
  let error = $state('');
  let phase = $state<'intro' | 'ex' | 'done'>('intro');
  /** Indexes of the exercises still to pass; a missed one goes to the back. */
  let queue = $state<number[]>([]);
  let attempt = $state(0);
  let answer = $state<Answer>(null);
  let result = $state<CheckResult | null>(null);
  let xp = $state(0);
  let newCards = $state(0);
  const missed = new Set<number>();

  const total = $derived(lesson?.exercises.length ?? 1);
  const ex = $derived(lesson && queue.length ? lesson.exercises[queue[0]!] : undefined);

  $effect(() => {
    const entry = unitEntry(unitId);
    if (!entry?.file) {
      error = 'This unit is not written yet.';
      return;
    }
    loadUnit(entry.file)
      .then((u) => {
        const l = u.lessons.find((x) => x.id === lessonId);
        if (!l) throw new Error('Lesson not found.');
        unit = u;
        lesson = l;
        const saved = app.lessons[l.id];
        const from = saved?.status === 'started' ? Math.min(saved.step, l.exercises.length - 1) : 0;
        queue = l.exercises.map((_, i) => i).slice(from);
        if (from > 0) phase = 'ex';
      })
      .catch((e: Error) => (error = e.message));
  });

  function check() {
    if (!ex || !unit || result) return;
    result = grade(ex, answer, unit.lang);
    if (result.ok) xp += missed.has(queue[0]!) ? XP_RETRY : XP_FIRST;
    else missed.add(queue[0]!);
  }

  function matched(mistakes: number) {
    if (mistakes > 0) missed.add(queue[0]!);
    xp += mistakes > 0 ? XP_RETRY : XP_FIRST;
    result = { ok: true, expected: '' };
  }

  async function next() {
    if (!result || !unit || !lesson) return;
    const i = queue.shift()!;
    if (!result.ok) queue.push(i);
    result = null;
    answer = null;
    attempt++;
    if (queue.length) {
      saveLessonStep(unit, lesson, Math.min(...queue));
      return;
    }
    xp += XP_BONUS;
    addXp(xp);
    newCards = await completeLesson(unit, lesson, (total - missed.size) / total);
    phase = 'done';
  }
</script>

{#if error}
  <div class="screen" style="justify-content:center;align-items:center;text-align:center">
    <Pontino mood="think" />
    <p class="h">{error}</p>
    <a class="btn" href="#/learn">Back to the path</a>
  </div>
{:else if !unit || !lesson}
  <div class="screen" style="justify-content:center;align-items:center"><Pontino bob /></div>
{:else if phase === 'intro'}
  <div class="screen">
    <div class="row"><a class="x" href="#/learn" aria-label="Close lesson">✕</a><div class="eyebrow">{unit.title}</div></div>
    <h1 class="h1">{lesson.title}</h1>
    <p class="sub">{lesson.intro.scene}</p>
    {#each lesson.intro.lines as line}
      <div class="row line">
        <Speak text={line.text} />
        <div class="bubble">
          <div class="who jp">{line.who}</div>
          <div class="tl"><Ruby text={line.text} /></div>
          <div class="sub">{line.meaning}</div>
        </div>
      </div>
    {/each}
    {#each lesson.intro.notes as note}
      <div class="card">
        <div class="h note-h"><Ruby text={note.title} /></div>
        <p class="note"><Ruby text={note.body} /></p>
      </div>
    {/each}
  </div>
  <div class="foot"><button class="btn" type="button" onclick={() => (phase = 'ex')}>Start practice</button></div>
{:else if phase === 'ex' && ex}
  <div class="lt">
    <a class="x" href="#/learn" aria-label="Close lesson. Your place is saved.">✕</a>
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax={total} aria-valuenow={total - queue.length}>
      <i style="width:{((total - queue.length) / total) * 100}%"></i>
    </div>
    <span class="c-xp" style="font-weight:900">⚡ {xp}</span>
  </div>
  <div class="screen" style="padding-top:8px">
    <h1 class="h">{ex.prompt}</h1>
    {#key `${ex.id}:${attempt}`}
      {#if ex.type === 'mcq' || ex.type === 'gap'}
        <Choice {ex} bind:answer locked={!!result} />
      {:else if ex.type === 'tiles'}
        <Tiles {ex} bind:answer locked={!!result} />
      {:else if ex.type === 'type'}
        <TypeAnswer {ex} bind:answer locked={!!result} onsubmit={check} />
      {:else}
        <Match {ex} ondone={matched} />
      {/if}
    {/key}
  </div>
  {#if result}
    <div class="sheet rise" class:no={!result.ok} role="status" aria-live="assertive">
      <div class="h">{result.ok ? `${PRAISE[unit.lang]} Correct` : 'Not quite'}</div>
      {#if !result.ok && result.expected}
        <div><span class="sub">Answer:</span>
          <div class="row">{#if ex.type !== 'mcq'}<Speak text={result.expected} />{/if}<div class="tl"><Ruby text={result.expected} /></div></div>
        </div>
      {/if}
      {#if ex.type === 'tiles' && result.ok}<p class="sub">{ex.meaning}</p>{/if}
      {#if result.hint}<p class="tip">{result.hint}</p>{/if}
      {#if ex.explain}<p class="tip"><Ruby text={ex.explain} /></p>{/if}
      {#if !result.ok}<p class="sub">It will come back at the end of the lesson.</p>{/if}
      <button class="btn {result.ok ? 'ok' : 'bad'}" type="button" onclick={next}>Continue</button>
    </div>
  {:else if ex.type !== 'match'}
    <div class="foot"><button class="btn" type="button" disabled={!hasAnswer(answer)} onclick={check}>Check</button></div>
  {/if}
{:else}
  <div class="screen done">
    <div class="pop"><Pontino size={150} mood="cheer" /></div>
    <h1 class="h1">Bridge crossed!</h1>
    <div class="row stats">
      <div class="card"><div class="h c-xp">⚡ {xp}</div><div class="sub">XP earned</div></div>
      <div class="card"><div class="h c-streak">🔥 {app.streak.count}</div><div class="sub">day streak</div></div>
      <div class="card"><div class="h c-br">+{newCards}</div><div class="sub">review cards</div></div>
    </div>
    <div class="card" style="width:100%"><div class="eyebrow">Today I can…</div><p class="note">{lesson.canDo}</p></div>
  </div>
  <div class="foot"><a class="btn" href="#/home">Continue</a></div>
{/if}

<style>
  .x {
    font-size: 22px;
    color: var(--muted);
    font-weight: 900;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    text-decoration: none;
    flex: none;
    margin-left: -10px;
  }
  .lt {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: calc(10px + var(--safe-t)) 16px 0;
  }
  .lt .x {
    margin-left: -10px;
  }
  .lt .bar {
    flex: 1;
  }
  .line {
    align-items: flex-start;
  }
  .who {
    font-size: 12px;
    font-weight: 900;
    color: var(--accent2);
  }
  :global([data-mode='dark']) .who {
    color: var(--muted);
  }
  .note-h {
    font-size: 17px;
    margin-bottom: 6px;
  }
  .note {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.55;
  }
  .foot {
    padding: 12px 16px calc(16px + var(--safe-b));
    background: var(--paper);
    border-top: 2px solid var(--line);
  }
  .sheet {
    background: var(--ok-soft);
    border-radius: 24px 24px 0 0;
    padding: 18px 16px calc(18px + var(--safe-b));
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 70dvh;
    overflow-y: auto;
  }
  .sheet .h {
    color: var(--ok);
  }
  .sheet.no {
    background: var(--bad-soft);
  }
  .sheet.no .h {
    color: var(--bad);
  }
  .sheet .sub {
    color: var(--ink);
  }
  .tip {
    background: var(--card);
    border-radius: 14px;
    padding: 10px 12px;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.5;
  }
  .done {
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  .stats {
    width: 100%;
    align-items: stretch;
  }
  .stats .card {
    flex: 1;
    padding: 12px 6px;
  }
</style>
