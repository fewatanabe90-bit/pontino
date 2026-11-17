<script lang="ts">
  import Ruby from '../components/Ruby.svelte';
  import Speak from '../components/Speak.svelte';
  import Avatar from '../design/Avatar.svelte';
  import Confetti from '../design/Confetti.svelte';
  import MemeCard from '../design/MemeCard.svelte';
  import Pontino from '../design/Pontino.svelte';
  import Scene from '../design/Scene.svelte';
  import Choice from '../exercises/Choice.svelte';
  import Match from '../exercises/Match.svelte';
  import Tiles from '../exercises/Tiles.svelte';
  import TypeAnswer from '../exercises/TypeAnswer.svelte';
  import type { CheckResult } from '../lib/check';
  import { loadUnit, unitEntry } from '../lib/content';
  import { db } from '../lib/db';
  import { writtenUnits } from '../lib/progress';
  import { grade, hasAnswer, type Answer } from '../lib/grade';
  import { quip } from '../lib/quips';
  import type { Exercise, Lesson, Unit } from '../lib/schema';
  import { sfx } from '../lib/sfx';
  import { addXp, app, completeLesson, markPractice, saveLessonStep } from '../lib/state.svelte';
  import { speak, speakDialogue, stopSpeaking } from '../lib/tts';

  /** With `mistakes` the screen replays exercises answered wrong earlier instead of a lesson. */
  let { unitId = '', lessonId = '', mistakes = false }: { unitId?: string; lessonId?: string; mistakes?: boolean } = $props();
  const home = $derived(mistakes ? '#/review' : '#/learn');

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
  /** Furthest line reached; later lines stay faded while the conversation is playing for the first time. */
  let heard = $state(-1);
  let stopDialogue: () => void = () => {};
  const cast = $derived([...new Set(lesson?.intro.lines.map((l) => l.who) ?? [])].slice(0, 3));
  /** Book-style lessons: a text to read or a story to listen to. */
  const passage = $derived(lesson?.passage);
  const story = $derived((passage?.sentences ?? []).map((s) => ({ who: s.who ?? '', text: s.text })));
  /** The learner may look at the text: always for a reading, and for a story only when it allows a hint. */
  const canSeeText = $derived(!!passage && (passage.kind === 'reading' || passage.transcript === 'hint'));
  let listens = $state(0);
  let showText = $state(false);
  /** Sentence whose translation is open, or -1. */
  let openLine = $state(-1);
  const missed = new Set<number>();

  const total = $derived(lesson?.exercises.length ?? 1);
  const ex = $derived(lesson && queue.length ? lesson.exercises[queue[0]!] : undefined);

  $effect(() => {
    if (mistakes) {
      void loadMistakes();
      return () => {
        stopSpeaking();
      };
    }
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

  const BATCH = 12;

  async function loadMistakes() {
    const rows = await db.mistakes.where('lang').equals(app.lang).toArray();
    const units = await writtenUnits(app.lang);
    const all = units.flatMap((u) => u.lessons.flatMap((l) => l.exercises));
    const found = rows.map((r) => all.find((e) => e.id === r.id)).filter((e) => e !== undefined);
    if (!found.length || !units[0]) {
      error = 'No mistakes waiting. Nice work.';
      return;
    }
    unit = units[0];
    lesson = {
      id: 'mistakes',
      title: 'Fix your mistakes',
      canDo: 'I went back and fixed what tripped me up.',
      intro: { scene: '', lines: [], notes: [] },
      exercises: found.slice(0, BATCH),
      newItems: [],
    };
    queue = lesson.exercises.map((_, i) => i);
    phase = 'ex';
  }

  /** A wrong answer is saved for the Review tab; a right one clears it. */
  async function record(id: string, ok: boolean) {
    if (!unit || !lesson) return;
    // A question about a text makes no sense without the text, so it is not replayed under Review.
    if (lesson.passage) return;
    if (ok) return void db.mistakes.delete(id);
    const prev = await db.mistakes.get(id);
    await db.mistakes.put({
      id,
      lang: unit.lang,
      unitId: prev?.unitId ?? unit.id,
      lessonId: prev?.lessonId ?? lesson.id,
      count: (prev?.count ?? 0) + 1,
      last: Date.now(),
    });
  }

  function playDialogue() {
    if (!lesson || !unit) return;
    stopDialogue();
    if (passage) listens++;
    stopDialogue = speakDialogue(passage ? story : lesson.intro.lines, unit.lang, app.rate, (i) => {
      playing = i;
      if (i >= 0) {
        heard = Math.max(heard, i);
        document.getElementById(`line-${i}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  function tapSentence(i: number) {
    const s = passage?.sentences[i];
    if (!s || !unit) return;
    stopDialogue();
    openLine = openLine === i ? -1 : i;
    speak(s.text, unit.lang, app.rate, s.who);
  }

  /** The target-language sentence an exercise is about, when hearing it does not give the answer away. */
  function stimulus(e: Exercise): string | undefined {
    // Questions about a text are asked aloud, in the language being learned.
    if (lesson?.passage && e.type === 'mcq' && !e.text) return e.prompt;
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
    showText = false;
    openLine = -1;
    phase = 'ex';
  }

  let sayTimer: ReturnType<typeof setTimeout> | undefined;

  function feedback(ok: boolean, sayAfter?: string) {
    if (!unit) return;
    line = quip(unit.lang, ok);
    if (ok) sfx.correct();
    else sfx.wrong();
    const lang = unit.lang;
    // Let the sound effect finish before the model sentence is spoken.
    clearTimeout(sayTimer);
    if (sayAfter && app.autoplay) sayTimer = setTimeout(() => result && speak(sayAfter, lang, app.rate), 450);
  }

  function check() {
    if (!ex || !unit || result) return;
    stopDialogue();
    stopSpeaking();
    result = grade(ex, answer, unit.lang);
    void record(ex.id, result.ok);
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
    // Never let the last answer's audio start over the next exercise.
    clearTimeout(sayTimer);
    stopSpeaking();
    queue.shift();
    result = null;
    answer = null;
    attempt++;
    if (queue.length) {
      if (!mistakes) saveLessonStep(unit, lesson, Math.min(...queue));
      return;
    }
    xp += XP_BONUS;
    addXp(xp);
    if (mistakes) markPractice();
    else newCards = await completeLesson(unit, lesson, (total - missed.size) / total);
    phase = 'done';
    sfx.complete();
  }
</script>

{#snippet textCard()}
  {#if passage}
    <div class="card text">
      {#each passage.sentences as s, i}
        <button type="button" class="sent" class:on={playing === i} id="line-{i}" onclick={() => tapSentence(i)}>
          {#if s.who && s.who !== passage.sentences[i - 1]?.who}<span class="who jp">{s.who}</span>{/if}
          <span class="tl"><Ruby text={s.text} /></span>
          {#if openLine === i}<span class="sub gloss">{s.meaning}</span>{/if}
        </button>
      {/each}
    </div>
    <p class="sub">Tap a sentence to hear it and see what it means.</p>
  {/if}
{/snippet}

{#if error}
  <div class="screen" style="justify-content:center;align-items:center;text-align:center">
    <Pontino mood="think" />
    <p class="h">{error}</p>
    <a class="btn" href={home}>Back</a>
  </div>
{:else if !unit || !lesson}
  <div class="screen" style="justify-content:center;align-items:center"><Pontino bob /></div>
{:else if phase === 'intro'}
  <div class="screen">
    <div class="row"><a class="x" href="#/learn" aria-label="Close lesson">✕</a><div class="eyebrow">{unit.title}</div></div>
    {#if lesson.intro.place}
      <Scene place={lesson.intro.place}>
        {#each cast as who}
          <div class="actor" class:talking={playing >= 0 && lesson.intro.lines[playing]?.who === who}>
            <Avatar name={who} size={64} speaking={playing >= 0 && lesson.intro.lines[playing]?.who === who} />
          </div>
        {/each}
      </Scene>
    {:else if lesson.intro.art}
      <div class="art" aria-hidden="true">
        {#each segments(lesson.intro.art) as g, i}<span style="--i:{i}">{g}</span>{/each}
      </div>
    {/if}
    <h1 class="h1">{lesson.title}</h1>
    <div class="row">
      <p class="sub" style="flex:1">{lesson.intro.scene}</p>
      <button class="chip" type="button" onclick={() => (playing >= 0 ? stopDialogue() : playDialogue())}>
        {playing >= 0 ? '⏸ Stop' : passage ? (passage.kind === 'reading' ? '▶ Read aloud' : '▶ Listen') : '▶ Play all'}
      </button>
    </div>
    {#if passage}
      {#if passage.glossary?.length}
        <div class="card">
          <div class="eyebrow">Words to know</div>
          <ul class="words">
            {#each passage.glossary as g}<li><span class="tl"><Ruby text={g.word} /></span><span class="sub">{g.meaning}</span></li>{/each}
          </ul>
        </div>
      {/if}
      {#if passage.kind === 'reading'}
        {@render textCard()}
      {:else}
        <div class="card row">
          <button class="bigplay" type="button" onclick={() => (playing >= 0 ? stopDialogue() : playDialogue())} aria-label={playing >= 0 ? 'Stop the story' : 'Play the story'}>
            {playing >= 0 ? '⏸' : '▶'}
          </button>
          <div>
            <div class="h">{listens ? `Listened ${listens} time${listens === 1 ? '' : 's'}` : 'Listen to the story'}</div>
            <div class="sub">Listen once or twice, then answer the questions.</div>
          </div>
        </div>
        {#if passage.transcript === 'hint'}
          <button class="chip" type="button" style="align-self:flex-start" onclick={() => (showText = !showText)}>{showText ? 'Hide the text' : 'Need a hint? Show the text'}</button>
          {#if showText}{@render textCard()}{/if}
        {:else}
          <p class="sub">No text this time: it appears after the questions.</p>
        {/if}
      {/if}
    {/if}
    {#each lesson.intro.lines as l, i}
      <div class="row line" id="line-{i}" class:later={playing >= 0 && i > heard}>
        <Avatar name={l.who} speaking={playing === i} />
        <div class="bubble" class:on={playing === i}>
          <div class="row" style="gap:8px;align-items:flex-start">
            <button type="button" class="say" onclick={() => (openLine = openLine === i ? -1 : i)} aria-expanded={openLine === i}>
              <span class="who jp">{l.who}</span>
              <span class="tl"><Ruby text={l.text} /></span>
              {#if openLine === i}<span class="sub">{l.meaning}</span>{/if}
            </button>
            <Speak text={l.text} who={l.who} />
          </div>
        </div>
      </div>
    {/each}
    {#if lesson.intro.lines.length}<p class="sub">Read it in {unit.lang === 'ja' ? 'Japanese' : 'Italian'} first. Tap a line to see what it means.</p>{/if}
    {#each lesson.intro.notes as note}
      <div class="card" class:pt={note.title.startsWith('🇧🇷')}>
        <div class="h note-h"><Ruby text={note.title} /></div>
        <p class="note"><Ruby text={note.body} /></p>
      </div>
    {/each}
  </div>
  <div class="foot"><button class="btn" type="button" onclick={startPractice}>{passage ? 'Answer the questions' : 'Start practice'}</button></div>
{:else if phase === 'ex' && ex}
  <div class="lt">
    <a class="x" href={home} aria-label="Close. Your place is saved.">✕</a>
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax={total} aria-valuenow={total - queue.length}>
      <i style="width:{((total - queue.length) / total) * 100}%"></i>
    </div>
    <span class="c-xp" style="font-weight:900">⚡ {xp}</span>
  </div>
  <div class="screen" style="padding-top:8px">
{#if passage}
      <div class="row" style="flex-wrap:wrap">
        <button class="chip" type="button" onclick={() => (playing >= 0 ? stopDialogue() : playDialogue())}>{playing >= 0 ? '⏸ Stop' : '▶ Listen again'}</button>
        {#if canSeeText}<button class="chip" type="button" onclick={() => (showText = !showText)}>{showText ? 'Hide the text' : '📖 Show the text'}</button>{/if}
      </div>
      {#if showText && canSeeText}{@render textCard()}{/if}
    {/if}
    <h1 class="h" class:tl={!!passage}><Ruby text={ex.prompt} /></h1>
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
      {#if !result.ok}<p class="sub">Saved under Review → Mistakes, so you can fix it later.</p>{/if}
      <button class="btn {result.ok ? 'ok' : 'bad'}" type="button" onclick={next}>Continue</button>
    </div>
  {:else if ex.type !== 'match'}
    <div class="foot"><button class="btn" type="button" disabled={!hasAnswer(answer)} onclick={check}>Check</button></div>
  {/if}
{:else}
  <Confetti />
  <div class="screen done">
    <div class="pop"><Pontino size={130} mood="cheer" /></div>
    <h1 class="h1">{mistakes ? (missed.size ? 'Good work' : 'Mistakes cleared!') : 'Bridge crossed!'}</h1>
    <p class="sub">
      {total - missed.size} of {total} right.
      {#if missed.size}{missed.size} saved under Review → Mistakes for another go.{/if}
    </p>
    <div class="row stats">
      <div class="card"><div class="h c-xp">⚡ {xp}</div><div class="sub">XP earned</div></div>
      <div class="card"><div class="h c-streak">🔥 {app.streak.count}</div><div class="sub">day streak</div></div>
      <div class="card"><div class="h c-br">+{newCards}</div><div class="sub">review cards</div></div>
    </div>
    <div class="card" style="width:100%"><div class="eyebrow">Today I can…</div><p class="note">{lesson.canDo}</p></div>
    {#if passage}
      <div style="width:100%;text-align:left;display:flex;flex-direction:column;gap:10px">
        <div class="eyebrow">{passage.kind === 'reading' ? 'The text' : 'The story'}</div>
        {@render textCard()}
      </div>
    {/if}
    {#if lesson.meme}<MemeCard top={lesson.meme.top} bottom={lesson.meme.bottom} />{/if}
  </div>
  <div class="foot"><a class="btn" href={mistakes ? '#/review' : '#/home'}>Continue</a></div>
{/if}

<style>
  .text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px;
  }
  .sent {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    text-align: left;
    background: none;
    border: 0;
    border-radius: 12px;
    padding: 6px 8px;
    font: inherit;
    color: inherit;
    line-height: 1.6;
    scroll-margin: 190px 0 90px;
  }
  .say {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: left;
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    color: inherit;
  }
  .sent.on {
    background: var(--brand-soft);
  }
  .gloss {
    padding-bottom: 4px;
  }
  .words {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .words li {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
  }
  .bigplay {
    flex: none;
    width: 64px;
    height: 64px;
    border-radius: 20px;
    border: 0;
    font-size: 26px;
    color: #fff;
    background: var(--brand);
    box-shadow: 0 4px 0 var(--brand-edge);
  }
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
    transition: opacity 0.35s;
    scroll-margin: 190px 0 90px;
  }
  .line.later {
    opacity: 0.28;
  }
  .actor {
    transition: transform 0.25s cubic-bezier(0.3, 1.6, 0.5, 1);
    transform-origin: bottom center;
    filter: drop-shadow(0 3px 0 rgba(0, 0, 0, 0.2));
  }
  .actor.talking {
    transform: scale(1.22);
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
