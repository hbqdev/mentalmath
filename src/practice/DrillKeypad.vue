<script setup lang="ts">
import type { AnswerSpec } from '@/exercises/types'

const props = defineProps<{ spec: AnswerSpec; value: string; disabled: boolean }>()
const emit = defineEmits<{ input: [value: string]; submit: [] }>()

const extra = (() => {
  switch (props.spec.kind) {
    case 'fraction':
      return ['/', '-']
    case 'quotient-remainder':
      return ['r', ' ']
    case 'decimal':
    case 'estimate':
      return ['.', '-']
    default:
      return ['.', '-']
  }
})()

function press(k: string) {
  if (props.disabled) return
  emit('input', props.value + k)
}
function backspace() {
  if (props.disabled) return
  emit('input', props.value.slice(0, -1))
}
</script>

<template>
  <div class="keypad" data-testid="keypad" role="group" aria-label="Keypad">
    <button
      v-for="k in ['1', '2', '3']"
      :key="k"
      type="button"
      class="key"
      :disabled="disabled"
      :data-testid="`key-${k}`"
      @click="press(k)"
    >
      {{ k }}
    </button>
    <button
      type="button"
      class="key aux"
      :disabled="disabled"
      data-testid="key-extra-0"
      @click="press(extra[0]!)"
    >
      {{ extra[0] === ' ' ? '␣' : extra[0] }}
    </button>
    <button
      v-for="k in ['4', '5', '6']"
      :key="k"
      type="button"
      class="key"
      :disabled="disabled"
      :data-testid="`key-${k}`"
      @click="press(k)"
    >
      {{ k }}
    </button>
    <button
      type="button"
      class="key aux"
      :disabled="disabled"
      data-testid="key-extra-1"
      @click="press(extra[1]!)"
    >
      {{ extra[1] === ' ' ? '␣' : extra[1] }}
    </button>
    <button
      v-for="k in ['7', '8', '9']"
      :key="k"
      type="button"
      class="key"
      :disabled="disabled"
      :data-testid="`key-${k}`"
      @click="press(k)"
    >
      {{ k }}
    </button>
    <button
      type="button"
      class="key aux"
      :disabled="disabled"
      data-testid="key-backspace"
      aria-label="Backspace"
      @click="backspace"
    >
      ⌫
    </button>
    <button
      type="button"
      class="key wide"
      :disabled="disabled"
      data-testid="key-0"
      @click="press('0')"
    >
      0
    </button>
    <button
      type="button"
      class="key go"
      :disabled="disabled"
      data-testid="key-check"
      @click="emit('submit')"
    >
      Check
    </button>
  </div>
</template>

<style scoped>
.keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  padding: 0.5rem 0 0;
}
.key {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 600;
  min-height: 58px;
  border-radius: 12px;
  border: 1px solid var(--rule);
  background: var(--surface);
  color: var(--ink);
  touch-action: manipulation;
  user-select: none;
}
.key:active {
  background: var(--card);
}
.key:disabled {
  opacity: 0.45;
}
.key.aux {
  background: var(--card);
  color: var(--muted);
  font-size: 1.25rem;
}
.key.wide {
  grid-column: span 2;
}
.key.go {
  grid-column: span 2;
  background: var(--accent);
  color: var(--accent-ink);
  border-color: var(--accent);
  font-family: var(--font-sans);
  font-size: 1.1rem;
  font-weight: 700;
}
</style>
