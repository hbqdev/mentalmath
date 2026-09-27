<script setup lang="ts">
import { computed } from 'vue'
import type { Prompt } from '@/exercises/types'

const props = defineProps<{ prompt: Extract<Prompt, { kind: 'binary' }> }>()
const vertical = computed(() => props.prompt.op !== '÷')
const opGlyph = computed(() => (props.prompt.op === '-' ? '−' : props.prompt.op))
const fmt = (n: number) => n.toLocaleString('en-US')
</script>

<template>
  <div v-if="vertical" class="stack" :aria-label="`${prompt.a} ${opGlyph} ${prompt.b}`">
    <div class="row">{{ fmt(prompt.a) }}</div>
    <div class="row">
      <span class="op">{{ opGlyph }}</span
      >{{ fmt(prompt.b) }}
    </div>
  </div>
  <div v-else class="inline" :aria-label="`${prompt.a} divided by ${prompt.b}`">
    {{ fmt(prompt.a) }} <span class="op">÷</span> {{ fmt(prompt.b) }}
  </div>
</template>

<style scoped>
.stack {
  display: inline-grid;
  justify-items: end;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: clamp(2rem, 6vw, 3rem);
  line-height: 1.2;
}
.row {
  padding: 0 0.2em;
}
.row:last-child {
  border-bottom: 3px solid currentColor;
  padding-bottom: 0.1em;
}
.op {
  color: var(--accent);
  margin-right: 0.5em;
}
.inline {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: clamp(2rem, 6vw, 3rem);
}
.inline .op {
  margin: 0 0.15em;
}
</style>
