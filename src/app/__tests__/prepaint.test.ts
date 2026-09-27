// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// The inline script in index.html must set the theme from storage before the app mounts.
const html = readFileSync(new URL('../../../index.html', import.meta.url), 'utf8')
const script = /<script>([\s\S]*?)<\/script>/.exec(html)![1]!

function run(stored: string | null, prefersDark = false) {
  const dataset: Record<string, string> = {}
  const localStorage = { getItem: () => stored }
  const window = { matchMedia: () => ({ matches: prefersDark }) }
  const document = { documentElement: { dataset } }
  new Function('localStorage', 'window', 'document', script)(localStorage, window, document)
  return dataset
}

describe('pre-paint theme script', () => {
  it('applies a saved dark theme and text size', () => {
    expect(run(JSON.stringify({ settings: { theme: 'dark', fontScale: 2 } }))).toEqual({
      theme: 'dark',
      fontScale: '2',
    })
  })
  it('applies the bright theme', () => {
    expect(run(JSON.stringify({ settings: { theme: 'bright' } })).theme).toBe('bright')
  })
  it('falls back to the system preference and the default size', () => {
    expect(run(null, true)).toEqual({ theme: 'dark', fontScale: '1' })
    expect(run(JSON.stringify({ settings: { theme: 'system' } }), false)).toEqual({
      theme: 'light',
      fontScale: '1',
    })
  })
  it('survives broken storage', () => {
    expect(run('{not json')).toEqual({})
  })
})
