<script setup lang="ts">
import { computed } from 'vue'
import { useProgress } from '@/app/progress'
import { allSetsFor } from '@/exercises/registry'

const props = defineProps<{ chapterId: string }>()
const { state, bestScore, isUnlocked } = useProgress()
const lastAttempt = (id: string) => state.value.practice[id]?.attempts.at(-1)
const sets = computed(() =>
  allSetsFor(props.chapterId).map((s) =>
    s.kind === 'book'
      ? { id: s.ref.id, sectionId: s.ref.sectionId, title: s.ref.title, kind: 'book' as const }
      : {
          id: s.def.id,
          sectionId: s.def.sectionId,
          title: s.def.title,
          kind: 'generated' as const,
        },
  ),
)
</script>

<template>
  <aside class="rail" data-testid="practice-rail" aria-label="Practice">
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
        <span class="meta">{{ s.kind === 'book' ? 'Book set' : 'Generated' }}</span>
        <span v-if="bestScore(s.id) !== undefined" class="meta"
          >Best {{ bestScore(s.id)
          }}<template v-if="lastAttempt(s.id)">
            · last {{ lastAttempt(s.id)!.correct }} / {{ lastAttempt(s.id)!.total }}</template
          ></span
        >
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
