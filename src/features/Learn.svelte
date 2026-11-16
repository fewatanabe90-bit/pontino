<script lang="ts">
  import Pontino from '../design/Pontino.svelte';
  import { catalog } from '../lib/content';
  import { interestIcons, matches } from '../lib/interests';
  import { lessonHref, nextLesson, writtenUnits } from '../lib/progress';
  import type { Unit } from '../lib/schema';
  import { app } from '../lib/state.svelte';
  import TopBar from './TopBar.svelte';

  let units = $state<Unit[]>([]);
  $effect(() => {
    const lang = app.lang;
    writtenUnits(lang).then((u) => {
      if (app.lang === lang) units = u;
    });
  });

  const entries = $derived(catalog.filter((c) => c.lang === app.lang));
  const next = $derived(nextLesson(units, app.lessons));
  const unitOf = (id: string) => units.find((u) => u.id === id);
  const isDone = (id: string) => app.lessons[id]?.status === 'done';
</script>

<div class="screen">
  <div class="pattern"></div>
  <TopBar />
  <ol class="path">
    {#each entries as entry, i (entry.id)}
      {@const unit = unitOf(entry.id)}
      {@const complete = !!unit && unit.lessons.every((l) => isDone(l.id))}
      {@const current = next?.unit.id === entry.id}
      <li class:alt={i % 2 === 1}>
        <div class="stop">
          {#if current}<div class="here"><Pontino size={56} bob /></div>{/if}
          <div class="node" class:lock={!unit} class:trip={entry.track === 'trip' && !!unit} class:now={current} aria-hidden="true">
            {complete ? '✓' : unit ? entry.icon : '🔒'}
          </div>
          <div class="label">
            <div class="name">{entry.title}{#if matches(entry.tags, app.interests)} <span class="tags" title="Matches your interests">{interestIcons(entry.tags?.filter((t) => app.interests.includes(t)))}</span>{/if}</div>
            <div class="sub jp">{entry.sub}</div>
            {#if !unit}<div class="soon">Coming soon</div>{/if}
          </div>
        </div>
        {#if unit}
          <div class="card lessons">
            {#each unit.lessons as lesson, n (lesson.id)}
              {@const done = isDone(lesson.id)}
              {@const open = done || next?.lesson.id === lesson.id}
              <a class="lesson" class:locked={!open} href={open ? lessonHref(unit.id, lesson.id) : undefined} aria-disabled={!open}>
                <span class="dot" class:done>{done ? '✓' : n + 1}</span>
                <span class="lt">{lesson.title}</span>
                <span class="go">{done ? 'Redo' : open ? 'Start ›' : ''}</span>
              </a>
            {/each}
          </div>
        {/if}
      </li>
    {/each}
  </ol>
</div>

<style>
  .path {
    list-style: none;
    padding: 8px 0 0;
    display: flex;
    flex-direction: column;
    gap: 22px;
    position: relative;
  }
  .path::before {
    content: '';
    position: absolute;
    top: 30px;
    bottom: 30px;
    left: 34px;
    width: 12px;
    border-radius: 999px;
    background: var(--river);
  }
  li {
    position: relative;
  }
  .stop {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .node {
    flex: none;
    width: 64px;
    height: 64px;
    margin-left: 8px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 26px;
    font-weight: 900;
    color: #fff;
    background: var(--accent2);
    box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3);
  }
  .node.trip {
    background: var(--brand);
    box-shadow: 0 6px 0 var(--brand-edge);
  }
  .node.lock {
    background: var(--lock);
    box-shadow: 0 6px 0 var(--lock-edge);
    font-size: 20px;
  }
  .node.now {
    outline: 5px solid var(--brand-soft);
    outline-offset: 3px;
  }
  .here {
    position: absolute;
    right: 0;
    top: -6px;
  }
  .name {
    font-weight: 900;
    font-size: 17px;
  }
  .tags {
    font-size: 13px;
  }
  .soon {
    font-size: 12px;
    font-weight: 800;
    color: var(--muted);
  }
  .lessons {
    margin: 12px 0 0 26px;
    padding: 4px 14px;
  }
  .lesson {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    text-decoration: none;
    color: inherit;
    font-weight: 800;
    font-size: 15px;
    border-bottom: 2px solid var(--line);
  }
  .lesson:last-child {
    border: 0;
  }
  .lesson.locked {
    color: var(--muted);
  }
  .lt {
    flex: 1;
    line-height: 1.3;
  }
  .dot {
    flex: none;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--line);
    font-size: 13px;
    font-weight: 900;
  }
  .dot.done {
    background: var(--ok);
    color: #fff;
  }
  .go {
    color: var(--brand);
    font-size: 13px;
    white-space: nowrap;
  }
</style>
