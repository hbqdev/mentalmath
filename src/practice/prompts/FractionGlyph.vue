<script setup lang="ts">
import type { Frac } from '@/exercises/types'
defineProps<{ value: Frac }>()
</script>

<template>
  <span class="frac" role="math" :aria-label="`${value.num} over ${value.den}`">
    <span class="num">{{ value.num }}</span>
    <span class="den">{{ value.den }}</span>
  </span>
</template>

<style scoped>
.frac {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  vertical-align: middle;
  line-height: 1.1;
  margin: 0 0.15em;
}
.num {
  border-bottom: 2px solid currentColor;
  padding: 0 0.25em 0.05em;
}
.den {
  padding: 0.05em 0.25em 0;
}
</style>
