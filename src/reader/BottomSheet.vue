<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()

const closeBtn = ref<HTMLButtonElement | null>(null)
let opener: HTMLElement | null = null

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

// Focus moves into the sheet when it opens and back to whatever opened it when it closes.
watch(
  () => props.open,
  async (open) => {
    if (open) {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
      window.addEventListener('keydown', onKey)
      await nextTick()
      closeBtn.value?.focus()
    } else {
      window.removeEventListener('keydown', onKey)
      opener?.focus()
      opener = null
    }
  },
)
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="scrim" @click="emit('close')" />
    <section
      class="sheet"
      data-testid="sheet"
      :class="{ open }"
      :inert="!open"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
    >
      <div class="grab" />
      <header>
        <strong>{{ title }}</strong>
        <button
          ref="closeBtn"
          type="button"
          data-testid="sheet-close"
          aria-label="Close"
          @click="emit('close')"
        >
          ×
        </button>
      </header>
      <div class="body"><slot /></div>
    </section>
  </Teleport>
</template>

<style scoped>
.scrim {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 40;
}
.sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 41;
  max-height: 75dvh;
  overflow: auto;
  background: var(--surface);
  color: var(--ink);
  border-top: 1px solid var(--rule);
  border-radius: 14px 14px 0 0;
  padding: 0.5rem 1rem calc(1rem + env(safe-area-inset-bottom, 0px));
  transform: translateY(100%);
  transition: transform 0.2s ease;
}
.sheet:not(.open) {
  visibility: hidden;
  transition:
    transform 0.2s ease,
    visibility 0s linear 0.2s;
}
.sheet.open {
  transform: none;
}
.grab {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--rule);
  margin: 0.25rem auto 0.6rem;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-sans);
}
header button {
  background: none;
  border: 0;
  font-size: 1.4rem;
  color: var(--muted);
}
</style>
