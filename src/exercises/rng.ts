import type { Rng } from './types'

/** mulberry32: small, fast, good enough for drills; deterministic per seed. */
export function createRng(seed?: number): Rng {
  const s0 = (seed ?? Date.now()) >>> 0
  let a = s0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    seed: s0,
    int(min, max) {
      const lo = Math.ceil(min)
      const hi = Math.floor(max)
      return lo + Math.floor(next() * (hi - lo + 1))
    },
    pick(xs) {
      if (xs.length === 0) throw new Error('pick from empty list')
      return xs[Math.floor(next() * xs.length)]!
    },
    chance(p) {
      return next() < p
    },
    shuffle(xs) {
      const out = [...xs]
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[out[i], out[j]] = [out[j]!, out[i]!]
      }
      return out
    },
  }
}
