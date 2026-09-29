<script setup lang="ts">
import { computed } from 'vue'
import { useProgress } from '@/app/progress'
import { createRng } from '@/exercises/rng'
import { dueTechniques, type DueItem } from './schedule'

/** Spaced review: techniques whose interval has lapsed, with a one-tap generated drill. */
const { state } = useProgress()
const review = computed(() => dueTechniques(state.value.practice, new Date()))
const practiced = computed(() => review.value.due.length > 0 || !!review.value.next)

function drillTo(item: DueItem) {
  return {
    name: 'practice',
    params: { chapter: item.chapterId, set: item.setId },
    query: { mode: 'generated', seed: String(createRng().seed) },
  }
}
function when(item: DueItem) {
  if (item.overdueDays <= 0) return 'due today'
  if (item.overdueDays === 1) return '1 day overdue'
  return `${item.overdueDays} days overdue`
}
function nextIn(item: DueItem) {
  const days = Math.max(1, Math.ceil((Date.parse(item.dueAt) - Date.now()) / 86_400_000))
  return days === 1 ? 'tomorrow' : `in ${days} days`
}
</script>

<template>
  <section v-if="practiced" class="due" data-testid="due-today">
    <h2 class="label">Due today</h2>
    <ul v-if="review.due.length">
      <li v-for="d in review.due" :key="d.setId" :data-testid="`due-item-${d.setId}`">
        <div class="what">
          <strong>{{ d.title }}</strong>
          <span class="meta">last {{ d.lastPct }}% · {{ when(d) }}</span>
        </div>
        <RouterLink class="go" :to="drillTo(d)">Practice ›</RouterLink>
      </li>
    </ul>
    <p v-else class="empty" data-testid="due-empty">
      Nothing due today.
      <template v-if="review.next">
        Up next:
        <RouterLink data-testid="due-next" :to="drillTo(review.next)">{{
          review.next.title
        }}</RouterLink>
        {{ nextIn(review.next) }}.
      </template>
    </p>
  </section>
</template>

<style scoped>
.due {
  margin-top: 2rem;
  font-family: var(--font-sans);
}
ul {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
}
li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid var(--rule);
}
.what {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.meta {
  color: var(--muted);
  font-size: 0.85rem;
}
.go {
  flex: none;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  padding: 0 0.9rem;
  border-radius: var(--radius);
  background: var(--accent);
  color: var(--accent-ink);
  font-weight: 700;
}
.go:hover {
  text-decoration: none;
  filter: brightness(1.08);
}
.empty {
  margin: 0.5rem 0 0;
  color: var(--muted);
}
</style>
