<script setup lang="ts">
import { computed } from 'vue'
import { useProgress } from '@/app/progress'
import { generatedTwin, setTitle } from '@/exercises/registry'

const props = defineProps<{ setId: string; chapterId: string; sectionId: string }>()
const { isUnlocked } = useProgress()
const unlocked = computed(() => isUnlocked(props.chapterId, props.sectionId))
const title = computed(() => setTitle(props.setId))
const twin = computed(() => generatedTwin(props.setId))
</script>

<template>
  <div class="callout" :class="{ locked: !unlocked }">
    <div class="text">
      <p class="label">Exercise</p>
      <h4>{{ title }}</h4>
      <p v-if="unlocked" class="meta">Problems from the book, answers with the authors' steps.</p>
      <p v-else class="meta">Unlocks after you read this section.</p>
    </div>
    <div class="btns">
      <RouterLink
        v-if="unlocked"
        class="btn primary"
        :to="{ name: 'practice', params: { chapter: chapterId, set: setId } }"
        >Book set</RouterLink
      >
      <RouterLink
        v-if="unlocked && twin"
        class="btn ghost"
        :to="{ name: 'practice', params: { chapter: chapterId, set: twin.id }, query: { mode: 'generated' } }"
        >Generate</RouterLink
      >
      <button v-else-if="unlocked" type="button" class="btn ghost" disabled title="No generated drill for this set">
        Generate
      </button>
    </div>
  </div>
</template>

<style scoped>
.callout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin: 1.25em 0 1.5em;
  padding: 0.85rem 1rem;
  background: var(--card);
  border: 1px solid var(--card-rule);
  border-left: 3px solid var(--warm);
  border-radius: var(--radius);
  font-family: var(--font-sans);
}
.callout.locked {
  opacity: 0.75;
}
h4 {
  font-size: 0.95rem;
  letter-spacing: 0.04em;
  margin: 0.1rem 0;
}
.meta {
  margin: 0;
  font-size: 0.8rem;
  color: var(--muted);
}
.btns {
  display: flex;
  gap: 0.5rem;
}
.btn {
  border-radius: 4px;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid var(--accent);
}
.btn.primary {
  background: var(--accent);
  color: var(--accent-ink);
}
.btn.primary:hover {
  text-decoration: none;
  filter: brightness(1.08);
}
.btn.ghost {
  background: transparent;
  color: var(--accent);
}
.btn.ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
