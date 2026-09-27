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

  it('offers four named themes and applies the bright one', async () => {
    const scope = effectScope()
    let api!: ReturnType<typeof useTheme>
    scope.run(() => {
      api = useTheme()
    })
    expect(api.themes.map((t) => t.value)).toEqual(['system', 'light', 'bright', 'dark'])
    api.setTheme('bright')
    await nextTick()
    expect(document.documentElement.dataset.theme).toBe('bright')
    api.setTheme('nonsense')
    await nextTick()
    expect(document.documentElement.dataset.theme).toBe('bright')
    scope.stop()
  })
})
