<script setup lang="ts">
import type { Block } from '@/content/types'
import ExerciseCallout from './ExerciseCallout.vue'
import FigureBlock from './FigureBlock.vue'
defineProps<{ blocks: Block[]; chapterId: string; sectionId: string }>()
</script>

<template>
  <div class="blocks">
    <template v-for="(b, i) in blocks" :key="i">
      <!-- html blocks are produced by our own allow-list sanitizer at build time -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="b.type === 'html'" class="prose" :data-page="b.page" v-html="b.html" />
      <FigureBlock v-else-if="b.type === 'figure'" :block="b" />
      <ExerciseCallout v-else :set-id="b.setId" :chapter-id="chapterId" :section-id="sectionId" />
    </template>
  </div>
</template>
