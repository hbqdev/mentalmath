<script setup lang="ts"></script>

<template>
  <section class="nf">
    <p class="kicker">Not found</p>
    <h1>That page is not in this book.</h1>
    <RouterLink to="/">Back to the table of contents</RouterLink>
  </section>
</template>

<style scoped>
.nf {
  padding: 3rem var(--gutter);
  max-width: var(--measure);
  margin: 0 auto;
}
h1 {
  font-size: 1.6rem;
  margin: 0.25rem 0 1rem;
}
</style>
