<script lang="ts">
  import Ruby from '../components/Ruby.svelte';
  import Speak from '../components/Speak.svelte';
  import Avatar from '../design/Avatar.svelte';
  import Confetti from '../design/Confetti.svelte';
  import MemeCard from '../design/MemeCard.svelte';
  import Pontino from '../design/Pontino.svelte';
  import Choice from '../exercises/Choice.svelte';
  import Match from '../exercises/Match.svelte';
  import Tiles from '../exercises/Tiles.svelte';
  import TypeAnswer from '../exercises/TypeAnswer.svelte';
  import type { CheckResult } from '../lib/check';
  import { loadUnit, unitEntry } from '../lib/content';
  import { grade, hasAnswer, type Answer } from '../lib/grade';
  import { quip } from '../lib/quips';
  import type { Exercise, Lesson, Unit } from '../lib/schema';
  import { sfx } from '../lib/sfx';
  import { addXp, app, completeLesson, saveLessonStep } from '../lib/state.svelte';
  import { speak, speakAll, stopSpeaking } from '../lib/tts';

  let { unitId, lessonId }: { unitId: string; lessonId: string } = $props();

  const XP_FIRST = 10;
  const XP_RETRY = 5;
  const XP_BONUS = 20;
  const PRAISE = { ja: 'すごい！', it: 'Ottimo!' };
  const segments = (s: string) => [...new Intl.Segmenter().segment(s)].map((g) => g.segment);

  let unit = $state<Unit | null>(null);
  let lesson = $state<Lesson | null>(null);
  let error = $state('');
  let phase = $state<'intro' | 'ex' | 'done'>('intro');
  /** Indexes of the exercises still to pass; a missed one goes to the back. */
  let queue = $state<number[]>([]);
  let attempt = $state(0);
  let answer = $state<Answer>(null);
  let result = $state<CheckResult | null>(null);
  let line = $state('');
  let xp = $state(0);
  let newCards = $state(0);
  /** Dialogue line being read aloud, or -1. */
  let playing = $state(-1);
  let stopDialogue: () => void = () => {};
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
        else if (app.autoplay) playDialogue();
      })
      .catch((e: Error) => (error = e.message));
    return () => {
      stopSpeaking();
    };
  });

  function playDialogue() {
    if (!lesson || !unit) return;
    stopDialogue();
    stopDialogue = speakAll(lesson.intro.lines.map((l) => l.text), unit.lang, app.rate, (i) => (playing = i));
  }

  /** The target-language sentence an exercise is about, when hearing it does not give the answer away. */
  function stimulus(e: Exercise): string | undefined {
    if (e.type === 'tiles') return e.context;
    if (e.type === 'mcq' || e.type === 'type') return e.text;
    return undefined;
  }

  // Read each new exercise aloud as it appears.
  $effect(() => {
    void attempt;
    if (phase !== 'ex' || !ex || !unit || !app.autoplay) return;
    const text = stimulus(ex);
    if (text) speak(text, unit.lang, app.rate);
  });

  function startPractice() {
    stopDialogue();
    phase = 'ex';
  }

  function feedback(ok: boolean, sayAfter?: string) {
    if (!unit) return;
    line = quip(unit.lang, ok);
    if (ok) sfx.correct();
    else sfx.wrong();
    const lang = unit.lang;
    // Let the sound effect finish before the model sentence is spoken.
    if (sayAfter && app.autoplay) setTimeout(() => result && speak(sayAfter, lang, app.rate), 450);
  }

  function check() {
    if (!ex || !unit || result) return;
    stopSpeaking();
    result = grade(ex, answer, unit.lang);
    if (result.ok) xp += missed.has(queue[0]!) ? XP_RETRY : XP_FIRST;
    else missed.add(queue[0]!);
    feedback(result.ok, ex.type === 'mcq' ? undefined : result.expected);
  }

  function matched(mistakes: number) {
    if (mistakes > 0) missed.add(queue[0]!);
    xp += mistakes > 0 ? XP_RETRY : XP_FIRST;
    result = { ok: true, expected: '' };
    feedback(true);
  }

  async function next() {
    if (!result || !unit || !lesson) return;
    stopSpeaking();
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
    sfx.complete();
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
    {#if lesson.intro.art}
      <div class="art" aria-hidden="true">
        {#each segments(lesson.intro.art) as g, i}<span style="--i:{i}">{g}</span>{/each}
      </div>
    {/if}
    <h1 class="h1">{lesson.title}</h1>
    <div class="row">
      <p class="sub" style="flex:1">{lesson.intro.scene}</p>
      <button class="chip" type="button" onclick={() => (playing >= 0 ? stopDialogue() : playDialogue())}>
        {playing >= 0 ? '⏸ Stop' : '▶ Play all'}
      </button>
    </div>
    {#each lesson.intro.lines as l, i}
      <div class="row line">
        <Avatar name={l.who} speaking={playing === i} />
        <div class="bubble" class:on={playing === i}>
          <div class="row" style="gap:8px;align-items:flex-start">
            <div style="flex:1">
              <div class="who jp">{l.who}</div>
              <div class="tl"><Ruby text={l.text} /></div>
              <div class="sub">{l.meaning}</div>
            </div>
            <Speak text={l.text} />
          </div>
        </div>
      </div>
    {/each}
    {#each lesson.intro.notes as note}
      <div class="card" class:pt={note.title.startsWith('🇧🇷')}>
        <div class="h note-h"><Ruby text={note.title} /></div>
        <p class="note"><Ruby text={note.body} /></p>
      </div>
    {/each}
  </div>
  <div class="foot"><button class="btn" type="button" onclick={startPractice}>Start practice</button></div>
{:else if phase === 'ex' && ex}
  <div class="lt">
    <a class="x" href="#/learn" aria-label="Close lesson. Your place is saved.">✕</a>
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax={total} aria-valuenow={total - queue.length}>
      <i style="width:{((total - queue.length) / total) * 100}%"></i>
    </div>
    <span class="c-xp" style="font-weight:900">⚡ {xp}</span>
  </div>
  <div class="screen" style="padding-top:8px">
    <h1 class="h"><Ruby text={ex.prompt} /></h1>
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
      <div class="row">
        <div class="pop"><Pontino size={58} mood={result.ok ? 'cheer' : 'think'} /></div>
        <div>
          <div class="h">{result.ok ? `${PRAISE[unit.lang]} Correct` : 'Not quite'}</div>
          <div class="quip">{line}</div>
        </div>
      </div>
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
  <Confetti />
  <div class="screen done">
    <div class="pop"><Pontino size={130} mood="cheer" /></div>
    <h1 class="h1">Bridge crossed!</h1>
    <div class="row stats">
      <div class="card"><div class="h c-xp">⚡ {xp}</div><div class="sub">XP earned</div></div>
      <div class="card"><div class="h c-streak">🔥 {app.streak.count}</div><div class="sub">day streak</div></div>
      <div class="card"><div class="h c-br">+{newCards}</div><div class="sub">review cards</div></div>
    </div>
    <div class="card" style="width:100%"><div class="eyebrow">Today I can…</div><p class="note">{lesson.canDo}</p></div>
    {#if lesson.meme}<MemeCard top={lesson.meme.top} bottom={lesson.meme.bottom} />{/if}
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
  .lt .bar {
    flex: 1;
  }
  .art {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 14px;
    height: 120px;
    flex: none;
    border-radius: 24px;
    font-size: 54px;
    background:
      radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.35), transparent 45%),
      linear-gradient(135deg, var(--brand-soft), color-mix(in srgb, var(--accent) 22%, var(--card)));
    border: 2px solid var(--line);
    overflow: hidden;
  }
  .art span {
    display: inline-block;
    transform: rotate(calc((var(--i) - 1) * 7deg));
    filter: drop-shadow(0 4px 0 rgba(0, 0, 0, 0.12));
  }
  @media (prefers-reduced-motion: no-preference) {
    .art span {
      animation: float 3s ease-in-out infinite;
      animation-delay: calc(var(--i) * -0.7s);
    }
  }
  @keyframes float {
    50% {
      translate: 0 -6px;
    }
  }
  .line {
    align-items: flex-start;
  }
  .bubble.on,
  .bubble.on::before {
    border-color: var(--brand);
    background: var(--brand-soft);
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
  .card.pt {
    border-color: var(--accent2);
    background: color-mix(in srgb, var(--accent2) 10%, var(--card));
  }
  .foot {
    padding: 12px 16px calc(16px + var(--safe-b));
    background: var(--paper);
    border-top: 2px solid var(--line);
  }
  .sheet {
    background: var(--ok-soft);
    border-radius: 24px 24px 0 0;
    padding: 14px 16px calc(18px + var(--safe-b));
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
  .quip {
    font-size: 14px;
    font-weight: 700;
    line-height: 1.35;
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
