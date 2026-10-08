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
import WorksheetView from './WorksheetView.vue'
import { usePracticeSession } from './usePracticeSession'
import DrillScreen from './DrillScreen.vue'
import { useIsPhone } from '@/app/useIsPhone'
import { hapticResult, keepAwake } from '@/app/native'
import { clearRun, loadRun, runKey, saveRun } from './resume'
import { onBeforeUnmount, watchEffect } from 'vue'
import TimedSheet from './TimedSheet.vue'
import {
  bestKey,
  clock,
  describeBest,
  describeTimed,
  improves,
  parseTimed,
  timedQuery,
  type TimedOptions,
} from './timing'

const route = useRoute()
const router = useRouter()
const { state: progress, isUnlocked, recordAttempt, bestScore, bests, recordBest } = useProgress()
const { state, seconds, timeLeft, shotFraction, start, submit, next } = usePracticeSession()
const isPhone = useIsPhone()
const showTimer = computed(() => timed.value || progress.value.settings.showTimer)

const chapterId = computed(() => String(route.params.chapter ?? ''))
const setId = computed(() => String(route.params.set ?? ''))
const set = computed<SetRef | undefined>(() => findSet(chapterId.value, setId.value))
const meta = computed(() => getChapterMeta(chapterId.value))

const sectionId = computed(
  () => (set.value?.kind === 'book' ? set.value.ref.sectionId : set.value?.def.sectionId) ?? '',
)
const sectionTitle = computed(
  () => meta.value?.sections.find((s) => s.id === sectionId.value)?.title ?? sectionId.value,
)
const title = computed(
  () => (set.value?.kind === 'book' ? set.value.ref.title : set.value?.def.title) ?? '',
)
const description = computed(() =>
  set.value?.kind === 'generated' ? set.value.def.description : 'Problems from the book.',
)
const twin = computed(() =>
  set.value?.kind === 'book' ? generatedTwin(set.value.ref.id) : undefined,
)

/** Timed options from the query; null for an ordinary run. */
const timedOpts = computed<TimedOptions | null>(() => parseTimed(route.query))
const timed = computed(() => timedOpts.value !== null)
const sprint = computed(() => !!timedOpts.value?.sprint)
const showTimedSheet = ref(false)
const newBest = ref<string | undefined>(undefined)
function startTimed(opts: TimedOptions) {
  showTimedSheet.value = false
  clearRun(runKey(setId.value, route.query))
  const rest = Object.fromEntries(
    Object.entries(route.query).filter(([k]) => !['len', 'shot', 'timed'].includes(k)),
  )
  router.replace({
    query: { ...rest, mode: 'generated', seed: String(createRng().seed), ...timedQuery(opts) },
  })
}
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
/** Book sets show the whole exercise page at once, like the book; generated sets go one at a time. Either can be switched. */
const view = computed<'sheet' | 'one'>(() => {
  const v = route.query.view
  if (v === 'sheet' || v === 'one') return v
  return mode.value === 'book' ? 'sheet' : 'one'
})
const sheetExercises = ref<Exercise[]>([])
function setView(v: 'sheet' | 'one') {
  router.replace({ query: { ...route.query, view: v } })
}
function onSheetDone(summary: { correct: number; total: number; seconds: number }) {
  if (recorded) return
  recorded = true
  recordAttempt(setId.value, { at: new Date().toISOString(), ...summary, mode: mode.value })
}

const seed = ref<number | undefined>(undefined)
const status = ref<'idle' | 'running' | 'empty'>('idle')
const answerBox = ref<InstanceType<typeof AnswerInput> | null>(null)
let recorded = false
/** Set when the learner leaves a drill, so the ticking clock cannot save the run again on the way out. */
let leaving = false

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
/** Sprints draw more problems from the same technique and stream as the run goes on. */
function moreExercises(): Exercise[] {
  const s = set.value
  const def = s?.kind === 'generated' ? s.def : s ? generatedTwin(s.ref.id) : undefined
  return def ? generateMany(def, 10, difficulty.value, createRng()) : []
}

function begin() {
  recorded = false
  leaving = false
  newBest.value = undefined
  seed.value = undefined
  if (!set.value || locked.value) {
    status.value = 'idle'
    return
  }
  // A book set asked for in generated mode runs (and records) as its generated twin.
  if (set.value.kind === 'book' && route.query.mode === 'generated') {
    const t = generatedTwin(set.value.ref.id)
    if (t) {
      router.replace({
        name: 'practice',
        params: { chapter: chapterId.value, set: t.id },
        query: route.query,
      })
      return
    }
  }
  const exercises = buildExercises()
  if (exercises.length === 0) {
    status.value = 'empty'
    return
  }
  status.value = 'running'
  if (view.value === 'sheet') {
    sheetExercises.value = exercises
    return
  }
  const t = timedOpts.value
  if (t) {
    // Clocks cannot pause, so a timed run is never resumed.
    start(exercises, {
      sprintMs: t.sprint ? t.sprint * 1000 : undefined,
      more: t.sprint ? moreExercises : undefined,
      shotMs: t.shot ? t.shot * 1000 : undefined,
    })
  } else {
    const saved = loadRun(runKey(setId.value, route.query))
    start(exercises, saved ? { resume: { inputs: saved.inputs, elapsedMs: saved.elapsedMs } } : {})
  }
  nextTick(() => answerBox.value?.focus())
}

// Persist the run after every answer so an app switch or a call does not lose the set.
watchEffect(() => {
  if (!state.value || status.value !== 'running' || view.value !== 'one' || timed.value) return
  if (leaving) return
  const key = runKey(setId.value, route.query)
  saveRun(key, state.value, seconds.value * 1000)
})
// Keep the screen on while a drill is in progress (native only).
watchEffect(() => {
  void keepAwake(
    status.value === 'running' && view.value === 'one' && state.value?.phase !== 'done',
  )
})
onBeforeUnmount(() => void keepAwake(false))

function exitDrill() {
  leaving = true
  clearRun(runKey(setId.value, route.query))
  goBack()
}

watch(
  () => [
    chapterId.value,
    setId.value,
    route.query.mode,
    route.query.seed,
    route.query.difficulty,
    route.query.timed,
    route.query.len,
    route.query.shot,
    locked.value,
  ],
  begin,
  { immediate: true },
)

watch(
  () => state.value?.phase,
  (phase) => {
    if (phase !== 'done' || recorded || !state.value || !set.value) return
    recorded = true
    const result = {
      correct: state.value.correct,
      total: state.value.total,
      seconds: seconds.value,
    }
    const t = timedOpts.value
    recordAttempt(setId.value, {
      at: new Date().toISOString(),
      ...result,
      mode: t ? 'timed' : mode.value,
      ...(t?.sprint ? { sprint: t.sprint } : {}),
      ...(t?.shot ? { shot: t.shot } : {}),
    })
    // Personal bests: generated runs only, so the numbers are always fresh.
    if (mode.value === 'generated' && (!t || !t.shot || t.sprint)) {
      const key = bestKey(t ?? { sprint: undefined, shot: 0 })
      const better = improves(key, bests(setId.value)[key], result)
      if (better !== undefined) {
        recordBest(setId.value, key, better)
        newBest.value = describeBest(key, better)
      }
    }
  },
)

function onSubmit(input: string) {
  const r = submit(input)
  if (r) void hapticResult(r.correct, progress.value.settings.haptics)
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

/** Draw a fresh generated set: a new seed, same technique and difficulty. */
function newSet() {
  router.replace({ query: { ...route.query, mode: 'generated', seed: String(createRng().seed) } })
}
function setDifficulty(e: Event) {
  const d = (e.target as HTMLSelectElement).value
  router.replace({
    query: { ...route.query, mode: 'generated', difficulty: d, seed: String(createRng().seed) },
  })
}

function again() {
  clearRun(runKey(setId.value, route.query))
  const fresh = createRng().seed
  router.replace({
    query: { ...route.query, seed: mode.value === 'generated' ? String(fresh) : undefined },
  })
  if (mode.value !== 'generated') begin()
}

function back() {
  router.push({ name: 'read', params: { chapter: chapterId.value, section: sectionId.value } })
}

const kicker = computed(() => `${meta.value?.kicker ?? ''} · ${sectionTitle.value}`)

/**
 * Where "back" goes: to the page the reader came from when that was this chapter or the hub
 * (history.back keeps their scroll position), otherwise to the set's section of the chapter.
 */
const origin = computed<'reader' | 'hub' | 'none'>(() => {
  const back =
    typeof window !== 'undefined' ? (window.history.state?.back as string | null | undefined) : null
  if (!back) return 'none'
  if (back.startsWith(`/read/${chapterId.value}`)) return 'reader'
  if (back === '/practice' || back.startsWith('/practice?')) return 'hub'
  return 'none'
})
function goBack() {
  if (origin.value === 'none') back()
  else router.back()
}
const focusMode = computed(() => progress.value.settings.focus)
/** Phones run a set as a full-screen drill; the page padding goes so the keypad fits above the tabs. */
const drilling = computed(
  () =>
    isPhone.value &&
    view.value === 'one' &&
    status.value === 'running' &&
    !!state.value?.current &&
    state.value.phase !== 'done',
)
</script>

<template>
  <div class="practice" :class="{ focus: focusMode, drilling }" @keyup.enter="onEnter">
    <section v-if="!set" class="state" data-testid="set-not-found">
      <p class="kicker">Not found</p>
      <h1>No such practice set in this chapter.</h1>
      <RouterLink :to="{ name: 'read', params: { chapter: chapterId } }"
        >Back to the chapter</RouterLink
      >
    </section>

    <SetLockedView
      v-else-if="locked"
      :chapter-id="chapterId"
      :section-id="sectionId"
      :section-title="sectionTitle"
      :title="title"
    />

    <template v-else>
      <nav
        v-if="
          !(isPhone && view === 'one' && status === 'running' && state && state.phase !== 'done')
        "
        class="crumb"
        aria-label="Back"
      >
        <button
          v-if="origin !== 'none'"
          type="button"
          class="back"
          data-testid="practice-back"
          @click="goBack"
        >
          ‹
          {{
            origin === 'reader'
              ? `Back to ${meta?.kicker ?? 'the chapter'}`
              : 'Back to all techniques'
          }}
        </button>
        <RouterLink
          v-else
          class="back"
          data-testid="practice-back"
          :to="{ name: 'read', params: { chapter: chapterId, section: sectionId } }"
          >‹ {{ meta?.kicker }} · {{ sectionTitle }}</RouterLink
        >
      </nav>
      <header
        v-if="
          !(isPhone && view === 'one' && status === 'running' && state && state.phase !== 'done')
        "
        class="head"
      >
        <div>
          <p class="kicker">{{ kicker }}</p>
          <h1>{{ title }}</h1>
          <p class="desc">{{ description }}</p>
        </div>
        <div v-if="status === 'running' && view === 'one' && state" class="hud">
          <span v-if="state.sprint && state.phase !== 'done'" data-testid="practice-progress"
            >{{ state.history.length }} answered</span
          >
          <span v-else data-testid="practice-progress"
            >{{ Math.min(state.index + 1, state.total) }} / {{ state.total }}</span
          >
          <span
            v-if="timeLeft !== undefined && state.phase !== 'done'"
            class="clock"
            :class="{ low: timeLeft <= 10 }"
            data-testid="time-left"
            >{{ clock(timeLeft) }}</span
          >
          <span v-else-if="timed || state.phase === 'done'" class="clock">{{
            clock(seconds)
          }}</span>
        </div>
      </header>
      <div
        v-if="
          status === 'running' && !(isPhone && view === 'one' && state && state.phase !== 'done')
        "
        class="tools"
      >
        <span class="seg" role="group" aria-label="Layout">
          <button
            type="button"
            class="segbtn"
            :class="{ on: view === 'sheet' }"
            :aria-pressed="view === 'sheet'"
            data-testid="view-sheet"
            @click="setView('sheet')"
          >
            All at once
          </button>
          <button
            type="button"
            class="segbtn"
            :class="{ on: view === 'one' }"
            :aria-pressed="view === 'one'"
            data-testid="view-one"
            @click="setView('one')"
          >
            One at a time
          </button>
        </span>
        <template v-if="mode === 'generated'">
          <button
            type="button"
            class="tool primary"
            data-testid="new-set"
            title="Ten new problems for this technique"
            @click="newSet"
          >
            Generate new set
          </button>
          <button
            type="button"
            class="tool"
            :class="{ on: timed }"
            data-testid="timed-open"
            :title="timedOpts ? describeTimed(timedOpts) : 'Sprint or shot clock'"
            @click="showTimedSheet = true"
          >
            ⏱ {{ timedOpts ? describeTimed(timedOpts) : 'Timed' }}
          </button>
          <label class="tool-label"
            >Difficulty
            <select data-testid="difficulty" :value="difficulty" @change="setDifficulty">
              <option value="mixed">mixed</option>
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
          </label>
          <RouterLink
            v-if="set?.kind === 'generated' && set.def.coversBookSets?.[0]"
            class="tool"
            :to="{
              name: 'practice',
              params: { chapter: chapterId, set: set.def.coversBookSets[0] },
              query: { mode: 'book' },
            }"
            >📖 Book set</RouterLink
          >
        </template>
        <RouterLink
          v-else-if="twin"
          class="tool primary"
          data-testid="generate-similar"
          :to="{
            name: 'practice',
            params: { chapter: chapterId, set: twin.id },
            query: { mode: 'generated' },
          }"
          >Generate similar problems</RouterLink
        >
      </div>

      <section v-if="status === 'empty'" class="state" data-testid="set-empty">
        <p>The book's problems for this set arrive soon.</p>
        <RouterLink
          v-if="twin"
          class="btn"
          :to="{
            name: 'practice',
            params: { chapter: chapterId, set: twin.id },
            query: { mode: 'generated' },
          }"
          >Practice generated problems instead ›</RouterLink
        >
      </section>

      <WorksheetView v-else-if="view === 'sheet'" :exercises="sheetExercises" @done="onSheetDone" />

      <DrillScreen
        v-else-if="isPhone && state && state.phase !== 'done' && state.current"
        :state="state"
        :seconds="seconds"
        :show-timer="showTimer"
        :title="title"
        :time-left="timeLeft"
        :shot-fraction="shotFraction"
        @submit="onSubmit"
        @next="onNext"
        @exit="exitDrill"
      />

      <section v-else-if="state && state.phase !== 'done' && state.current" class="card">
        <PromptRenderer :prompt="state.current.prompt" />
        <div
          v-if="shotFraction !== undefined"
          class="shot"
          data-testid="shot-clock"
          role="progressbar"
          aria-label="Time for this problem"
          :aria-valuenow="Math.round(shotFraction * 100)"
        >
          <i :class="{ low: shotFraction < 0.25 }" :style="{ width: `${shotFraction * 100}%` }" />
        </div>
        <AnswerInput
          ref="answerBox"
          :spec="state.current.answer"
          :disabled="state.phase === 'feedback'"
          @submit="onSubmit"
        />

        <div
          v-if="state.phase === 'feedback' && state.lastResult"
          class="feedback"
          :class="state.lastResult.correct ? 'ok' : 'bad'"
          data-testid="feedback"
          aria-live="polite"
        >
          <p class="verdict">
            <template v-if="state.lastResult.correct">Correct.</template>
            <template v-else-if="state.lastResult.timedOut"
              >Time's up. The answer is <strong>{{ state.lastResult.shown }}</strong
              >.</template
            >
            <template v-else
              >Not quite. The answer is <strong>{{ state.lastResult.shown }}</strong
              >.</template
            >
          </p>
          <SolutionSteps
            v-if="state.current.solution?.steps?.length"
            :steps="state.current.solution.steps"
          />
          <button type="button" class="btn next" data-testid="next-button" @click="onNext">
            {{ state.sprint || state.index < state.total - 1 ? 'Next ›' : 'See results ›' }}
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
        :best="sprint ? undefined : bestScore(setId)"
        :timed-label="timedOpts ? describeTimed(timedOpts) : undefined"
        :new-best="newBest"
        :twin="
          set?.kind === 'book' && twin
            ? { chapterId, setId: twin.id, title: twin.title }
            : undefined
        "
        @again="again"
        @back="back"
      />
    </template>
    <TimedSheet
      v-if="showTimedSheet"
      :title="title"
      :initial="timedOpts ?? undefined"
      @start="startTimed"
      @close="showTimedSheet = false"
    />
  </div>
</template>

<style scoped>
.practice {
  max-width: 48rem;
  margin: 0 auto;
  padding: 1.5rem var(--gutter) 5rem;
}
.practice.drilling {
  padding: 0;
}
.state {
  text-align: center;
  padding: 2rem 0;
}
.state h1 {
  font-size: 1.5rem;
  margin: 0.25rem 0 1rem;
}
.crumb {
  margin: -0.5rem 0 0.75rem;
  font-family: var(--font-sans);
  font-size: 0.9rem;
}
.back {
  background: none;
  border: 0;
  padding: 0.3rem 0;
  color: var(--accent);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.back:hover {
  text-decoration: underline;
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
.tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin: -0.25rem 0 1rem;
  font-family: var(--font-sans);
  font-size: 0.9rem;
}
.tool {
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius);
  border: 1px solid var(--accent);
  color: var(--accent);
  background: transparent;
  font-weight: 700;
  font-family: var(--font-sans);
  font-size: 0.9rem;
}
.tool.primary {
  background: var(--accent);
  color: var(--accent-ink);
}
.tool.on {
  background: var(--card);
}
.clock.low {
  color: var(--accent);
  font-weight: 700;
}
.shot {
  width: min(100%, 22rem);
  height: 4px;
  margin: 0 auto 0.75rem;
  background: var(--rule);
  border-radius: 2px;
  overflow: hidden;
}
.shot i {
  display: block;
  height: 100%;
  background: var(--warm);
  transition: width 0.25s linear;
}
.shot i.low {
  background: var(--accent);
}
.tool:hover {
  text-decoration: none;
  filter: brightness(1.08);
}
.seg {
  display: inline-flex;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  overflow: hidden;
}
.segbtn {
  font: inherit;
  font-family: var(--font-sans);
  font-size: 0.85rem;
  padding: 0.35rem 0.7rem;
  background: transparent;
  color: var(--muted);
  border: 0;
}
.segbtn.on {
  background: var(--card);
  color: var(--ink);
  font-weight: 700;
}
.tool-label {
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.tool-label select {
  font: inherit;
  padding: 0.3rem 0.4rem;
  border-radius: var(--radius);
  border: 1px solid var(--rule);
  background: var(--surface);
  color: var(--ink);
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
