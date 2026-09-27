import { usePreferredDark } from '@vueuse/core'
import { computed, watchEffect } from 'vue'
import { useProgress } from './progress'

export function useTheme() {
  const { state } = useProgress()
  const prefersDark = usePreferredDark()
  const resolved = computed<'light' | 'dark'>(() => {
    const t = state.value.settings.theme
    if (t === 'system') return prefersDark.value ? 'dark' : 'light'
    return t
  })

  watchEffect(() => {
    const root = document.documentElement
    root.dataset.theme = resolved.value
    root.dataset.fontScale = String(state.value.settings.fontScale)
  })

  function cycleTheme() {
    const order: Array<'system' | 'light' | 'dark'> = ['system', 'light', 'dark']
    const i = order.indexOf(state.value.settings.theme)
    state.value.settings.theme = order[(i + 1) % order.length] ?? 'system'
  }

  function cycleFontScale() {
    const next = ((state.value.settings.fontScale + 1) % 3) as 0 | 1 | 2
    state.value.settings.fontScale = next
  }

  return { resolved, cycleTheme, cycleFontScale }
}
