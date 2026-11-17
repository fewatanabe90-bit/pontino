<script lang="ts">
  import InterestChips from '../components/InterestChips.svelte';
  import Pontino from '../design/Pontino.svelte';
  import { db } from '../lib/db';
  import { decks } from '../lib/decks';
  import { forYouFirst, matches } from '../lib/interests';
  import { lessonHref, nextLesson, writtenUnits } from '../lib/progress';
  import type { Unit } from '../lib/schema';
  import { app, DAILY_MINUTES, setSetting } from '../lib/state.svelte';
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

  /** The first deck on a topic the learner likes that still has new cards. */
  let suggestion = $state<{ id: string; icon: string; title: string; left: number } | null>(null);
  $effect(() => {
    const mine = forYouFirst(decks.filter((d) => d.lang === app.lang), app.interests).filter((d) => matches(d.tags, app.interests));
    suggestion = null;
    void (async () => {
      for (const d of mine) {
        const left = d.cards.length - (await db.cards.where('itemId').startsWith(`${d.id}.`).count());
        if (left > 0) {
          suggestion = { id: d.id, icon: d.icon, title: d.title, left };
          return;
        }
      }
    })();
  });
  const status = $derived(streakStatus(app.streak, localDay()));
  const minutes = $derived(Math.floor(app.secondsToday[app.lang] / 60));
  const goal = $derived(Math.min(100, Math.round((app.secondsToday[app.lang] / (DAILY_MINUTES * 60)) * 100)));
  const other = $derived(app.lang === 'ja' ? ('it' as const) : ('ja' as const));
  const otherMinutes = $derived(Math.floor(app.secondsToday[other] / 60));
  const due = $derived(app.due[app.lang]);

  const line = $derived.by(() => {
    if (units && !units.length) return 'Lessons are on their way.';
    if (units && !next) return 'You finished everything written so far. More bridges are being built!';
    const ja = app.lang === 'ja';
    // "Done" only once the daily minutes for this language are really in.
    if (minutes >= DAILY_MINUTES) {
      return ja ? `おつかれさま！ ${DAILY_MINUTES} minutes done for today. Extra practice is always welcome.` : `Bravo! ${DAILY_MINUTES} minutes done for today. Extra practice is always welcome.`;
    }
    if (minutes > 0) {
      const left = DAILY_MINUTES - minutes;
      const so = `${minutes} of ${DAILY_MINUTES} minutes so far, ${left} to go.`;
      return ja ? `いいですね！ ${so}` : `Bene! ${so}`;
    }
    if (status.atRisk) return `One short lesson keeps the streak alive. ${DAILY_MINUTES} minutes is the goal, no pressure.`;
    const hour = new Date().getHours();
    const hello = ja ? (hour < 11 ? 'おはよう！' : hour < 18 ? 'こんにちは！' : 'こんばんは！') : hour < 13 ? 'Buongiorno!' : hour < 18 ? 'Buon pomeriggio!' : 'Buonasera!';
    return `${hello} ${DAILY_MINUTES} minutes today: ready to cross the next bridge?`;
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

  {#if !app.interestsSet}
    <div class="card pick">
      <div class="h">What are you into?</div>
      <div class="sub">Pontino sets lessons in these worlds and offers matching vocabulary first. Change it any time in Profile.</div>
      <InterestChips />
      <button class="btn" type="button" onclick={() => setSetting('interestsSet', true)}>Save my interests</button>
    </div>
  {/if}

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
      <div>
        <div class="h">Daily goal</div>
        <div class="sub">{minutes} / {DAILY_MINUTES} min today</div>
        <div class="sub">{other === 'ja' ? '日本語' : 'Italiano'}: {otherMinutes} / {DAILY_MINUTES} min</div>
      </div>
    </div>
    <a class="card mini link" href="#/review">
      <div class="h">Review</div>
      <div class="sub">{due === 0 ? 'Nothing due' : `${due} card${due === 1 ? '' : 's'} due`}</div>
      {#if due > 0}<span class="chip" style="margin-top:8px">Start ›</span>{/if}
    </a>
  </div>

  {#if suggestion}
    <a class="card mini link row" href="#/deck/{suggestion.id}">
      <span class="sug" aria-hidden="true">{suggestion.icon}</span>
      <span style="flex:1">
        <span class="eyebrow">For you · flashcards</span>
        <span class="h" style="display:block">{suggestion.title}</span>
        <span class="sub">{suggestion.left} new card{suggestion.left === 1 ? '' : 's'} to learn</span>
      </span>
      <span class="chip">Open ›</span>
    </a>
  {/if}

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
  .pick {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-color: var(--brand);
  }
  .sug {
    flex: none;
    width: 52px;
    height: 52px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    font-size: 28px;
    background: var(--brand-soft);
  }
  .link.row {
    display: flex;
  }
  .link {
    text-decoration: none;
    color: inherit;
    display: block;
  }
</style>
