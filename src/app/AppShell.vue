<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useProgress } from './progress'
import { useTheme } from './theme'

const route = useRoute()
const { state } = useProgress()
const { resolved, cycleTheme, cycleFontScale } = useTheme()

const inReader = computed(() => route.name === 'read')
const themeGlyph = computed(() =>
  state.value.settings.theme === 'system' ? 'A' : resolved.value === 'dark' ? '☾' : '☀',
)

function toggleFocus() {
  state.value.settings.focus = !state.value.settings.focus
}
</script>

<template>
  <div class="shell" :class="{ focus: state.settings.focus && inReader }">
    <header class="top">
      <RouterLink to="/" class="wordmark">Mental<span>Math</span></RouterLink>
      <div id="shell-center" class="center" />
      <nav class="controls" aria-label="Display">
        <button
          v-if="inReader"
          type="button"
          class="tgl focus-toggle"
          data-testid="focus-toggle"
          :aria-pressed="state.settings.focus"
          @click="toggleFocus"
        >
          Focus
        </button>
        <button
          type="button"
          class="tgl"
          data-testid="theme-toggle"
          :title="`Theme: ${state.settings.theme}`"
          @click="cycleTheme"
        >
          {{ themeGlyph }}
        </button>
        <button type="button" class="tgl" title="Text size" @click="cycleFontScale">Aa</button>
        <span
          v-if="state.streak.current > 0"
          class="streak"
          :title="`${state.streak.current} day streak`"
          >🔥 {{ state.streak.current }}</span
        >
        <RouterLink to="/about" class="about">About</RouterLink>
      </nav>
    </header>
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
.top {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
  height: 52px;
  padding: 0 var(--gutter);
  background: var(--surface);
  border-bottom: 1px solid var(--rule);
  font-family: var(--font-sans);
}
.wordmark {
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--ink);
  letter-spacing: 0.01em;
}
.wordmark span {
  color: var(--accent);
}
.wordmark:hover {
  text-decoration: none;
}
.center {
  min-width: 0;
  display: flex;
  justify-content: center;
}
.center > * {
  min-width: 0;
  max-width: 100%;
}
.controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}
.tgl {
  background: none;
  border: 1px solid var(--rule);
  color: var(--muted);
  border-radius: 4px;
  padding: 0.2rem 0.55rem;
}
.tgl[aria-pressed='true'] {
  border-color: var(--accent);
  color: var(--accent);
}
.streak {
  color: var(--warm);
  font-weight: 700;
}
.about {
  color: var(--muted);
}
.main {
  flex: 1;
  min-width: 0;
}
@media (max-width: 719px) {
  .about,
  .focus-toggle {
    display: none;
  }
  .top {
    gap: 0.5rem;
    padding: 0 0.75rem;
  }
  .controls {
    gap: 0.35rem;
  }
}
</style>
