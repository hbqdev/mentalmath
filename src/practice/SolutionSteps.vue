<script setup lang="ts">
defineProps<{ steps: string[] }>()
</script>

<template>
  <div class="steps" data-testid="solution-steps">
    <p class="label">How the book does it</p>
    <ol>
      <li v-for="(s, i) in steps" :key="i">{{ s }}</li>
    </ol>
  </div>
</template>

<style scoped>
.steps {
  margin: 1rem auto 0;
  max-width: 34rem;
  text-align: left;
  background: var(--card);
  border: 1px solid var(--card-rule);
  border-radius: var(--radius);
  padding: 0.85rem 1.1rem;
}
ol {
  margin: 0.25rem 0 0 1.2rem;
  padding: 0;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.95rem;
}
li {
  margin: 0.2rem 0;
}
</style>
