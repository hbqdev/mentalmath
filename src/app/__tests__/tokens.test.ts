import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8')

describe('design tokens', () => {
  it('defines the light palette on :root', () => {
    expect(css).toMatch(/:root\s*{[^}]*--paper:\s*#f6f1e7/i)
    expect(css).toMatch(/:root\s*{[^}]*--accent:\s*#8b2e2e/i)
  })
  it('defines the dark palette under data-theme="dark"', () => {
    expect(css).toMatch(/\[data-theme=['"]?dark['"]?\]\s*{[^}]*--paper:\s*#0f1720/i)
    expect(css).toMatch(/\[data-theme=['"]?dark['"]?\]\s*{[^}]*--accent:\s*#f5a524/i)
  })
  it('defines three font scale steps', () => {
    for (const step of ['0', '1', '2']) {
      expect(css).toContain(`[data-font-scale='${step}']`)
    }
  })
})
