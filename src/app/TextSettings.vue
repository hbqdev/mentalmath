<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useProgress } from './progress'
import { useTheme } from './theme'

const { state } = useProgress()
const { fonts, setFont, setFontSize, MIN_SIZE, MAX_SIZE } = useTheme()
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
    <div v-if="open" class="panel" data-testid="text-panel" role="group" aria-label="Text settings">
      <label class="row">
        <span class="lbl"
          >Size
          <strong data-testid="font-size-value">{{ state.settings.fontSize }} px</strong></span
        >
        <span class="slider">
          <span class="a">A</span>
          <input
            type="range"
            data-testid="font-size"
            :min="MIN_SIZE"
            :max="MAX_SIZE"
            step="1"
            :value="state.settings.fontSize"
            aria-label="Text size"
            @input="setFontSize(Number(($event.target as HTMLInputElement).value))"
          />
          <span class="a big">A</span>
        </span>
      </label>
      <div class="row">
        <span class="lbl">Font</span>
        <div class="fonts" role="radiogroup" aria-label="Reading font">
          <button
            v-for="f in fonts"
            :key="f.value"
            type="button"
            class="font"
            :class="[f.value, { on: state.settings.font === f.value }]"
            role="radio"
            :aria-checked="state.settings.font === f.value"
            :data-testid="`font-${f.value}`"
            @click="setFont(f.value)"
          >
            <span class="name">{{ f.label }}</span>
            <span class="sample">{{ f.sample }} · 47 + 32 = 79</span>
          </button>
        </div>
      </div>
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
  font-family: var(--font-sans);
  font-size: 0.9rem;
  display: grid;
  gap: 0.9rem;
}
.row {
  display: grid;
  gap: 0.4rem;
}
.lbl {
  color: var(--muted);
  display: flex;
  justify-content: space-between;
}
.lbl strong {
  color: var(--ink);
  font-weight: 600;
}
.slider {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.slider input {
  flex: 1;
  accent-color: var(--accent);
  min-height: 32px;
}
.a {
  font-family: var(--font-serif);
  font-size: 0.8rem;
  color: var(--muted);
}
.a.big {
  font-size: 1.3rem;
}
.fonts {
  display: grid;
  gap: 0.35rem;
}
.font {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem 0.7rem;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background: var(--paper);
  color: var(--ink);
  text-align: left;
  min-height: 40px;
}
.font.on {
  border-color: var(--accent);
  background: var(--card);
}
.font .name {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 0.85rem;
}
.font .sample {
  font-size: 1rem;
  color: var(--muted);
}
.font.serif .sample {
  font-family: var(--font-serif);
}
.font.sans .sample {
  font-family: var(--font-sans);
}
.font.system .sample {
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
}
.font.mono .sample {
  font-family: var(--font-mono);
  font-size: 0.9rem;
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
