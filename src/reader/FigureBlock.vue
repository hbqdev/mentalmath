<script setup lang="ts">
import type { Block } from '@/content/types'
defineProps<{ block: Extract<Block, { type: 'figure' }> }>()
</script>

<template>
  <figure class="fig" :data-figure="block.id">
    <img
      :src="block.src"
      :width="block.width"
      :height="block.height"
      alt=""
      loading="lazy"
      decoding="async"
    />
  </figure>
</template>

<style scoped>
.fig {
  margin: 1.25em 0 1.5em;
  text-align: center;
}
/* The EPUB figures are small; scale them up to a readable size without exceeding the column. */
.fig img {
  width: auto;
  height: auto;
  max-width: min(100%, 520px);
  min-height: 2.2em;
  max-height: 70vh;
}
</style>
