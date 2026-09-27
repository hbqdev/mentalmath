<script setup lang="ts">
defineProps<{ chapterId: string; sectionId: string; sectionTitle: string; title: string }>()
</script>

<template>
  <section class="locked" data-testid="locked">
    <p class="kicker">Locked</p>
    <h1>{{ title }}</h1>
    <p>This set unlocks once you have read its section of the chapter.</p>
    <RouterLink
      class="btn"
      :to="{ name: 'read', params: { chapter: chapterId, section: sectionId } }"
    >
      Read “{{ sectionTitle }}” ›
    </RouterLink>
  </section>
</template>

<style scoped>
.locked {
  max-width: var(--measure);
  margin: 3rem auto;
  padding: 0 var(--gutter);
  text-align: center;
}
h1 {
  font-size: 1.6rem;
  margin: 0.25rem 0 0.75rem;
}
.btn {
  display: inline-block;
  margin-top: 1rem;
  font-family: var(--font-sans);
  font-weight: 700;
  background: var(--accent);
  color: var(--accent-ink);
  padding: 0.6rem 1rem;
  border-radius: var(--radius);
}
.btn:hover {
  text-decoration: none;
}
</style>
