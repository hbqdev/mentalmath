import { describe, expect, it } from 'vitest'

describe('toolchain', () => {
  it('runs TypeScript tests under happy-dom', () => {
    expect(typeof document).toBe('object')
    const n: number = 1
    expect(n + 1).toBe(2)
  })
})
