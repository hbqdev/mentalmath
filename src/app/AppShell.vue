<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { getChapterMeta } from '@/content/loader'
import { chapterCompletion } from './completion'
import { useProgress } from './progress'
import { useAndroidBack, useNativeBars } from './native'
import { useIsPhone } from './useIsPhone'
import BottomTabs from './BottomTabs.vue'
import ThemePicker from './ThemePicker.vue'
import TextSettings from './TextSettings.vue'
import AppLogo from './AppLogo.vue'

const route = useRoute()
const router = useRouter()
const { state } = useProgress()
const isPhone = useIsPhone()
useNativeBars()
useAndroidBack(router)

const TITLES: Record<string, string> = {
  home: 'Mental Math',
  'practice-hub': 'Practice',
  practice: 'Practice',
  progress: 'Progress',
  settings: 'Settings',
  about: 'About',
  privacy: 'Privacy',
}
const phoneTitle = computed(() => {
  if (route.name === 'read')
    return getChapterMeta(String(route.params.chapter ?? ''))?.kicker ?? 'Read'
  return TITLES[String(route.name)] ?? 'Mental Math'
})

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
  <div class="shell" :class="{ focus: state.settings.focus && inReader, phone: isPhone }">
    <header class="top">
      <RouterLink to="/" class="wordmark"
        ><AppLogo /><span v-if="!isPhone" class="wm">Mental<em>Math</em></span></RouterLink
      >
      <span v-if="isPhone" class="page-title" data-testid="page-title">{{ phoneTitle }}</span>
      <div id="shell-center" class="center" />
      <nav v-if="!isPhone" class="controls" aria-label="Display">
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
        <ThemePicker />
        <TextSettings />
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
        <RouterLink :to="{ name: 'progress' }" class="about" data-testid="nav-progress"
          >Progress</RouterLink
        >
        <RouterLink :to="{ name: 'settings' }" class="about" data-testid="nav-settings"
          >Settings</RouterLink
        >
      </nav>
      <nav v-else class="controls" aria-label="Status">
        <span
          v-if="completion"
          class="ring"
          role="img"
          :aria-label="`${completion.done} of ${completion.total} sections read`"
          :style="{ '--p': `${Math.round(completion.fraction * 100)}%` }"
        />
        <span
          v-if="state.streak.current > 0"
          class="streak"
          :title="`${state.streak.current} day streak`"
          >🔥 {{ state.streak.current }}</span
        >
      </nav>
    </header>
    <main class="main">
      <RouterView />
    </main>
    <BottomTabs v-if="isPhone" />
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
  height: calc(52px + env(safe-area-inset-top, 0px));
  padding: env(safe-area-inset-top, 0px) var(--gutter) 0;
  background: var(--surface);
  border-bottom: 1px solid var(--rule);
  font-family: var(--font-sans);
}
.wordmark {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--ink);
  letter-spacing: 0.01em;
}
.wordmark em {
  font-style: normal;
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
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 0.3rem;
}
.navlink.router-link-active {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
.main {
  flex: 1;
  min-width: 0;
}
.page-title {
  font-weight: 700;
  color: var(--ink);
  font-size: 1.05rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.shell.phone {
  --tabbar-h: 56px;
}
.shell.phone .main {
  padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px));
}
@media (max-width: 719px) {
  .about,
  .focus-toggle {
    display: none;
  }
  /* The chapter select has no room beside the controls; the pill and the outline navigate instead. */
  .center {
    display: none;
  }
  .top {
    gap: 0.6rem;
    padding: 0 0.75rem;
    grid-template-columns: auto minmax(0, 1fr) auto;
  }
  .controls {
    gap: 0.35rem;
  }
}
</style>
