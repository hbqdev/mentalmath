import { usePreferredDark } from '@vueuse/core'
import { computed, watchEffect } from 'vue'
import { useProgress } from './progress'

export function useTheme() {
  const { state } = useProgress()
  const prefersDark = usePreferredDark()
  const resolved = computed<'light' | 'bright' | 'dark'>(() => {
    const t = state.value.settings.theme
    if (t === 'system') return prefersDark.value ? 'dark' : 'light'
    return t
  })

  watchEffect(() => {
    const root = document.documentElement
    root.dataset.theme = resolved.value
    root.dataset.fontScale = String(state.value.settings.fontScale)
  })

  const THEMES: Array<{ value: 'system' | 'light' | 'bright' | 'dark'; label: string }> = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Paper' },
    { value: 'bright', label: 'Bright' },
    { value: 'dark', label: 'Dark' },
  ]
  function setTheme(t: string) {
    if (THEMES.some((x) => x.value === t))
      state.value.settings.theme = t as (typeof THEMES)[number]['value']
  }
  function cycleTheme() {
    const i = THEMES.findIndex((x) => x.value === state.value.settings.theme)
    state.value.settings.theme = THEMES[(i + 1) % THEMES.length]!.value
  }

  function cycleFontScale() {
    const next = ((state.value.settings.fontScale + 1) % 3) as 0 | 1 | 2
    state.value.settings.fontScale = next
  }

  return { resolved, themes: THEMES, setTheme, cycleTheme, cycleFontScale }
}
