<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { getChapterMeta } from '@/content/loader'
import { chapterCompletion } from './completion'
import { useProgress } from './progress'
import { useTheme } from './theme'

const route = useRoute()
const { state } = useProgress()
const { themes, setTheme, cycleFontScale } = useTheme()

const inReader = computed(() => route.name === 'read')
const completion = computed(() => {
  if (!inReader.value) return null
  const id = String(route.params.chapter ?? '')
  const meta = getChapterMeta(id)
  if (!meta) return null
  return chapterCompletion(meta, state.value.reading[id]?.visited)
})

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
        <label class="tgl theme-pick" :title="`Theme: ${state.settings.theme}`">
          <span class="sr">Theme</span>
          <select
            data-testid="theme-toggle"
            aria-label="Theme"
            :value="state.settings.theme"
            @change="setTheme(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="t in themes" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </label>
        <button type="button" class="tgl" title="Text size" @click="cycleFontScale">Aa</button>
        <span
          v-if="completion"
          class="ring"
          data-testid="chapter-ring"
          role="img"
          :aria-label="`${completion.done} of ${completion.total} sections read`"
          :title="`${completion.done} of ${completion.total} sections read`"
          :style="{ '--p': `${Math.round(completion.fraction * 100)}%` }"
        />
        <span
          v-if="state.streak.current > 0"
          class="streak"
          :title="`${state.streak.current} day streak`"
          >🔥 {{ state.streak.current }}</span
        >
        <RouterLink :to="{ name: 'practice-hub' }" class="navlink" data-testid="nav-practice"
          >Practice</RouterLink
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
.theme-pick {
  padding: 0;
  display: inline-flex;
}
.theme-pick select {
  font: inherit;
  font-size: 0.85rem;
  color: var(--muted);
  background: transparent;
  border: 0;
  padding: 0.2rem 0.4rem;
  cursor: pointer;
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.tgl[aria-pressed='true'] {
  border-color: var(--accent);
  color: var(--accent);
}
.streak {
  color: var(--warm);
  font-weight: 700;
}
.ring {
  --p: 0%;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: conic-gradient(var(--accent) var(--p), var(--rule) 0);
  position: relative;
  flex: none;
}
.ring::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: var(--surface);
}
.about {
  color: var(--muted);
}
.navlink {
  color: var(--accent);
  font-weight: 700;
}
.navlink.router-link-active {
  text-decoration: underline;
  text-underline-offset: 0.2em;
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
