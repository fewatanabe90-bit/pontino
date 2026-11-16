<script lang="ts">
  import Pontino from '../design/Pontino.svelte';
  import { lessonHref, nextLesson, writtenUnits } from '../lib/progress';
  import type { Unit } from '../lib/schema';
  import { app, DAILY_XP_GOAL } from '../lib/state.svelte';
  import { localDay, streakStatus } from '../lib/streak';
  import InstallGuide from './InstallGuide.svelte';
  import TopBar from './TopBar.svelte';

  let units = $state<Unit[] | null>(null);
  $effect(() => {
    const lang = app.lang;
    units = null;
    writtenUnits(lang).then((u) => {
      if (app.lang === lang) units = u;
    });
  });

  const next = $derived(units ? nextLesson(units, app.lessons) : null);
  const status = $derived(streakStatus(app.streak, localDay()));
  const goal = $derived(Math.min(100, Math.round((app.xpToday / DAILY_XP_GOAL) * 100)));
  const due = $derived(app.due[app.lang]);

  const line = $derived.by(() => {
    if (units && !units.length) return 'Lessons are on their way.';
    if (units && !next) return 'You finished everything written so far. More bridges are being built!';
    if (status.atRisk) return 'One short lesson keeps the streak alive. No pressure.';
    if (status.doneToday) return app.lang === 'ja' ? 'おつかれさま！ Done for today. Extra practice is always welcome.' : 'Bravo! Done for today.';
    return app.lang === 'ja' ? 'おはよう！ Ready to cross the next bridge?' : 'Buongiorno! Andiamo?';
  });
</script>

<div class="screen">
  <div class="pattern"></div>
  <TopBar />
  <div class="row">
    <Pontino bob mood={status.atRisk ? 'sleepy' : 'happy'} />
    <div class="bubble">{line}</div>
  </div>

  <InstallGuide />

  {#if next}
    <div class="card">
      <div class="eyebrow">{next.unit.title} · Lesson {next.n} of {next.unit.lessons.length}</div>
      <div class="h" style="margin:6px 0 4px">{next.lesson.title}</div>
      <div class="sub" style="margin-bottom:14px">About 10 minutes · {next.lesson.exercises.length} exercises</div>
      <a class="btn" href={lessonHref(next.unit.id, next.lesson.id)}>{next.resume ? 'Continue' : 'Start lesson'}</a>
    </div>
  {/if}

  <div class="two">
    <div class="card row mini">
      <div class="ring" style="--p:{goal}">{goal}%</div>
      <div><div class="h">Daily goal</div><div class="sub">{app.xpToday} / {DAILY_XP_GOAL} XP</div></div>
    </div>
    <a class="card mini link" href="#/review">
      <div class="h">Review</div>
      <div class="sub">{due === 0 ? 'Nothing due' : `${due} card${due === 1 ? '' : 's'} due`}</div>
      {#if due > 0}<span class="chip" style="margin-top:8px">Start ›</span>{/if}
    </a>
  </div>

  {#if app.streak.freezes > 0}
    <p class="sub" style="text-align:center">🧊 {app.streak.freezes} streak freeze{app.streak.freezes === 1 ? '' : 's'} saved for a busy day</p>
  {/if}
</div>

<style>
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .mini {
    padding: 12px;
  }
  .mini .h {
    font-size: 15px;
  }
  .mini .sub {
    font-size: 12px;
  }
  .link {
    text-decoration: none;
    color: inherit;
    display: block;
  }
</style>
