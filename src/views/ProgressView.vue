<script setup lang="ts">
import { computed } from 'vue'
import { useProgress } from '@/app/progress'
import { chapterCompletion } from '@/app/completion'
import { readableChapters } from '@/content/loader'
import { findGenerated } from '@/exercises/generators'
import { setTitle } from '@/exercises/registry'

const { state } = useProgress()

const chapters = computed(() =>
  readableChapters()
    .filter((c) => c.number !== null)
    .map((c) => ({ meta: c, ...chapterCompletion(c, state.value.reading[c.id]?.visited) })),
)
const attempts = computed(() =>
  Object.entries(state.value.practice).flatMap(([setId, e]) =>
    e.attempts.map((a) => ({ setId, ...a })),
  ),
)
const totals = computed(() => ({
  sets: attempts.value.length,
  problems: attempts.value.reduce((n, a) => n + a.total, 0),
  correct: attempts.value.reduce((n, a) => n + a.correct, 0),
  minutes: Math.round(attempts.value.reduce((n, a) => n + a.seconds, 0) / 60),
}))
const techniques = computed(() =>
  Object.entries(state.value.practice)
    .map(([setId, e]) => {
      const last = e.attempts.at(-1)
      const chapterId = setId.replace(/^(?:ch|gen)([^-]+)-.*/, '$1')
      return {
        setId,
        chapterId,
        title: findGenerated(setId)?.title ?? setTitle(setId),
        kind: setId.startsWith('gen') ? 'Generated' : 'Book set',
        best: e.best,
        total: last?.total ?? 0,
        last: last ? `${last.correct} / ${last.total}` : '',
        count: e.attempts.length,
        at: last?.at ?? '',
        accuracy: Math.round(
          (e.attempts.reduce((n, a) => n + a.correct, 0) /
            Math.max(
              1,
              e.attempts.reduce((n, a) => n + a.total, 0),
            )) *
            100,
        ),
      }
    })
    .sort((a, b) => b.at.localeCompare(a.at)),
)
const weak = computed(() => techniques.value.filter((t) => t.accuracy < 80).slice(0, 5))
</script>

<template>
  <div class="progress">
    <h1>Progress</h1>

    <section class="stats" data-testid="progress-totals">
      <div>
        <strong>{{ state.streak.current }}</strong
        ><span>day streak</span>
      </div>
      <div>
        <strong>{{ totals.problems }}</strong
        ><span>problems answered</span>
      </div>
      <div>
        <strong
          >{{ totals.problems ? Math.round((totals.correct / totals.problems) * 100) : 0 }}%</strong
        ><span>accuracy</span>
      </div>
      <div>
        <strong>{{ totals.minutes }}</strong
        ><span>minutes practised</span>
      </div>
    </section>

    <section>
      <h2>Reading</h2>
      <ul class="chapters">
        <li v-for="c in chapters" :key="c.meta.id">
          <RouterLink :to="{ name: 'read', params: { chapter: c.meta.id } }" class="row">
            <span class="k">{{ c.meta.kicker }}</span>
            <span class="t">{{ c.meta.title }}</span>
            <span class="n">{{ c.done }} / {{ c.total }}</span>
            <span class="bar"><i :style="{ width: `${Math.round(c.fraction * 100)}%` }" /></span>
          </RouterLink>
        </li>
      </ul>
    </section>

    <section v-if="weak.length">
      <h2>Worth another go</h2>
      <ul class="techs">
        <li v-for="t in weak" :key="t.setId">
          <RouterLink :to="{ name: 'practice', params: { chapter: t.chapterId, set: t.setId } }">{{
            t.title
          }}</RouterLink>
          <span class="meta"
            >{{ t.accuracy }}% over {{ t.count }} {{ t.count === 1 ? 'set' : 'sets' }}</span
          >
        </li>
      </ul>
    </section>

    <section>
      <h2>Practice history</h2>
      <p v-if="techniques.length === 0" class="empty" data-testid="progress-empty">
        No practice yet. <RouterLink :to="{ name: 'practice-hub' }">Pick a technique ›</RouterLink>
      </p>
      <ul v-else class="techs" data-testid="progress-techniques">
        <li v-for="t in techniques" :key="t.setId">
          <RouterLink :to="{ name: 'practice', params: { chapter: t.chapterId, set: t.setId } }">{{
            t.title
          }}</RouterLink>
          <span class="meta"
            >{{ t.kind }} · best {{ t.best }} / {{ t.total }} · last {{ t.last }} ·
            {{ t.count }}×</span
          >
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.progress {
  max-width: 44rem;
  margin: 0 auto;
  padding: 1.5rem var(--gutter) 5rem;
  font-family: var(--font-sans);
}
h1 {
  font-size: 1.8rem;
  margin: 0 0 1rem;
}
h2 {
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 1.5rem 0 0.6rem;
}
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.6rem;
}
.stats div {
  background: var(--card);
  border: 1px solid var(--card-rule);
  border-radius: var(--radius);
  padding: 0.8rem 0.9rem;
  display: grid;
}
.stats strong {
  font-family: var(--font-mono);
  font-size: 1.6rem;
}
.stats span {
  color: var(--muted);
  font-size: 0.8rem;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.chapters .row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas: 'k t n' 'bar bar bar';
  gap: 0.15rem 0.75rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid var(--rule);
  color: var(--ink);
}
.chapters .row:hover {
  text-decoration: none;
}
.k {
  grid-area: k;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  align-self: center;
}
.t {
  grid-area: t;
  font-weight: 600;
}
.n {
  grid-area: n;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--muted);
}
.bar {
  grid-area: bar;
  height: 4px;
  background: var(--rule);
  border-radius: 2px;
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  background: var(--accent);
}
.techs li {
  display: grid;
  gap: 0.1rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid var(--rule);
}
.techs a {
  font-weight: 600;
}
.meta,
.empty {
  color: var(--muted);
  font-size: 0.85rem;
}
</style>
