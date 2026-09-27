import { beforeEach, describe, expect, it } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { STORAGE_KEY, disposeProgressStore, useProgress } from '../progress'
import { useTheme } from '../theme'

beforeEach(() => {
  localStorage.clear()
  disposeProgressStore()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-font-scale')
})

describe('useTheme', () => {
  it('writes the explicit theme and font scale to <html>', async () => {
    const scope = effectScope()
    scope.run(() => {
      const p = useProgress()
      useTheme()
      p.state.value.settings.theme = 'dark'
      p.state.value.settings.fontScale = 2
    })
    await nextTick()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.dataset.fontScale).toBe('2')
    scope.stop()
  })

  it('resolves "system" to light or dark from the OS preference', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings: { theme: 'system' } }))
    const scope = effectScope()
    scope.run(() => useTheme())
    await nextTick()
    expect(['light', 'dark']).toContain(document.documentElement.dataset.theme)
    scope.stop()
  })
})
