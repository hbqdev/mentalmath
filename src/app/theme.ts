import { usePreferredDark } from '@vueuse/core'
import { computed, watchEffect } from 'vue'
import { useProgress } from './progress'

export const MIN_SIZE = 14
export const MAX_SIZE = 24
const clampSize = (px: number) =>
  Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(Number(px) || 18)))
const FONTS: Array<{ value: 'serif' | 'sans' | 'system' | 'mono'; label: string; sample: string }> =
  [
    { value: 'serif', label: 'Serif', sample: 'Source Serif' },
    { value: 'sans', label: 'Sans', sample: 'Alegreya Sans' },
    { value: 'system', label: 'System', sample: 'Your device font' },
    { value: 'mono', label: 'Mono', sample: 'JetBrains Mono' },
  ]

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
    root.style.setProperty('--body-size', `${clampSize(state.value.settings.fontSize)}px`)
    root.dataset.font = state.value.settings.font
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

  function setFontSize(px: number) {
    state.value.settings.fontSize = clampSize(px)
  }
  function setFont(f: string) {
    if (FONTS.some((x) => x.value === f))
      state.value.settings.font = f as (typeof FONTS)[number]['value']
  }

  return {
    resolved,
    themes: THEMES,
    setTheme,
    cycleTheme,
    fonts: FONTS,
    setFontSize,
    setFont,
    MIN_SIZE,
    MAX_SIZE,
  }
}
