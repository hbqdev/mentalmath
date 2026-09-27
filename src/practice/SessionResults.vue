<script setup lang="ts">
defineProps<{
  correct: number
  total: number
  seconds: number
  seed?: number
  mode: string
  best?: number
  /** Generated drill for the same technique, offered after a book set. */
  twin?: { chapterId: string; setId: string; title: string }
}>()
const emit = defineEmits<{ again: []; back: [] }>()
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
</script>

<template>
  <section class="results" data-testid="results">
    <p class="label">Results</p>
    <p class="score" data-testid="results-score">{{ correct }} / {{ total }}</p>
    <p class="meta">
      {{ Math.round((correct / Math.max(1, total)) * 100) }}% · {{ clock(seconds) }}
      <template v-if="best !== undefined"> · best {{ best }}</template>
    </p>
    <p v-if="seed !== undefined" class="meta seed">Seed {{ seed }} · {{ mode }}</p>
    <div class="btns">
      <button type="button" class="btn primary" data-testid="practice-again" @click="emit('again')">Practice again</button>
      <button type="button" class="btn ghost" data-testid="back-to-chapter" @click="emit('back')">Back to chapter</button>
    </div>
    <p v-if="twin" class="twin">
      Keep going with endless generated problems:
      <RouterLink data-testid="generated-twin" :to="{ name: 'practice', params: { chapter: twin.chapterId, set: twin.setId }, query: { mode: 'generated' } }">{{ twin.title }} ›</RouterLink>
    </p>
  </section>
</template>

<style scoped>
.results {
  text-align: center;
  padding: 2rem 0;
}
.score {
  font-family: var(--font-mono);
  font-size: clamp(2.5rem, 8vw, 4rem);
  font-weight: 700;
  margin: 0.25rem 0;
}
.meta {
  color: var(--muted);
  margin: 0.2rem 0;
  font-family: var(--font-sans);
}
.seed {
  font-size: 0.8rem;
}
.btns {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}
.btn {
  font-family: var(--font-sans);
  font-weight: 700;
  padding: 0.6rem 1.1rem;
  border-radius: var(--radius);
  border: 1px solid var(--accent);
}
.btn.primary {
  background: var(--accent);
  color: var(--accent-ink);
}
.btn.ghost {
  background: transparent;
  color: var(--accent);
}
.twin {
  margin-top: 1.5rem;
  font-family: var(--font-sans);
  color: var(--muted);
}
</style>
