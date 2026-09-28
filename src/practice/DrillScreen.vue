<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SessionState } from '@/exercises/session'
import PromptRenderer from './PromptRenderer.vue'
import SolutionSteps from './SolutionSteps.vue'
import DrillKeypad from './DrillKeypad.vue'

const props = defineProps<{
  state: SessionState
  seconds: number
  showTimer: boolean
  title: string
}>()
const emit = defineEmits<{ submit: [value: string]; next: []; exit: [] }>()

const value = ref('')
const showSteps = ref(false)
const feedback = computed(() => props.state.phase === 'feedback' && props.state.lastResult)
const choice = computed(() =>
  props.state.current?.answer.kind === 'choice' ? props.state.current.answer : null,
)
const textual = computed(() =>
  ['text', 'phonetic'].includes(props.state.current?.answer.kind ?? ''),
)

watch(
  () => props.state.index,
  () => {
    value.value = ''
    showSteps.value = false
  },
)
function submit() {
  if (!value.value.trim() || props.state.phase !== 'answering') return
  emit('submit', value.value)
}
function next() {
  emit('next')
}
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
</script>

<template>
  <section class="drill" data-testid="drill">
    <header class="bar">
      <button
        type="button"
        class="exit"
        data-testid="drill-exit"
        aria-label="Leave the drill"
        @click="emit('exit')"
      >
        ✕
      </button>
      <span class="title">{{ title }}</span>
      <span class="count" data-testid="practice-progress"
        >{{ Math.min(state.index + 1, state.total) }} / {{ state.total }}</span
      >
      <span v-if="showTimer" class="clock" data-testid="drill-clock">{{ clock(seconds) }}</span>
    </header>
    <div class="track" aria-hidden="true">
      <i :style="{ width: `${(state.index / state.total) * 100}%` }" />
    </div>

    <div class="stage">
      <PromptRenderer v-if="state.current" :prompt="state.current.prompt" />
      <div
        v-if="!choice"
        class="answer"
        :class="{
          ok: feedback && state.lastResult!.correct,
          bad: feedback && !state.lastResult!.correct,
        }"
        data-testid="drill-answer"
      >
        <input
          v-if="textual"
          v-model="value"
          class="text-input"
          type="text"
          autocomplete="off"
          spellcheck="false"
          :readonly="state.phase !== 'answering'"
          aria-label="Your answer"
          data-testid="answer-input"
          @keyup.enter.stop="submit"
        />
        <span v-else class="value" data-testid="drill-value">{{ value || ' ' }}</span>
      </div>
    </div>

    <div
      v-if="feedback"
      class="feedback"
      :class="state.lastResult!.correct ? 'ok' : 'bad'"
      data-testid="feedback"
      aria-live="polite"
    >
      <p class="verdict">
        <template v-if="state.lastResult!.correct">Correct</template>
        <template v-else
          >The answer is <strong>{{ state.lastResult!.shown }}</strong></template
        >
        <button
          v-if="state.current?.solution?.steps?.length"
          type="button"
          class="link"
          data-testid="drill-steps-toggle"
          @click="showSteps = !showSteps"
        >
          {{ showSteps ? 'Hide steps' : 'Steps' }}
        </button>
      </p>
      <SolutionSteps
        v-if="showSteps && state.current?.solution?.steps?.length"
        :steps="state.current.solution.steps"
      />
      <button type="button" class="next" data-testid="next-button" @click="next">
        {{ state.index < state.total - 1 ? 'Next ›' : 'See results ›' }}
      </button>
    </div>

    <div v-else-if="choice" class="choices">
      <button
        v-for="o in choice.options"
        :key="o"
        type="button"
        class="choice"
        :data-testid="`choice-${o.toLowerCase()}`"
        @click="emit('submit', o)"
      >
        {{ o }}
      </button>
    </div>
    <button
      v-else-if="textual"
      type="button"
      class="next"
      data-testid="answer-submit"
      :disabled="!value.trim()"
      @click="submit"
    >
      Check
    </button>
    <DrillKeypad
      v-else
      :spec="state.current!.answer"
      :value="value"
      :disabled="state.phase !== 'answering'"
      @input="value = $event"
      @submit="submit"
    />
  </section>
</template>

<style scoped>
.drill {
  display: flex;
  flex-direction: column;
  min-height: calc(
    100dvh - 52px - var(--tabbar-h, 0px) - env(safe-area-inset-top, 0px) -
      env(safe-area-inset-bottom, 0px)
  );
  padding: 0.5rem var(--gutter) 0.75rem;
  font-family: var(--font-sans);
}
.bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.exit {
  background: none;
  border: 1px solid var(--rule);
  color: var(--muted);
  border-radius: 999px;
  width: 36px;
  height: 36px;
}
.title {
  flex: 1;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.count,
.clock {
  font-family: var(--font-mono);
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.track {
  height: 3px;
  background: var(--rule);
  border-radius: 2px;
  margin: 0.5rem 0 0;
  overflow: hidden;
}
.track i {
  display: block;
  height: 100%;
  background: var(--accent);
  transition: width 0.2s;
}
.stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
}
.stage :deep(.prompt) {
  padding: 0.5rem 0;
}
.stage :deep(.big) {
  font-size: clamp(2.4rem, 12vw, 3.6rem);
}
.answer {
  width: min(100%, 22rem);
  min-height: 3.2rem;
  border-bottom: 2px solid var(--rule);
  text-align: center;
  font-family: var(--font-mono);
  font-size: 2rem;
  font-variant-numeric: tabular-nums;
  padding: 0.2rem 0.5rem;
  color: var(--ink);
}
.answer.ok {
  border-color: #2f7a3d;
}
.answer.bad {
  border-color: var(--accent);
}
.text-input {
  width: 100%;
  font: inherit;
  font-size: 1.4rem;
  text-align: center;
  border: 0;
  background: transparent;
  color: var(--ink);
  outline: none;
}
.value {
  display: block;
  white-space: pre;
  min-height: 1.3em;
}
.feedback {
  display: grid;
  gap: 0.6rem;
  padding: 0.5rem 0 0;
}
.verdict {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  text-align: center;
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
.link {
  margin-left: 0.6rem;
  background: none;
  border: 0;
  color: var(--accent);
  text-decoration: underline;
  font: inherit;
  font-weight: 600;
}
.feedback :deep(.steps) {
  margin: 0;
}
.next {
  font: inherit;
  font-weight: 700;
  font-size: 1.1rem;
  min-height: 56px;
  border-radius: 12px;
  border: 0;
  background: var(--accent);
  color: var(--accent-ink);
}
.next:disabled {
  opacity: 0.5;
}
.choices {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}
.choice {
  font: inherit;
  font-size: 1.05rem;
  min-height: 52px;
  border-radius: 12px;
  border: 1px solid var(--accent);
  background: var(--surface);
  color: var(--accent);
  font-weight: 600;
}
</style>
