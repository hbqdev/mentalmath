<script setup lang="ts">
import type { SectionMeta } from '@/content/types'
defineProps<{
  chapterId: string
  sections: SectionMeta[]
  activeId: string
  visited: Set<string>
}>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <nav class="outline" data-testid="outline" aria-label="In this chapter">
    <p class="label">In this chapter</p>
    <ul>
      <li
        v-for="s in sections"
        :key="s.id"
        :class="{ on: s.id === activeId, done: visited.has(s.id) }"
      >
        <a :href="`#${s.id}`" @click.prevent="emit('select', s.id)">{{ s.title }}</a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.outline {
  font-family: var(--font-sans);
  font-size: 0.85rem;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
li {
  border-left: 2px solid transparent;
}
li a {
  display: block;
  padding: 0.3rem 0 0.3rem 0.7rem;
  color: var(--muted);
}
li a:hover {
  color: var(--ink);
  text-decoration: none;
}
li.on {
  border-left-color: var(--accent);
}
li.on a {
  color: var(--ink);
  font-weight: 700;
}
li.done a::after {
  content: ' ✓';
  color: var(--warm);
}
</style>
