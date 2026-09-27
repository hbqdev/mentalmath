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
    return [`${a} ${MINUS} ${b} = ${a} ${MINUS} ${r} + ${c}`, `${a} ${MINUS} ${r} = ${a - r}`, `${a - r} + ${c} = ${a - b}`]
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

/** Steps for n² by rounding to the nearest multiple of `unit` (10 for two digits, 100 for three). */
export function stepsSquareNear(n: number, unit = n >= 100 ? 100 : 10): string[] {
  const near = Math.round(n / unit) * unit
  const d = Math.abs(n - near)
  if (d === 0) return [`${n}² = ${n * n}`]
  const lo = n - d
  const hi = n + d
  const steps = [`${n}² = ${hi} × ${lo} + ${d}²`, `${hi} × ${lo} = ${hi * lo}`]
  if (d >= 10) {
    const near2 = Math.round(d / 10) * 10
    const d2 = Math.abs(d - near2)
    steps.push(d2 === 0 ? `${d}² = ${d * d}` : `${d}² = ${d + d2} × ${d - d2} + ${d2}² = ${d * d}`)
  } else {
    steps.push(`${d}² = ${d * d}`)
  }
  steps.push(`${hi * lo} + ${d * d} = ${n * n}`)
  return steps
}

export function stepsFactoring(a: number, b: number, f1: number, f2: number): string[] {
  return [`${b} = ${f1} × ${f2}`, `${a} × ${f1} = ${a * f1}`, `${a * f1} × ${f2} = ${a * b}`]
}

export function stepsAdditionMethod(a: number, b: number): string[] {
  const tens = Math.floor(b / 10) * 10
  const ones = b % 10
  if (ones === 0) return [`${a} × ${b} = ${a * b}`]
  return [`${a} × ${tens} = ${a * tens}`, `${a} × ${ones} = ${a * ones}`, `${a * tens} + ${a * ones} = ${a * b}`]
}

export function stepsSubtractionMethod(a: number, b: number): string[] {
  const r = Math.ceil(b / 10) * 10
  const k = r - b
  if (k === 0) return [`${a} × ${b} = ${a * b}`]
  return [`${a} × ${r} = ${a * r}`, `${a} × ${k} = ${a * k}`, `${a * r} ${MINUS} ${a * k} = ${a * b}`]
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

/**
 * Chapter 8's approach to big products: take the smaller factor apart. Factor it when it
 * factors into pieces ≤ 12, round it up when it sits just below a multiple of 10, otherwise
 * split it into its leading part and the rest.
 */
export function stepsBigProduct(a: number, b: number): string[] {
  const [x, y] = a >= b ? [a, b] : [b, a]
  const pair = y < 100 ? nearestFactorPair(y) : null
  if (pair) {
    const [f1, f2] = pair
    return [`${y} = ${f1} × ${f2}`, `${x} × ${f1} = ${x * f1}`, `${x * f1} × ${f2} = ${a * b}`]
  }
  if (y < 100 && y % 10 >= 7) {
    const r = Math.ceil(y / 10) * 10
    const k = r - y
    return [`${y} = ${r} ${MINUS} ${k}`, `${x} × ${r} = ${x * r}`, `${x} × ${k} = ${x * k}`, `${x * r} ${MINUS} ${x * k} = ${a * b}`]
  }
  const unit = 10 ** (String(y).length - 1)
  const hi = Math.floor(y / unit) * unit
  const lo = y - hi
  if (lo === 0) return [`${x} × ${y} = ${a * b}`]
  return [`${y} = ${hi} + ${lo}`, `${x} × ${hi} = ${x * hi}`, `${x} × ${lo} = ${x * lo}`, `${x * hi} + ${x * lo} = ${a * b}`]
}

export function nearestFactorPair(n: number): [number, number] | null {
  for (let f = Math.floor(Math.sqrt(n)); f >= 2; f--) {
    if (n % f === 0 && n / f <= 12) return [f, n / f]
  }
  return null
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
