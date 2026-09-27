<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <section class="placeholder">
    <p class="kicker">Practice</p>
    <h1>Coming in the next phase</h1>
    <p>
      Set <code>{{ route.params.set }}</code> for chapter {{ route.params.chapter }} will live here.
    </p>
    <RouterLink :to="{ name: 'read', params: { chapter: route.params.chapter } }">
      Back to the chapter
    </RouterLink>
  </section>
</template>

<style scoped>
.placeholder {
  padding: 2rem var(--gutter);
  max-width: var(--measure);
  margin: 0 auto;
}
h1 {
  font-size: 1.6rem;
  margin: 0.25rem 0 1rem;
}
</style>
