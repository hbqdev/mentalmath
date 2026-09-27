import type { BookProblem } from '@/exercises/bookSets'
import { reduce } from '@/exercises/checker'
import { WEEKDAY_OPTIONS, dayOfWeek, daySteps } from '@/exercises/dates'
import {
  MINUS,
  stepsBigProduct,
  stepsMultiplyByDigit,
  stepsSquareNear,
  stepsTimes11,
} from '@/exercises/generators/shared'
import type { Frac } from '@/exercises/types'

// Constructors compute answers from the operands (a transcription slip in an answer is
// impossible) and default the steps to the book's method builders; pass steps to override
// with the book's exact working.

type Pair = [number, number]
const fr = ([num, den]: Pair): Frac => ({ num, den })
const ft = (f: Frac) => `${f.num}/${f.den}`

export function add(n: number, a: number, b: number, steps: string[]): BookProblem {
  return {
    n,
    prompt: { kind: 'binary', a, b, op: '+' },
    answer: { kind: 'integer', value: a + b },
    steps,
  }
}
export function sub(n: number, a: number, b: number, steps: string[]): BookProblem {
  return {
    n,
    prompt: { kind: 'binary', a, b, op: '-' },
    answer: { kind: 'integer', value: a - b },
    steps,
  }
}
/** a × b with b a single digit: partial products left to right. */
export function mul(n: number, a: number, b: number, steps?: string[]): BookProblem {
  return {
    n,
    prompt: { kind: 'binary', a, b, op: '×' },
    answer: { kind: 'integer', value: a * b },
    steps: steps ?? stepsMultiplyByDigit(a, b),
  }
}
export function times11(n: number, a: number): BookProblem {
  return {
    n,
    prompt: { kind: 'binary', a, b: 11, op: '×' },
    answer: { kind: 'integer', value: a * 11 },
    steps: stepsTimes11(a),
  }
}
/** Addition method: split the factor whose ones digit is smallest, or `split` where the book chose otherwise. */
export function mulAdd(n: number, a: number, b: number, split?: number): BookProblem {
  const y = split ?? (a % 10 <= b % 10 ? a : b) // y is split
  const x = y === a ? b : a
  const tens = Math.floor(y / 10) * 10
  const ones = y % 10
  const steps =
    ones === 0
      ? [`${x} × ${y} = ${x * y}`]
      : [
          `${y} = ${tens} + ${ones}`,
          `${x} × ${tens} = ${x * tens}`,
          `${x} × ${ones} = ${x * ones}`,
          `${x * tens} + ${x * ones} = ${a * b}`,
        ]
  return {
    n,
    prompt: { kind: 'binary', a, b, op: '×' },
    answer: { kind: 'integer', value: a * b },
    steps,
  }
}
/** Subtraction method: round the factor nearest below a multiple of 10 up, then subtract the excess. */
export function mulSub(n: number, a: number, b: number): BookProblem {
  const gap = (v: number) => (10 - (v % 10)) % 10
  const [x, y] = gap(a) !== 0 && (gap(b) === 0 || gap(a) <= gap(b)) ? [b, a] : [a, b] // y is rounded
  const r = Math.ceil(y / 10) * 10
  const k = r - y
  const steps =
    k === 0
      ? [`${x} × ${y} = ${x * y}`]
      : [
          `${y} = ${r} ${MINUS} ${k}`,
          `${x} × ${r} = ${x * r}`,
          `${x} × ${k} = ${x * k}`,
          `${x * r} ${MINUS} ${x * k} = ${a * b}`,
        ]
  return {
    n,
    prompt: { kind: 'binary', a, b, op: '×' },
    answer: { kind: 'integer', value: a * b },
    steps,
  }
}
/** Factoring method: one operand as the book factors it (two or three factors). */
export function mulFactor(n: number, a: number, b: number, factors: number[]): BookProblem {
  const product = factors.reduce((acc, f) => acc * f, 1)
  const [x, y] = product === b ? [a, b] : [b, a] // factor whichever operand the book factors
  if (product !== y) throw new Error(`bad factors for ${a} × ${b}`)
  const steps = [`${y} = ${factors.join(' × ')}`]
  let running = x
  for (const f of factors) {
    steps.push(`${running} × ${f} = ${running * f}`)
    running *= f
  }
  return {
    n,
    prompt: { kind: 'binary', a, b, op: '×' },
    answer: { kind: 'integer', value: a * b },
    steps,
  }
}
export function sq(n: number, base: number, steps?: string[]): BookProblem {
  return {
    n,
    prompt: { kind: 'power', base, exp: 2 },
    answer: { kind: 'integer', value: base * base },
    steps: steps ?? stepsSquareNear(base),
  }
}
export function cube(n: number, base: number): BookProblem {
  const near = Math.round(base / 10) * 10
  const d = Math.abs(base - near)
  const lo = base - d
  const hi = base + d
  const steps =
    d === 0
      ? [`${base}³ = ${base} × ${base} × ${base} = ${base ** 3}`]
      : [
          `${base}³ = (${lo} × ${base} × ${hi}) + (${d}² × ${base})`,
          `${lo} × ${base} × ${hi} = ${lo * base * hi}`,
          `${d}² × ${base} = ${d * d * base}`,
          `${lo * base * hi} + ${d * d * base} = ${base ** 3}`,
        ]
  return {
    n,
    prompt: { kind: 'power', base, exp: 3 },
    answer: { kind: 'integer', value: base ** 3 },
    steps,
  }
}
export function div(n: number, a: number, b: number): BookProblem {
  const q = Math.floor(a / b)
  const r = a % b
  const steps = [
    `${b} × ${q} = ${b * q}`,
    r ? `${a} ${MINUS} ${b * q} = ${r}` : `${a} ${MINUS} ${b * q} = 0`,
    r ? `${q} remainder ${r} (${q} ${r}/${b})` : `${q} exactly`,
  ]
  return {
    n,
    prompt: { kind: 'binary', a, b, op: '÷' },
    answer: { kind: 'quotient-remainder', q, r, divisor: b },
    steps,
  }
}
export function decimalize(n: number, num: number, den: number): BookProblem {
  const exact = num / den
  const value = Math.round(exact * 1000) / 1000
  const r = reduce({ num, den })
  const steps = [
    r.den !== den ? `${num}/${den} = ${ft(r)}` : `${num}/${den}`,
    `${r.num} ÷ ${r.den} = ${exact.toFixed(4).replace(/0+$/, '')}…`.replace(
      '…',
      (exact * 1e6) % 1 ? '…' : '',
    ),
    `≈ ${value}`,
  ]
  return {
    n,
    prompt: { kind: 'fraction-task', value: { num, den }, task: 'to-decimal' },
    answer: { kind: 'decimal', value, tolerance: 0.001 },
    steps,
  }
}
/**
 * The book's test for 7 and 17: add or subtract a multiple of the divisor to reach a number
 * ending in 0, drop the 0, repeat until the number is small enough to judge.
 */
function dropRoute(value: number, by: number): string {
  const parts: string[] = []
  let v = value
  for (let guard = 0; v >= 100 && guard < 8; guard++) {
    const r = v % 10
    if (r === 0) {
      v /= 10
      parts.push(`drop the 0 → ${v}`)
      continue
    }
    const k = (r * 3) % 10 // 7 × 3 ≡ 1 (mod 10), and 17 ≡ 7
    const m = k * by
    if (m <= v) {
      parts.push(`${v} ${MINUS} ${m} = ${v - m} → ${(v - m) / 10}`)
      v = (v - m) / 10
    } else {
      const m2 = ((10 - k) % 10) * by
      parts.push(`${v} + ${m2} = ${v + m2} → ${(v + m2) / 10}`)
      v = (v + m2) / 10
    }
  }
  parts.push(`${v} ${v % by === 0 ? 'is' : 'is not'} a multiple of ${by}`)
  return parts.join('; ')
}
export function divisible(n: number, value: number, by: number): BookProblem {
  const yes = value % by === 0
  const ds = String(value).split('').map(Number)
  const sum = ds.reduce((s, d) => s + d, 0)
  const rule: Record<number, string> = {
    2: `Last digit ${value % 10}`,
    3: `Digit sum ${sum}`,
    4: `Last two digits ${String(value).slice(-2)}`,
    5: `Last digit ${value % 10}`,
    6: `Even? ${value % 2 === 0 ? 'yes' : 'no'}; digit sum ${sum}`,
    7: dropRoute(value, 7),
    8: `Last three digits ${String(value).slice(-3)}`,
    9: `Digit sum ${sum}`,
    11: `Alternating sum ${ds.reduce((s, d, i) => s + (i % 2 ? -d : d), 0)}`,
    17: dropRoute(value, 17),
  }
  return {
    n,
    prompt: { kind: 'divisible', n: value, by },
    answer: { kind: 'choice', options: ['Yes', 'No'], correct: yes ? 'Yes' : 'No' },
    steps: [rule[by] ?? `Divide`, yes ? 'Yes' : 'No'],
  }
}
function fracProblem(n: number, a: Pair, b: Pair, op: '+' | '-' | '×' | '÷'): BookProblem {
  const A = fr(a)
  const B = fr(b)
  let raw: Frac
  const steps: string[] = []
  if (op === '×') {
    raw = { num: A.num * B.num, den: A.den * B.den }
    steps.push(`${A.num} × ${B.num} = ${raw.num}`, `${A.den} × ${B.den} = ${raw.den}`)
  } else if (op === '÷') {
    raw = { num: A.num * B.den, den: A.den * B.num }
    steps.push(`${ft(A)} ÷ ${ft(B)} = ${ft(A)} × ${B.den}/${B.num}`, `= ${ft(raw)}`)
  } else if (A.den === B.den) {
    raw = { num: op === '+' ? A.num + B.num : A.num - B.num, den: A.den }
    steps.push(`${A.num} ${op === '+' ? '+' : MINUS} ${B.num} = ${raw.num}`, `= ${ft(raw)}`)
  } else if (B.den % A.den === 0 || A.den % B.den === 0) {
    const den = Math.max(A.den, B.den)
    const an = A.num * (den / A.den)
    const bn = B.num * (den / B.den)
    raw = { num: op === '+' ? an + bn : an - bn, den }
    const conv = A.den < B.den ? `${ft(A)} = ${an}/${den}` : `${ft(B)} = ${bn}/${den}`
    steps.push(conv, `${an} ${op === '+' ? '+' : MINUS} ${bn} = ${raw.num}`, `= ${ft(raw)}`)
  } else {
    raw = {
      num: op === '+' ? A.num * B.den + B.num * A.den : A.num * B.den - B.num * A.den,
      den: A.den * B.den,
    }
    steps.push(
      `${A.num} × ${B.den} ${op === '+' ? '+' : MINUS} ${B.num} × ${A.den} = ${raw.num}`,
      `${A.den} × ${B.den} = ${raw.den}`,
      `= ${ft(raw)}`,
    )
  }
  const ans = reduce(raw)
  if (ans.num !== raw.num || ans.den !== raw.den) steps.push(`${ft(raw)} reduces to ${ft(ans)}`)
  else steps[steps.length - 1] = `Answer: ${ft(ans)}`
  return {
    n,
    prompt: { kind: 'fraction-binary', a: A, b: B, op },
    answer: { kind: 'fraction', value: ans, acceptDecimal: false },
    steps,
  }
}
export const mulF = (n: number, a: Pair, b: Pair) => fracProblem(n, a, b, '×')
export const divF = (n: number, a: Pair, b: Pair) => fracProblem(n, a, b, '÷')
export const addF = (n: number, a: Pair, b: Pair) => fracProblem(n, a, b, '+')
export const subF = (n: number, a: Pair, b: Pair) => fracProblem(n, a, b, '-')
export function simplify(n: number, num: number, den: number): BookProblem {
  const r = reduce({ num, den })
  const k = num / r.num
  return {
    n,
    prompt: { kind: 'fraction-task', value: { num, den }, task: 'simplify' },
    answer: { kind: 'fraction', value: r, acceptDecimal: false },
    steps: [`Both divide by ${k}`, `${num}/${den} = ${ft(r)}`],
  }
}
/** "Express a/b in twelfths" style: rewrite with the given denominator, answer must match exactly. */
export function rewrite(n: number, num: number, den: number, newDen: number): BookProblem {
  const k = newDen / den
  const value = { num: num * k, den: newDen }
  return {
    n,
    prompt: { kind: 'fraction-task', value: { num, den }, task: 'rewrite', den: newDen },
    answer: { kind: 'fraction', value, acceptDecimal: false, exact: true },
    steps: [`Multiply top and bottom by ${k}`, `${num}/${den} = ${ft(value)}`],
  }
}

// Chapter 5: estimates carry the exact value; the checker accepts within the tolerance.
// Pass `tol` where the book's own printed guesstimate sits outside the default band.
export function estAdd(n: number, a: number, b: number, steps: string[], tol = 0.02): BookProblem {
  return {
    n,
    prompt: { kind: 'binary', a, b, op: '+' },
    answer: { kind: 'estimate', value: a + b, relTolerance: tol },
    steps,
  }
}
export function estSub(n: number, a: number, b: number, steps: string[], tol = 0.03): BookProblem {
  return {
    n,
    prompt: { kind: 'binary', a, b, op: '-' },
    answer: { kind: 'estimate', value: a - b, relTolerance: tol },
    steps,
  }
}
export function estMul(n: number, a: number, b: number, steps: string[], tol = 0.05): BookProblem {
  return {
    n,
    prompt: { kind: 'binary', a, b, op: '×' },
    answer: { kind: 'estimate', value: a * b, relTolerance: tol },
    steps,
  }
}
export function estDiv(
  n: number,
  a: number,
  b: number,
  exact: number,
  steps: string[],
  tol = 0.05,
): BookProblem {
  return {
    n,
    prompt: { kind: 'binary', a, b, op: '÷' },
    answer: { kind: 'estimate', value: exact, relTolerance: tol },
    steps,
  }
}
export function estSqrt(
  n: number,
  radicand: number,
  exact: number,
  steps: string[],
  tol = 0.02,
): BookProblem {
  return {
    n,
    prompt: { kind: 'root', radicand, degree: 2 },
    answer: { kind: 'estimate', value: exact, relTolerance: tol },
    steps,
  }
}
/** A column of dollar amounts to estimate; shown in dollars, checked within 2%. */
export function estCol(n: number, amounts: number[], exact: number, steps: string[]): BookProblem {
  return {
    n,
    prompt: { kind: 'columns', numbers: amounts, unit: '$' },
    answer: { kind: 'estimate', value: exact, relTolerance: 0.02 },
    steps,
  }
}
export function money(
  n: number,
  text: string,
  value: number,
  steps: string[],
  tolerance = 0.01,
): BookProblem {
  return { n, prompt: { kind: 'text', text }, answer: { kind: 'decimal', value, tolerance }, steps }
}
export function textInt(n: number, text: string, value: number, steps: string[]): BookProblem {
  return { n, prompt: { kind: 'text', text }, answer: { kind: 'integer', value }, steps }
}

// Chapter 6
export function columns(n: number, numbers: number[], steps: string[]): BookProblem {
  const total = numbers.reduce((s, x) => s + x, 0)
  return {
    n,
    prompt: { kind: 'columns', numbers },
    answer: { kind: 'integer', value: total },
    steps: [...steps, `Total ${total}`],
  }
}
export function colCents(
  n: number,
  amounts: number[],
  exact: number,
  steps: string[],
): BookProblem {
  return {
    n,
    prompt: { kind: 'columns', numbers: amounts, unit: '$' },
    answer: { kind: 'decimal', value: exact, tolerance: 0.005 },
    steps: [...steps, `Total $${exact.toFixed(2)}`],
  }
}
export function paperSub(n: number, a: number, b: number, steps: string[]): BookProblem {
  return {
    n,
    prompt: { kind: 'binary', a, b, op: '-' },
    answer: { kind: 'integer', value: a - b },
    steps: [...steps, `${a} ${MINUS} ${b} = ${a - b}`],
  }
}
export function sqrtExact(
  n: number,
  radicand: number,
  value: number,
  steps: string[],
): BookProblem {
  const isInt = Number.isInteger(value)
  return {
    n,
    prompt: { kind: 'root', radicand, degree: 2 },
    answer: isInt ? { kind: 'integer', value } : { kind: 'decimal', value, tolerance: 0.01 },
    steps,
  }
}
export function crissCross(n: number, a: number, b: number, steps: string[]): BookProblem {
  return {
    n,
    prompt: { kind: 'binary', a, b, op: '×' },
    answer: { kind: 'integer', value: a * b },
    steps: [...steps, `${a} × ${b} = ${a * b}`],
  }
}

// Chapters 8 and 9

/** Large squares: four digits round to the nearest thousand; five digits split into thousands + rest. */
export function sqBig(n: number, base: number): BookProblem {
  return {
    n,
    prompt: { kind: 'power', base, exp: 2 },
    answer: { kind: 'integer', value: base * base },
    steps: stepsSquareNear(base, 1000),
  }
}

/** Big products by the routes chapter 8 works them (see stepsBigProduct). */
export function big(n: number, a: number, b: number): BookProblem {
  return {
    n,
    prompt: { kind: 'binary', a, b, op: '×' },
    answer: { kind: 'integer', value: a * b },
    steps: stepsBigProduct(a, b),
  }
}

export function dateProblem(n: number, iso: string): BookProblem {
  return {
    n,
    prompt: { kind: 'date', iso },
    answer: { kind: 'choice', options: [...WEEKDAY_OPTIONS], correct: dayOfWeek(iso) },
    steps: daySteps(iso),
  }
}

/** The book's trick question: a date that does not exist. */
export function noSuchDate(n: number, text: string, reason = 'June has only 30 days'): BookProblem {
  return {
    n,
    prompt: { kind: 'text', text: `What day of the week was ${text}?`, emphasis: text },
    answer: {
      kind: 'text',
      accept: [
        'No such date',
        'no such day',
        'none',
        'invalid',
        'trick question',
        "doesn't exist",
        'does not exist',
        'impossible',
        'not a real date',
      ],
      normalize: 'lower',
    },
    steps: [reason, 'No such date'],
  }
}
