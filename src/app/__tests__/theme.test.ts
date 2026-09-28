import { beforeEach, describe, expect, it } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { STORAGE_KEY, disposeProgressStore, useProgress } from '../progress'
import { useTheme } from '../theme'

beforeEach(() => {
  localStorage.clear()
  disposeProgressStore()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-font')
  document.documentElement.style.removeProperty('--body-size')
})

describe('useTheme', () => {
  it('writes the explicit theme and font scale to <html>', async () => {
    const scope = effectScope()
    scope.run(() => {
      const p = useProgress()
      useTheme()
      p.state.value.settings.theme = 'dark'
      p.state.value.settings.fontSize = 21
      p.state.value.settings.font = 'sans'
    })
    await nextTick()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.getPropertyValue('--body-size')).toBe('21px')
    expect(document.documentElement.dataset.font).toBe('sans')
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

  it('clamps the text size and ignores unknown fonts', async () => {
    const scope = effectScope()
    let api!: ReturnType<typeof useTheme>
    scope.run(() => {
      api = useTheme()
    })
    api.setFontSize(40)
    await nextTick()
    expect(document.documentElement.style.getPropertyValue('--body-size')).toBe('24px')
    api.setFontSize(3)
    await nextTick()
    expect(document.documentElement.style.getPropertyValue('--body-size')).toBe('14px')
    api.setFont('mono')
    api.setFont('comic')
    await nextTick()
    expect(document.documentElement.dataset.font).toBe('mono')
    scope.stop()
  })
})
