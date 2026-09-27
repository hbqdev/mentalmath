<script setup lang="ts">
import type { Prompt } from '@/exercises/types'
const props = defineProps<{ prompt: Extract<Prompt, { kind: 'columns' }> }>()
const fmt = (n: number) =>
  props.prompt.unit === '$' ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n.toLocaleString('en-US')
</script>

<template>
  <div class="stack" aria-label="column of numbers to add">
    <div v-for="(n, i) in prompt.numbers" :key="i" class="row" :class="{ last: i === prompt.numbers.length - 1 }">
      <span v-if="i === prompt.numbers.length - 1" class="op">+</span><span v-if="prompt.unit === '$' && i === 0" class="unit">$ </span>{{ fmt(n) }}
    </div>
  </div>
</template>

<style scoped>
.stack {
  display: inline-grid;
  justify-items: end;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: clamp(1.5rem, 4.5vw, 2.2rem);
  line-height: 1.25;
}
.row {
  padding: 0 0.2em;
}
.row.last {
  border-bottom: 3px solid currentColor;
  padding-bottom: 0.1em;
}
.op {
  color: var(--accent);
  margin-right: 0.5em;
}
</style>
