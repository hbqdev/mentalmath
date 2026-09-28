<script setup lang="ts">
defineProps<{ index: number; total: number; practiceCount: number }>()
const emit = defineEmits<{ prev: []; next: []; practice: [] }>()
</script>

<template>
  <div class="pill" role="toolbar" aria-label="Section navigation">
    <button
      type="button"
      :disabled="index <= 0"
      aria-label="Previous section"
      @click="emit('prev')"
    >
      ‹
    </button>
    <span class="pos">Section {{ index + 1 }} / {{ total }}</span>
    <button
      type="button"
      :disabled="index >= total - 1"
      aria-label="Next section"
      @click="emit('next')"
    >
      ›
    </button>
    <span class="sep" />
    <button type="button" class="pr" data-testid="pill-practice" @click="emit('practice')">
      Practice<template v-if="practiceCount"> · {{ practiceCount }}</template>
    </button>
  </div>
</template>

<style scoped>
.pill {
  position: fixed;
  left: 50%;
  bottom: calc(0.75rem + var(--tabbar-h, 0px) + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.4rem 0.35rem 0.75rem;
  background: var(--ink);
  color: var(--paper);
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  white-space: nowrap;
}
.pill button {
  background: none;
  border: 0;
  color: inherit;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0.2rem 0.3rem;
  min-height: 36px;
  min-width: 36px;
}
.pill button:disabled {
  opacity: 0.35;
}
.sep {
  width: 1px;
  height: 1rem;
  background: var(--muted);
}
.pill .pr {
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
}
</style>
