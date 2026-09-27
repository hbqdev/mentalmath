<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { check, formatAnswer, type CheckResult } from '@/exercises/checker'
import type { Exercise } from '@/exercises/types'
import PromptRenderer from './PromptRenderer.vue'
import SolutionSteps from './SolutionSteps.vue'

const props = defineProps<{ exercises: Exercise[] }>()
const emit = defineEmits<{ done: [summary: { correct: number; total: number; seconds: number }] }>()

interface Item {
  input: string
  result: (CheckResult & { revealed?: boolean }) | null
  steps: boolean
}

const items = reactive<Item[]>([])
const startedAt = ref(Date.now())
let reported = false

function reset() {
  items.splice(
    0,
    items.length,
    ...props.exercises.map((): Item => ({ input: '', result: null, steps: false })),
  )
  startedAt.value = Date.now()
  reported = false
}
watch(() => props.exercises, reset, { immediate: true })

const answered = computed(() => items.filter((i) => i.result).length)
const correct = computed(() => items.filter((i) => i.result?.correct).length)
const finished = computed(() => items.length > 0 && answered.value === items.length)

watch(finished, (f) => {
  if (!f || reported) return
  reported = true
  emit('done', {
    correct: correct.value,
    total: items.length,
    seconds: Math.round((Date.now() - startedAt.value) / 1000),
  })
})

function checkOne(i: number, value = items[i]!.input) {
  const item = items[i]!
  const ex = props.exercises[i]!
  if (item.result || !value.trim()) return
  item.input = value
  item.result = check(ex.answer, value)
  if (!item.result.correct) item.steps = true
}
function checkAll() {
  items.forEach((it, i) => checkOne(i))
}
function revealRest() {
  items.forEach((it, i) => {
    if (it.result) return
    it.result = { correct: false, shown: formatAnswer(props.exercises[i]!.answer), revealed: true }
    it.steps = true
  })
}
function onEnter(i: number) {
  checkOne(i)
  const next = document.querySelector<HTMLInputElement>(`[data-sheet-input="${i + 1}"]`)
  next?.focus()
}
</script>

<template>
  <section class="sheet" data-testid="worksheet">
    <header class="bar">
      <span class="count" data-testid="sheet-progress"
        >{{ answered }} / {{ items.length }} answered · {{ correct }} correct</span
      >
      <span class="spacer" />
      <button
        type="button"
        class="tool"
        data-testid="check-all"
        :disabled="finished"
        @click="checkAll"
      >
        Check all
      </button>
      <button
        type="button"
        class="tool ghost"
        data-testid="reveal-rest"
        :disabled="finished"
        @click="revealRest"
      >
        Reveal the rest
      </button>
    </header>

    <ol class="items">
      <li
        v-for="(ex, i) in exercises"
        :key="ex.id"
        class="item"
        :class="{
          ok: items[i]?.result?.correct,
          bad: items[i]?.result && !items[i]!.result!.correct,
        }"
        :data-testid="`sheet-item-${i + 1}`"
      >
        <span class="n">{{ i + 1 }}.</span>
        <div class="body">
          <PromptRenderer :prompt="ex.prompt" compact />
          <div v-if="ex.answer.kind === 'choice'" class="choices">
            <button
              v-for="o in ex.answer.options"
              :key="o"
              type="button"
              class="choice"
              :class="{ chosen: items[i]?.input === o }"
              :disabled="!!items[i]?.result"
              :data-testid="`sheet-choice-${i + 1}-${o.toLowerCase()}`"
              @click="checkOne(i, o)"
            >
              {{ o }}
            </button>
          </div>
          <form v-else class="field" @submit.prevent="onEnter(i)">
            <input
              v-model="items[i]!.input"
              type="text"
              autocomplete="off"
              spellcheck="false"
              :inputmode="
                ['integer', 'decimal', 'estimate', 'quotient-remainder'].includes(ex.answer.kind)
                  ? 'decimal'
                  : 'text'
              "
              :readonly="!!items[i]?.result"
              :aria-label="`Answer to problem ${i + 1}`"
              :data-sheet-input="i"
              :data-testid="`sheet-input-${i + 1}`"
            />
            <button
              type="button"
              class="go"
              @click="onEnter(i)"
              :disabled="!!items[i]?.result"
              :data-testid="`sheet-check-${i + 1}`"
            >
              Check
            </button>
          </form>
          <p v-if="items[i]?.result" class="verdict" :data-testid="`sheet-verdict-${i + 1}`">
            <template v-if="items[i]!.result!.correct">✓ Correct</template>
            <template v-else-if="items[i]!.result!.revealed"
              >Answer: <strong>{{ items[i]!.result!.shown }}</strong></template
            >
            <template v-else
              >✗ The answer is <strong>{{ items[i]!.result!.shown }}</strong></template
            >
            <button
              v-if="ex.solution?.steps?.length"
              type="button"
              class="link"
              :data-testid="`sheet-steps-${i + 1}`"
              @click="items[i]!.steps = !items[i]!.steps"
            >
              {{ items[i]!.steps ? 'Hide steps' : 'Show steps' }}
            </button>
          </p>
          <SolutionSteps
            v-if="items[i]?.result && items[i]!.steps && ex.solution?.steps?.length"
            :steps="ex.solution.steps"
          />
        </div>
      </li>
    </ol>

    <p v-if="finished" class="summary" data-testid="sheet-summary">
      Done: {{ correct }} / {{ items.length }} correct.
    </p>
  </section>
</template>

<style scoped>
.sheet {
  font-family: var(--font-sans);
}
.bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  color: var(--muted);
  font-size: 0.9rem;
}
.spacer {
  flex: 1;
}
.tool {
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius);
  border: 1px solid var(--accent);
  background: var(--accent);
  color: var(--accent-ink);
  font-weight: 700;
  font-family: var(--font-sans);
  font-size: 0.9rem;
}
.tool.ghost {
  background: transparent;
  color: var(--accent);
}
.tool:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.75rem;
}
.item {
  display: flex;
  gap: 0.6rem;
  padding: 0.9rem 0.9rem 1rem;
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}
.item.ok {
  border-color: #6fb17a;
}
.item.bad {
  border-color: var(--accent);
}
.n {
  color: var(--muted);
  font-size: 0.85rem;
  padding-top: 0.2rem;
  min-width: 1.6em;
}
.body {
  flex: 1;
  min-width: 0;
}
.body :deep(.prompt) {
  padding: 0.2rem 0 0.6rem;
  justify-content: flex-start;
  text-align: left;
}
.body :deep(.big) {
  font-size: 1.6rem;
}
.body :deep(.steps) {
  margin: 0.6rem 0 0;
  padding: 0.6rem 0.8rem;
}
.body :deep(.steps ol) {
  font-size: 0.85rem;
}
.field {
  display: flex;
  gap: 0.4rem;
}
.field input {
  flex: 1;
  min-width: 0;
  font: inherit;
  font-family: var(--font-mono);
  font-size: 1.05rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background: var(--paper);
  color: var(--ink);
}
.field input[readonly] {
  opacity: 0.75;
}
.go {
  font-family: var(--font-sans);
  font-weight: 700;
  padding: 0.4rem 0.8rem;
  border: 0;
  border-radius: var(--radius);
  background: var(--accent);
  color: var(--accent-ink);
}
.go:disabled {
  opacity: 0.5;
}
.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.choice {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--accent);
}
.choice.chosen,
.choice.chosen:disabled {
  opacity: 1;
  background: var(--accent);
  color: var(--accent-ink);
}
.choice:disabled {
  opacity: 0.5;
}
.verdict {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
}
.item.ok .verdict {
  color: #2f7a3d;
}
[data-theme='dark'] .item.ok .verdict {
  color: #7fd18b;
}
.item.bad .verdict {
  color: var(--accent);
}
.link {
  margin-left: 0.6rem;
  background: none;
  border: 0;
  color: var(--accent);
  text-decoration: underline;
  font: inherit;
  padding: 0;
}
.summary {
  margin-top: 1.25rem;
  font-weight: 700;
}
</style>
