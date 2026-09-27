<script setup lang="ts">
import { computed } from 'vue'
import type { Block } from '@/content/types'
import { figureOverride } from '@/content/figures/overrides'
import FigureLayout from './FigureLayout.vue'

const props = defineProps<{ block: Extract<Block, { type: 'figure' }> }>()
const spec = computed(() => figureOverride(props.block.id))
</script>

<template>
  <figure
    class="fig"
    :class="{ typeset: spec, inline: spec?.kind === 'inline' }"
    :data-figure="block.id"
    :data-override="spec ? spec.kind : undefined"
  >
    <FigureLayout v-if="spec" :spec="spec" />
    <img
      v-else
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
.fig.typeset {
  overflow-x: auto;
  padding: 0.1em 0;
}
.fig.inline {
  margin: 0.4em 0 0.6em;
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
