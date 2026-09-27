import { describe, expect, it } from 'vitest'
import { createRng } from '../rng'

describe('createRng', () => {
  it('is deterministic for a seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    const xs = Array.from({ length: 20 }, () => a.int(0, 1000))
    const ys = Array.from({ length: 20 }, () => b.int(0, 1000))
    expect(xs).toEqual(ys)
    expect(new Set(xs).size).toBeGreaterThan(10)
  })
  it('int is inclusive on both bounds and never escapes them', () => {
    const r = createRng(7)
    const seen = new Set<number>()
    for (let i = 0; i < 2000; i++) {
      const v = r.int(3, 6)
      expect(v).toBeGreaterThanOrEqual(3)
      expect(v).toBeLessThanOrEqual(6)
      seen.add(v)
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6])
  })
  it('pick and shuffle stay within the input', () => {
    const r = createRng(1)
    const xs = [1, 2, 3, 4, 5]
    for (let i = 0; i < 50; i++) expect(xs).toContain(r.pick(xs))
    const s = r.shuffle(xs)
    expect([...s].sort()).toEqual(xs)
    expect(xs).toEqual([1, 2, 3, 4, 5])
  })
  it('chance respects probability roughly and exposes its seed', () => {
    const r = createRng(99)
    let hits = 0
    for (let i = 0; i < 5000; i++) if (r.chance(0.25)) hits++
    expect(hits / 5000).toBeGreaterThan(0.2)
    expect(hits / 5000).toBeLessThan(0.3)
    expect(r.seed).toBe(99)
    expect(typeof createRng().seed).toBe('number')
  })
})
