<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProgress } from '@/app/progress'
import { getChapterMeta } from '@/content/loader'
import { bookExercises } from '@/exercises/bookSets'
import { generateMany } from '@/exercises/generators/shared'
import { findSet, generatedTwin, type SetRef } from '@/exercises/registry'
import { createRng } from '@/exercises/rng'
import type { Difficulty, Exercise } from '@/exercises/types'
import AnswerInput from './AnswerInput.vue'
import PromptRenderer from './PromptRenderer.vue'
import SessionResults from './SessionResults.vue'
import SetLockedView from './SetLockedView.vue'
import SolutionSteps from './SolutionSteps.vue'
import { usePracticeSession } from './usePracticeSession'

const route = useRoute()
const router = useRouter()
const { state: progress, isUnlocked, recordAttempt, bestScore } = useProgress()
const { state, seconds, start, submit, next } = usePracticeSession()

const chapterId = computed(() => String(route.params.chapter ?? ''))
const setId = computed(() => String(route.params.set ?? ''))
const set = computed<SetRef | undefined>(() => findSet(chapterId.value, setId.value))
const meta = computed(() => getChapterMeta(chapterId.value))

const sectionId = computed(() => (set.value?.kind === 'book' ? set.value.ref.sectionId : set.value?.def.sectionId) ?? '')
const sectionTitle = computed(() => meta.value?.sections.find((s) => s.id === sectionId.value)?.title ?? sectionId.value)
const title = computed(() => (set.value?.kind === 'book' ? set.value.ref.title : set.value?.def.title) ?? '')
const description = computed(() => (set.value?.kind === 'generated' ? set.value.def.description : 'Problems from the book.'))
const twin = computed(() => (set.value?.kind === 'book' ? generatedTwin(set.value.ref.id) : undefined))

const timed = computed(() => route.query.timed === '1')
const difficulty = computed<Difficulty | 'mixed'>(() => {
  const d = String(route.query.difficulty ?? 'mixed')
  return d === 'easy' || d === 'medium' || d === 'hard' ? d : 'mixed'
})
const mode = computed<'book' | 'generated'>(() => {
  const q = route.query.mode
  if (q === 'book' || q === 'generated') return q
  return set.value?.kind === 'book' ? 'book' : 'generated'
})
const locked = computed(() => !!set.value && !isUnlocked(chapterId.value, sectionId.value))

const seed = ref<number | undefined>(undefined)
const status = ref<'idle' | 'running' | 'empty'>('idle')
const answerBox = ref<InstanceType<typeof AnswerInput> | null>(null)
let recorded = false

function buildExercises(): Exercise[] {
  const s = set.value
  if (!s) return []
  if (mode.value === 'book' && s.kind === 'book') return bookExercises(s.ref.id)
  const def = s.kind === 'generated' ? s.def : generatedTwin(s.ref.id)
  if (!def) return []
  const q = Number(route.query.seed)
  const rng = createRng(Number.isFinite(q) && route.query.seed !== undefined ? q : undefined)
  seed.value = rng.seed
  return generateMany(def, 10, difficulty.value, rng)
}

function begin() {
  recorded = false
  seed.value = undefined
  if (!set.value || locked.value) {
    status.value = 'idle'
    return
  }
  // A book set asked for in generated mode runs (and records) as its generated twin.
  if (set.value.kind === 'book' && route.query.mode === 'generated') {
    const t = generatedTwin(set.value.ref.id)
    if (t) {
      router.replace({ name: 'practice', params: { chapter: chapterId.value, set: t.id }, query: route.query })
      return
    }
  }
  const exercises = buildExercises()
  if (exercises.length === 0) {
    status.value = 'empty'
    return
  }
  status.value = 'running'
  start(exercises)
  nextTick(() => answerBox.value?.focus())
}

watch(
  () => [chapterId.value, setId.value, route.query.mode, route.query.seed, route.query.difficulty, route.query.timed, locked.value],
  begin,
  { immediate: true },
)

watch(
  () => state.value?.phase,
  (phase) => {
    if (phase !== 'done' || recorded || !state.value || !set.value) return
    recorded = true
    recordAttempt(setId.value, {
      at: new Date().toISOString(),
      correct: state.value.correct,
      total: state.value.total,
      seconds: seconds.value,
      mode: timed.value ? 'timed' : mode.value,
    })
  },
)

function onSubmit(input: string) {
  submit(input)
}

function onNext() {
  next()
  answerBox.value?.reset()
  nextTick(() => answerBox.value?.focus())
}

/** Enter submits while answering (handled by the input) and advances while feedback is shown. */
function onEnter() {
  if (state.value?.phase === 'feedback') onNext()
}

function again() {
  const fresh = createRng().seed
  router.replace({ query: { ...route.query, seed: mode.value === 'generated' ? String(fresh) : undefined } })
  if (mode.value !== 'generated') begin()
}

function back() {
  router.push({ name: 'read', params: { chapter: chapterId.value, section: sectionId.value } })
}

const kicker = computed(() => `${meta.value?.kicker ?? ''} · ${sectionTitle.value}`)
const focusMode = computed(() => progress.value.settings.focus)
</script>

<template>
  <div class="practice" :class="{ focus: focusMode }" @keyup.enter="onEnter">
    <section v-if="!set" class="state" data-testid="set-not-found">
      <p class="kicker">Not found</p>
      <h1>No such practice set in this chapter.</h1>
      <RouterLink :to="{ name: 'read', params: { chapter: chapterId } }">Back to the chapter</RouterLink>
    </section>

    <SetLockedView v-else-if="locked" :chapter-id="chapterId" :section-id="sectionId" :section-title="sectionTitle" :title="title" />

    <template v-else>
      <header class="head">
        <div>
          <p class="kicker">{{ kicker }}</p>
          <h1>{{ title }}</h1>
          <p class="desc">{{ description }}</p>
        </div>
        <div v-if="status === 'running' && state" class="hud">
          <span data-testid="practice-progress">{{ Math.min(state.index + 1, state.total) }} / {{ state.total }}</span>
          <span v-if="timed || state.phase === 'done'" class="clock">{{ Math.floor(seconds / 60) }}:{{ String(seconds % 60).padStart(2, '0') }}</span>
        </div>
      </header>

      <section v-if="status === 'empty'" class="state" data-testid="set-empty">
        <p>The book's problems for this set arrive soon.</p>
        <RouterLink
          v-if="twin"
          class="btn"
          :to="{ name: 'practice', params: { chapter: chapterId, set: twin.id }, query: { mode: 'generated' } }"
          >Practice generated problems instead ›</RouterLink
        >
      </section>

      <section v-else-if="state && state.phase !== 'done' && state.current" class="card">
        <PromptRenderer :prompt="state.current.prompt" />
        <AnswerInput ref="answerBox" :spec="state.current.answer" :disabled="state.phase === 'feedback'" @submit="onSubmit" />

        <div v-if="state.phase === 'feedback' && state.lastResult" class="feedback" :class="state.lastResult.correct ? 'ok' : 'bad'" data-testid="feedback" aria-live="polite">
          <p class="verdict">
            <template v-if="state.lastResult.correct">Correct.</template>
            <template v-else>Not quite. The answer is <strong>{{ state.lastResult.shown }}</strong>.</template>
          </p>
          <SolutionSteps v-if="state.current.solution?.steps?.length" :steps="state.current.solution.steps" />
          <button type="button" class="btn next" data-testid="next-button" @click="onNext">
            {{ state.index < state.total - 1 ? 'Next ›' : 'See results ›' }}
          </button>
        </div>
      </section>

      <SessionResults
        v-else-if="state && state.phase === 'done'"
        :correct="state.correct"
        :total="state.total"
        :seconds="seconds"
        :seed="mode === 'generated' ? seed : undefined"
        :mode="timed ? 'timed' : mode"
        :best="bestScore(setId)"
        @again="again"
        @back="back"
      />
    </template>
  </div>
</template>

<style scoped>
.practice {
  max-width: 48rem;
  margin: 0 auto;
  padding: 1.5rem var(--gutter) 5rem;
}
.state {
  text-align: center;
  padding: 2rem 0;
}
.state h1 {
  font-size: 1.5rem;
  margin: 0.25rem 0 1rem;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}
.head h1 {
  font-size: clamp(1.4rem, 3vw, 1.9rem);
  margin: 0.15rem 0 0.25rem;
}
.desc {
  color: var(--muted);
  margin: 0;
  font-family: var(--font-sans);
  font-size: 0.95rem;
}
.hud {
  display: flex;
  gap: 0.75rem;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--muted);
  white-space: nowrap;
  padding-top: 0.4rem;
}
.card {
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 1.25rem 1rem 1.5rem;
  text-align: center;
}
.feedback {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--rule);
  font-family: var(--font-sans);
}
.verdict {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}
.feedback.ok .verdict {
  color: #2f7a3d;
}
[data-theme='dark'] .feedback.ok .verdict {
  color: #7fd18b;
}
.feedback.bad .verdict {
  color: var(--accent);
}
.btn {
  display: inline-block;
  font-family: var(--font-sans);
  font-weight: 700;
  padding: 0.6rem 1.1rem;
  border-radius: var(--radius);
  border: 1px solid var(--accent);
  background: var(--accent);
  color: var(--accent-ink);
  margin-top: 1rem;
}
.btn:hover {
  text-decoration: none;
  filter: brightness(1.08);
}
</style>
