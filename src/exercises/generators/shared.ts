import { createRng } from '../rng'
import type { Difficulty, Exercise, ExerciseDraft, GeneratedSetDef, Rng } from '../types'

export const MINUS = '−'

export function digits(n: number): number[] {
  return String(Math.abs(n)).split('').map(Number)
}

/** 327 -> [300, 20, 7] (zeros skipped) */
export function placeParts(n: number): number[] {
  const ds = digits(n)
  return ds.map((d, i) => d * 10 ** (ds.length - 1 - i)).filter((p) => p > 0)
}

export function stepsLeftToRightAdd(a: number, b: number): string[] {
  const steps: string[] = []
  let running = a
  for (const part of placeParts(b)) {
    steps.push(`${running} + ${part} = ${running + part}`)
    running += part
  }
  return steps.length ? steps : [`${a} + ${b} = ${a + b}`]
}

export function stepsLeftToRightSub(a: number, b: number): string[] {
  const borrow = b % 10 !== 0 && a % 10 < b % 10
  if (borrow) {
    const r = Math.ceil(b / 10) * 10
    const c = r - b
    return [
      `${a} ${MINUS} ${b} = ${a} ${MINUS} ${r} + ${c}`,
      `${a} ${MINUS} ${r} = ${a - r}`,
      `${a - r} + ${c} = ${a - b}`,
    ]
  }
  const steps: string[] = []
  let running = a
  for (const part of placeParts(b)) {
    steps.push(`${running} ${MINUS} ${part} = ${running - part}`)
    running -= part
  }
  return steps.length ? steps : [`${a} ${MINUS} ${b} = ${a - b}`]
}

export function stepsMultiplyByDigit(a: number, d: number): string[] {
  const parts = placeParts(a)
  const products = parts.map((p) => p * d)
  const steps = parts.map((p, i) => `${p} × ${d} = ${products[i]}`)
  let running = products[0] ?? 0
  for (let i = 1; i < products.length; i++) {
    steps.push(`${running} + ${products[i]} = ${running + products[i]!}`)
    running += products[i]!
  }
  if (products.length === 1) steps[0] = `${a} × ${d} = ${a * d}`
  return steps
}

/** Thousands separators for the big numbers of chapter 8. */
export const fmt = (n: number) => n.toLocaleString('en-US')

/** Lines that work d² down to single-digit squares by rounding to the leading place. */
function squareLines(d: number): string[] {
  if (d < 10) return [`${d}² = ${d * d}`]
  const unit = 10 ** (String(d).length - 1)
  const near = Math.round(d / unit) * unit
  const d2 = Math.abs(d - near)
  if (d2 === 0) return [`${d}² = ${fmt(d * d)}`]
  const lines = [`${d}² = ${d + d2} × ${d - d2} + ${d2}² = ${fmt(d * d)}`]
  if (d2 >= 10) lines.push(...squareLines(d2))
  return lines
}

/** Steps for n² by rounding to the nearest multiple of `unit` (10 for two digits, 100 for three, 1000 for four). Five digits and up split into thousands + rest. */
export function stepsSquareNear(n: number, unit = n >= 100 ? 100 : 10): string[] {
  if (n >= 10000) return stepsSquareSplit(n)
  const near = Math.round(n / unit) * unit
  const d = Math.abs(n - near)
  if (d === 0) return [`${n}² = ${fmt(n * n)}`]
  const lo = n - d
  const hi = n + d
  return [
    `${n}² = ${hi} × ${lo} + ${d}²`,
    `${hi} × ${lo} = ${fmt(hi * lo)}`,
    ...squareLines(d),
    `${fmt(hi * lo)} + ${fmt(d * d)} = ${fmt(n * n)}`,
  ]
}

/** Chapter 8's five-digit squares: (a + b)² with a the thousands, the cross term doubled, b² last. */
export function stepsSquareSplit(n: number): string[] {
  const a = Math.floor(n / 1000) * 1000
  const b = n - a
  if (b === 0) return [`${fmt(n)}² = ${fmt(n * n)}`]
  const k = a / 1000
  const cross = stepsBigProduct(b, k)
  const aa = a * a
  const twoAb = 2 * a * b
  return [
    `${fmt(n)}² = (${fmt(a)} + ${b})²`,
    ...cross,
    `${fmt(b * k)} × 2,000 = ${fmt(twoAb)}`,
    `${fmt(a)}² = ${fmt(aa)}`,
    `${fmt(aa)} + ${fmt(twoAb)} = ${fmt(aa + twoAb)}`,
    ...squareLines(b),
    `${fmt(aa + twoAb)} + ${fmt(b * b)} = ${fmt(n * n)}`,
  ]
}

export function stepsFactoring(a: number, b: number, f1: number, f2: number): string[] {
  return [`${b} = ${f1} × ${f2}`, `${a} × ${f1} = ${a * f1}`, `${a * f1} × ${f2} = ${a * b}`]
}

export function stepsAdditionMethod(a: number, b: number): string[] {
  const tens = Math.floor(b / 10) * 10
  const ones = b % 10
  if (ones === 0) return [`${a} × ${b} = ${a * b}`]
  return [
    `${a} × ${tens} = ${a * tens}`,
    `${a} × ${ones} = ${a * ones}`,
    `${a * tens} + ${a * ones} = ${a * b}`,
  ]
}

export function stepsSubtractionMethod(a: number, b: number): string[] {
  const r = Math.ceil(b / 10) * 10
  const k = r - b
  if (k === 0) return [`${a} × ${b} = ${a * b}`]
  return [
    `${a} × ${r} = ${a * r}`,
    `${a} × ${k} = ${a * k}`,
    `${a * r} ${MINUS} ${a * k} = ${a * b}`,
  ]
}

/** Steps for n × 11 by adding neighbouring digits (with carries resolved). */
export function stepsTimes11(n: number): string[] {
  const ds = digits(n)
  const answer = n * 11
  if (ds.length === 2) {
    const [x, y] = ds as [number, number]
    const s = x + y
    if (s < 10) return [`${x} + ${y} = ${s}`, `Put ${s} between ${x} and ${y}: ${answer}`]
    return [`${x} + ${y} = ${s}`, `Write ${s - 10} between, carry 1 to the ${x}: ${answer}`]
  }
  const sums = ds.slice(0, -1).map((d, i) => `${d} + ${ds[i + 1]} = ${d + ds[i + 1]!}`)
  const raw = [ds[0], ...ds.slice(0, -1).map((d, i) => d + ds[i + 1]!), ds[ds.length - 1]]
  return [...sums, `Digits ${raw.join(' ')} with carries resolved: ${answer}`]
}

export function nearestFactorPair(n: number): [number, number] | null {
  for (let f = Math.floor(Math.sqrt(n)); f >= 2; f--) {
    if (n % f === 0 && n / f <= 12) return [f, n / f]
  }
  return null
}

/** n as two factors ≤ 12 (closest pair), else three, largest first; null when it has none. */
export function smallFactors(n: number): number[] | null {
  if (n >= 2 && n <= 12) return [n]
  const pair = nearestFactorPair(n)
  if (pair) return [pair[1], pair[0]]
  for (let f = 12; f >= 2; f--) {
    if (n % f !== 0) continue
    const rest = nearestFactorPair(n / f)
    if (rest) return [f, rest[1], rest[0]].sort((x, y) => y - x)
  }
  return null
}

function factoringSteps(x: number, y: number, fs: number[]): string[] {
  const steps = [`${y} = ${fs.join(' × ')}`]
  let running = x
  for (const f of fs) {
    steps.push(`${fmt(running)} × ${f} = ${fmt(running * f)}`)
    running *= f
  }
  return steps
}

const sign = (d: number) => (d < 0 ? MINUS : '+')

/**
 * Chapter 8's routes for big products, tried in the book's order of preference:
 * factor a number into pieces ≤ 12; the close-together method when both sit within 60 of
 * the same hundred; round a number that sits within 9 of a multiple of 100 and adjust;
 * otherwise split the smaller number into its tens and ones. Five-digit numbers use
 * the four partial products of thousands and remainders.
 */
export function stepsBigProduct(a: number, b: number): string[] {
  const [x, y] = a >= b ? [a, b] : [b, a]
  const total = fmt(a * b)
  if (y < 100) {
    const fs = smallFactors(y)
    if (fs) return factoringSteps(x, y, fs)
    if (y % 10 >= 7) {
      const r = Math.ceil(y / 10) * 10
      const k = r - y
      return [
        `${y} = ${r} ${MINUS} ${k}`,
        `${x} × ${r} = ${fmt(x * r)}`,
        `${x} × ${k} = ${fmt(x * k)}`,
        `${fmt(x * r)} ${MINUS} ${fmt(x * k)} = ${total}`,
      ]
    }
    const tens = Math.floor(y / 10) * 10
    const ones = y - tens
    if (ones === 0) return [`${x} × ${y} = ${total}`]
    return [
      `${y} = ${tens} + ${ones}`,
      `${x} × ${tens} = ${fmt(x * tens)}`,
      `${x} × ${ones} = ${fmt(x * ones)}`,
      `${fmt(x * tens)} + ${fmt(x * ones)} = ${total}`,
    ]
  }
  if (x < 1000) {
    for (const [p, q] of [
      [x, y],
      [y, x],
    ] as const) {
      const fs = smallFactors(q)
      if (fs) return factoringSteps(p, q, fs)
    }
    const base = Math.round((x + y) / 200) * 100
    const p = x - base
    const q = y - base
    if (Math.abs(p) <= 60 && Math.abs(q) <= 60 && p !== 0 && q !== 0) {
      const pq = p * q
      return [
        `${x} = ${base} ${sign(p)} ${Math.abs(p)}, ${y} = ${base} ${sign(q)} ${Math.abs(q)}`,
        `${base} × ${base + p + q} = ${fmt(base * (base + p + q))}`,
        `(${sign(p)}${Math.abs(p)}) × (${sign(q)}${Math.abs(q)}) = ${pq < 0 ? MINUS : ''}${fmt(Math.abs(pq))}`,
        `${fmt(base * (base + p + q))} ${sign(pq)} ${fmt(Math.abs(pq))} = ${total}`,
      ]
    }
    for (const [p, q] of [
      [y, x],
      [x, y],
    ] as const) {
      const r = Math.round(q / 100) * 100
      const d = q - r
      if (d !== 0 && Math.abs(d) <= 9) {
        const ad = Math.abs(d)
        return [
          `${q} = ${r} ${sign(d)} ${ad}`,
          `${r} × ${p} = ${fmt(r * p)}`,
          `${ad} × ${p} = ${fmt(ad * p)}`,
          `${fmt(r * p)} ${sign(d)} ${fmt(ad * p)} = ${total}`,
        ]
      }
    }
    const [keep, split] = x % 10 === 0 ? [y, x] : [x, y]
    const tens = Math.floor(split / 10) * 10
    const ones = split - tens
    if (ones === 0) {
      const hundreds = Math.floor(split / 100) * 100
      const rest = split - hundreds
      if (rest === 0) return [`${keep} × ${split} = ${total}`]
      return [
        `${split} = ${hundreds} + ${rest}`,
        `${keep} × ${hundreds} = ${fmt(keep * hundreds)}`,
        `${keep} × ${rest} = ${fmt(keep * rest)}`,
        `${fmt(keep * hundreds)} + ${fmt(keep * rest)} = ${total}`,
      ]
    }
    return [
      `${split} = ${tens} + ${ones}`,
      `${keep} × ${tens} = ${fmt(keep * tens)}`,
      `${keep} × ${ones} = ${fmt(keep * ones)}`,
      `${fmt(keep * tens)} + ${fmt(keep * ones)} = ${total}`,
    ]
  }
  if (y < 1000) {
    const unit = 10 ** (String(y).length - 1)
    const hi = Math.floor(y / unit) * unit
    const lo = y - hi
    if (lo === 0) return [`${fmt(x)} × ${y} = ${total}`]
    return [
      `${y} = ${hi} + ${lo}`,
      `${fmt(x)} × ${hi} = ${fmt(x * hi)}`,
      `${fmt(x)} × ${lo} = ${fmt(x * lo)}`,
      `${fmt(x * hi)} + ${fmt(x * lo)} = ${total}`,
    ]
  }
  // thousands and remainders: (xh·1000 + xl)(yh·1000 + yl)
  const xh = Math.floor(x / 1000)
  const xl = x - xh * 1000
  const yh = Math.floor(y / 1000)
  const yl = y - yh * 1000
  const mid = (yl * xh + xl * yh) * 1000
  const top = xh * yh * 1_000_000
  return [
    `${fmt(x)} = ${fmt(xh * 1000)} + ${xl}, ${fmt(y)} = ${fmt(yh * 1000)} + ${yl}`,
    `${yl} × ${xh} = ${fmt(yl * xh)}`,
    `${xl} × ${yh} = ${fmt(xl * yh)}`,
    `(${fmt(yl * xh)} + ${fmt(xl * yh)}) × 1,000 = ${fmt(mid)}`,
    `${xh} × ${yh} × 1,000,000 = ${fmt(top)}`,
    `${fmt(top)} + ${fmt(mid)} = ${fmt(top + mid)}`,
    `${xl} × ${yl} = ${fmt(xl * yl)}`,
    `${fmt(top + mid)} + ${fmt(xl * yl)} = ${total}`,
  ]
}

export function makeExercise(setId: string, i: number, draft: ExerciseDraft): Exercise {
  return { id: `${setId}-${i}`, setId, source: 'generated', ...draft }
}

export function generateMany(
  def: GeneratedSetDef,
  count: number,
  difficulty: Difficulty | 'mixed',
  rng: Rng = createRng(),
): Exercise[] {
  const diffs: Difficulty[] = ['easy', 'medium', 'hard']
  const out: Exercise[] = []
  for (let i = 0; i < count; i++) {
    const d = difficulty === 'mixed' ? diffs[Math.min(2, Math.floor((i / count) * 3))]! : difficulty
    out.push(makeExercise(def.id, i, def.generate(d, rng)))
  }
  return out
}

export const integer = (value: number) => ({ kind: 'integer' as const, value })
export const times = (a: number, b: number) => ({ kind: 'binary' as const, a, b, op: '×' as const })
