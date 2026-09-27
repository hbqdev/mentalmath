<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AnswerSpec } from '@/exercises/types'

const props = defineProps<{ spec: AnswerSpec; disabled: boolean }>()
const emit = defineEmits<{ submit: [value: string] }>()

const value = ref('')
const el = ref<HTMLInputElement | null>(null)

const isChoice = computed(() => props.spec.kind === 'choice')
const inputMode = computed(() =>
  ['integer', 'decimal', 'estimate', 'quotient-remainder'].includes(props.spec.kind) ? 'decimal' : 'text',
)
const placeholder = computed(() => {
  switch (props.spec.kind) {
    case 'fraction':
      return 'e.g. 3/4'
    case 'quotient-remainder':
      return 'e.g. 45 r 8'
    case 'estimate':
      return 'Your estimate'
    case 'phonetic':
      return 'A word or phrase'
    case 'decimal':
      return 'e.g. 13.20'
    default:
      return 'Your answer'
  }
})

function submitText() {
  if (props.disabled) return
  emit('submit', value.value)
}

/** Enter while answering submits and stops here; while feedback is shown it bubbles up to advance. */
function onEnterKey(e: KeyboardEvent) {
  if (props.disabled) return
  e.stopPropagation()
  submitText()
}

function reset() {
  value.value = ''
}
function focus() {
  el.value?.focus()
}
defineExpose({ reset, focus })
</script>

<template>
  <div class="answer">
    <div v-if="isChoice && spec.kind === 'choice'" class="choices" role="group" aria-label="Choose an answer">
      <button
        v-for="o in spec.options"
        :key="o"
        type="button"
        class="choice"
        :data-testid="`choice-${o.toLowerCase()}`"
        :disabled="disabled"
        @click="!disabled && emit('submit', o)"
      >
        {{ o }}
      </button>
    </div>
    <!-- Implicit form submission is suppressed; Enter is handled on the input so feedback can use it to advance. -->
    <form v-else class="field" @submit.prevent>
      <input
        ref="el"
        v-model="value"
        data-testid="answer-input"
        type="text"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        :inputmode="inputMode"
        :placeholder="placeholder"
        :readonly="disabled"
        :aria-disabled="disabled"
        aria-label="Your answer"
        @keyup.enter="onEnterKey"
      />
      <button type="button" data-testid="answer-submit" class="go" :disabled="disabled" @click="submitText">Check</button>
    </form>
  </div>
</template>

<style scoped>
.answer {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}
.field {
  display: flex;
  gap: 0.5rem;
  width: min(100%, 26rem);
}
input {
  flex: 1;
  min-width: 0;
  font: inherit;
  font-family: var(--font-mono);
  font-size: 1.4rem;
  padding: 0.55rem 0.8rem;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  text-align: center;
}
input[readonly] {
  opacity: 0.7;
}
.go {
  font-family: var(--font-sans);
  font-weight: 700;
  padding: 0.55rem 1.1rem;
  border: 0;
  border-radius: var(--radius);
  background: var(--accent);
  color: var(--accent-ink);
}
.go:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  max-width: 30rem;
}
.choice {
  font-family: var(--font-sans);
  font-size: 1.05rem;
  padding: 0.55rem 1rem;
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--accent);
  min-width: 3.2rem;
}
.choice:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
