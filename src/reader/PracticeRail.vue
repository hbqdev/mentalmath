<script setup lang="ts">
import { computed } from 'vue'
import { useProgress } from '@/app/progress'
import { practiceSetsFor } from '@/practice/registry'

const props = defineProps<{ chapterId: string }>()
const { bestScore, isUnlocked } = useProgress()
const sets = computed(() => practiceSetsFor(props.chapterId))
</script>

<template>
  <aside class="rail" aria-label="Practice">
    <p class="label">Practice · this chapter</p>
    <p v-if="sets.length === 0" class="empty">No practice sets in this chapter.</p>
    <ul v-else>
      <li
        v-for="s in sets"
        :key="s.id"
        class="card"
        :class="{ locked: !isUnlocked(chapterId, s.sectionId) }"
      >
        <strong>{{ s.kind === 'book' ? '📖 ' : '' }}{{ s.title }}</strong>
        <span class="meta"
          >{{ s.kind === 'book' ? 'Book set' : 'Generated'
          }}<template v-if="s.count"> · {{ s.count }} problems</template></span
        >
        <span v-if="bestScore(s.id) !== undefined" class="meta">Best {{ bestScore(s.id) }}</span>
        <RouterLink
          v-if="isUnlocked(chapterId, s.sectionId)"
          class="go"
          :to="{ name: 'practice', params: { chapter: chapterId, set: s.id } }"
          >Start</RouterLink
        >
        <span v-else class="meta">Unlocks when you read its section</span>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.rail {
  font-family: var(--font-sans);
  font-size: 0.85rem;
}
.empty {
  color: var(--muted);
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
}
.card {
  display: grid;
  gap: 0.15rem;
  padding: 0.7rem 0.8rem;
  background: var(--card);
  border: 1px solid var(--card-rule);
  border-radius: var(--radius);
}
.card.locked {
  opacity: 0.6;
}
.meta {
  color: var(--muted);
  font-size: 0.78rem;
}
.go {
  justify-self: start;
  margin-top: 0.3rem;
  background: var(--accent);
  color: var(--accent-ink);
  font-weight: 700;
  padding: 0.25rem 0.7rem;
  border-radius: 4px;
  font-size: 0.78rem;
}
.go:hover {
  text-decoration: none;
}
</style>
