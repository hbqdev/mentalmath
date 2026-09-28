<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const tabs = [
  { id: 'read', label: 'Read', to: { name: 'home' }, names: ['home', 'read'] },
  {
    id: 'practice',
    label: 'Practice',
    to: { name: 'practice-hub' },
    names: ['practice-hub', 'practice'],
  },
  { id: 'progress', label: 'Progress', to: { name: 'progress' }, names: ['progress'] },
  {
    id: 'settings',
    label: 'Settings',
    to: { name: 'settings' },
    names: ['settings', 'about', 'privacy'],
  },
] as const
const active = computed(
  () => tabs.find((t) => (t.names as readonly string[]).includes(String(route.name)))?.id ?? 'read',
)
</script>

<template>
  <nav class="tabs" aria-label="Main" data-testid="tab-bar">
    <RouterLink
      v-for="t in tabs"
      :key="t.id"
      class="tab"
      :class="{ on: active === t.id }"
      :to="t.to"
      :aria-current="active === t.id ? 'page' : undefined"
      :data-testid="`tab-${t.id}`"
    >
      <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
        <template v-if="t.id === 'read'">
          <path
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5zM12 3h5.5A2.5 2.5 0 0 1 20 5.5v16a2.5 2.5 0 0 0-2.5-2.5H12z"
          />
        </template>
        <template v-else-if="t.id === 'practice'">
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </template>
        <template v-else-if="t.id === 'progress'">
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke-linecap="round" />
        </template>
        <template v-else>
          <path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke-linecap="round" />
          <circle cx="16" cy="7" r="2.2" />
          <circle cx="10" cy="17" r="2.2" />
        </template>
      </svg>
      <span>{{ t.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabs {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 25;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  height: calc(var(--tabbar-h, 56px) + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: var(--surface);
  border-top: 1px solid var(--rule);
  font-family: var(--font-sans);
}
.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--muted);
  font-size: 0.7rem;
  font-weight: 600;
  text-decoration: none;
  min-height: 44px;
}
.tab.on {
  color: var(--accent);
}
.tab:hover {
  text-decoration: none;
}
.ico {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linejoin: round;
}
</style>
