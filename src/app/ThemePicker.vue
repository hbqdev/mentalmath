<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useProgress } from './progress'
import { useTheme } from './theme'

const { state } = useProgress()
const { themes, setTheme } = useTheme()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

function choose(v: string) {
  setTheme(v)
  open.value = false
}
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
  <div ref="root" class="picker" data-testid="theme-picker">
    <!-- Desktop: the four icons side by side. Phone: the current icon opens the same row. -->
    <button
      type="button"
      class="current"
      data-testid="theme-toggle"
      :aria-label="`Theme: ${themes.find((t) => t.value === state.settings.theme)?.label}. Change theme`"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
        <use :href="`#theme-${state.settings.theme}`" />
      </svg>
    </button>
    <div class="group" :class="{ open }" role="radiogroup" aria-label="Theme">
      <button
        v-for="t in themes"
        :key="t.value"
        type="button"
        class="opt"
        role="radio"
        :aria-checked="state.settings.theme === t.value"
        :aria-label="t.label"
        :title="t.label"
        :data-testid="`theme-${t.value}`"
        @click="choose(t.value)"
      >
        <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
          <use :href="`#theme-${t.value}`" />
        </svg>
        <span class="name">{{ t.label }}</span>
      </button>
    </div>

    <svg width="0" height="0" style="position: absolute" aria-hidden="true">
      <defs>
        <!-- system: a monitor -->
        <symbol id="theme-system" viewBox="0 0 24 24">
          <rect
            x="3"
            y="4"
            width="18"
            height="12"
            rx="2"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          />
          <path
            d="M8 20h8M12 16v4"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </symbol>
        <!-- paper: a page with lines -->
        <symbol id="theme-light" viewBox="0 0 24 24">
          <path
            d="M7 3h7l4 4v14H7z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path
            d="M14 3v4h4M10 12h5M10 16h5"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </symbol>
        <!-- bright: a sun -->
        <symbol id="theme-bright" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8" />
          <path
            d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </symbol>
        <!-- dark: a moon -->
        <symbol id="theme-dark" viewBox="0 0 24 24">
          <path
            d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
        </symbol>
      </defs>
    </svg>
  </div>
</template>

<style scoped>
.picker {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.ico {
  width: 18px;
  height: 18px;
  display: block;
}
.current,
.opt {
  background: none;
  border: 1px solid var(--rule);
  color: var(--muted);
  border-radius: 4px;
  padding: 0.25rem 0.4rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 32px;
}
.opt[aria-checked='true'] {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--card);
}
.opt .name {
  font-size: 0.8rem;
}
/* desktop: the row is always visible, the summary button is not needed */
.current {
  display: none;
}
.group {
  display: inline-flex;
  gap: 0.25rem;
}
.group .opt .name {
  display: none;
}
@media (max-width: 899px) {
  .current {
    display: inline-flex;
  }
  .group {
    display: none;
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 30;
    flex-direction: column;
    gap: 0.3rem;
    padding: 0.5rem;
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  }
  .group.open {
    display: flex;
  }
  .group .opt {
    min-height: 44px;
    padding: 0.5rem 0.75rem;
  }
  .group .opt .name {
    display: inline;
  }
}
</style>
