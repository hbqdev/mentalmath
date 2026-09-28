<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import TextControls from './TextControls.vue'

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function onDocClick(e: MouseEvent) {
  if (!root.value?.contains(e.target as Node)) open.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="root" class="text-settings">
    <button
      type="button"
      class="tgl"
      data-testid="text-toggle"
      aria-label="Text size and font"
      :aria-expanded="open"
      @click="open = !open"
    >
      Aa
    </button>
    <div v-if="open" class="panel" data-testid="text-panel">
      <TextControls />
    </div>
  </div>
</template>

<style scoped>
.text-settings {
  position: relative;
  display: inline-flex;
}
.tgl {
  background: none;
  border: 1px solid var(--rule);
  color: var(--muted);
  border-radius: 4px;
  padding: 0.2rem 0.55rem;
  min-height: 32px;
}
.tgl[aria-expanded='true'] {
  border-color: var(--accent);
  color: var(--accent);
}
.panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 30;
  width: min(20rem, calc(100vw - 2rem));
  padding: 0.85rem 1rem 1rem;
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
}
@media (max-width: 719px) {
  .panel {
    position: fixed;
    top: calc(52px + env(safe-area-inset-top, 0px) + 8px);
    left: 0.75rem;
    right: 0.75rem;
    width: auto;
  }
}
</style>
