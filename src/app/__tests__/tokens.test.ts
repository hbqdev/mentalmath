// @vitest-environment node
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
  it('defines a reading face per font setting', () => {
    for (const f of ['sans', 'system', 'mono']) expect(css).toContain(`[data-font='${f}']`)
    expect(css).toMatch(/--font-body:\s*var\(--font-serif\)/)
  })
})
