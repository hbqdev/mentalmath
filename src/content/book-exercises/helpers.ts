import type { BookProblem } from '@/exercises/bookSets'
import { reduce } from '@/exercises/checker'
import { MINUS, stepsMultiplyByDigit, stepsSquareNear, stepsTimes11 } from '@/exercises/generators/shared'
import type { Frac } from '@/exercises/types'

// Constructors compute answers from the operands (a transcription slip in an answer is
// impossible) and default the steps to the book's method builders; pass steps to override
// with the book's exact working.

type Pair = [number, number]
const fr = ([num, den]: Pair): Frac => ({ num, den })
const ft = (f: Frac) => `${f.num}/${f.den}`

export function add(n: number, a: number, b: number, steps: string[]): BookProblem {
  return { n, prompt: { kind: 'binary', a, b, op: '+' }, answer: { kind: 'integer', value: a + b }, steps }
}
export function sub(n: number, a: number, b: number, steps: string[]): BookProblem {
  return { n, prompt: { kind: 'binary', a, b, op: '-' }, answer: { kind: 'integer', value: a - b }, steps }
}
/** a × b with b a single digit: partial products left to right. */
export function mul(n: number, a: number, b: number, steps?: string[]): BookProblem {
  return { n, prompt: { kind: 'binary', a, b, op: '×' }, answer: { kind: 'integer', value: a * b }, steps: steps ?? stepsMultiplyByDigit(a, b) }
}
export function times11(n: number, a: number): BookProblem {
  return { n, prompt: { kind: 'binary', a, b: 11, op: '×' }, answer: { kind: 'integer', value: a * 11 }, steps: stepsTimes11(a) }
}
/** Addition method: split the factor whose ones digit is smallest. */
export function mulAdd(n: number, a: number, b: number): BookProblem {
  const [x, y] = a % 10 <= b % 10 ? [b, a] : [a, b] // y is split
  const tens = Math.floor(y / 10) * 10
  const ones = y % 10
  const steps = ones === 0
    ? [`${x} × ${y} = ${x * y}`]
    : [`${y} = ${tens} + ${ones}`, `${x} × ${tens} = ${x * tens}`, `${x} × ${ones} = ${x * ones}`, `${x * tens} + ${x * ones} = ${a * b}`]
  return { n, prompt: { kind: 'binary', a, b, op: '×' }, answer: { kind: 'integer', value: a * b }, steps }
}
/** Subtraction method: round the factor nearest below a multiple of 10 up, then subtract the excess. */
export function mulSub(n: number, a: number, b: number): BookProblem {
  const gap = (v: number) => (10 - (v % 10)) % 10
  const [x, y] = gap(a) !== 0 && (gap(b) === 0 || gap(a) <= gap(b)) ? [b, a] : [a, b] // y is rounded
  const r = Math.ceil(y / 10) * 10
  const k = r - y
  const steps = k === 0
    ? [`${x} × ${y} = ${x * y}`]
    : [`${y} = ${r} ${MINUS} ${k}`, `${x} × ${r} = ${x * r}`, `${x} × ${k} = ${x * k}`, `${x * r} ${MINUS} ${x * k} = ${a * b}`]
  return { n, prompt: { kind: 'binary', a, b, op: '×' }, answer: { kind: 'integer', value: a * b }, steps }
}
/** Factoring method: b = f1 × f2 (as the book factors it). */
export function mulFactor(n: number, a: number, b: number, [f1, f2]: Pair): BookProblem {
  // factor whichever operand the book factors
  const [x, y] = f1 * f2 === b ? [a, b] : [b, a]
  if (f1 * f2 !== y) throw new Error(`bad factors for ${a} × ${b}`)
  const steps = [`${y} = ${f1} × ${f2}`, `${x} × ${f1} = ${x * f1}`, `${x * f1} × ${f2} = ${a * b}`]
  return { n, prompt: { kind: 'binary', a, b, op: '×' }, answer: { kind: 'integer', value: a * b }, steps }
}
export function sq(n: number, base: number, steps?: string[]): BookProblem {
  return { n, prompt: { kind: 'power', base, exp: 2 }, answer: { kind: 'integer', value: base * base }, steps: steps ?? stepsSquareNear(base) }
}
export function cube(n: number, base: number): BookProblem {
  const near = Math.round(base / 10) * 10
  const d = Math.abs(base - near)
  const lo = base - d
  const hi = base + d
  const steps = d === 0
    ? [`${base}³ = ${base} × ${base} × ${base} = ${base ** 3}`]
    : [`${base}³ = (${lo} × ${base} × ${hi}) + (${d}² × ${base})`, `${lo} × ${base} × ${hi} = ${lo * base * hi}`, `${d}² × ${base} = ${d * d * base}`, `${lo * base * hi} + ${d * d * base} = ${base ** 3}`]
  return { n, prompt: { kind: 'power', base, exp: 3 }, answer: { kind: 'integer', value: base ** 3 }, steps }
}
export function div(n: number, a: number, b: number): BookProblem {
  const q = Math.floor(a / b)
  const r = a % b
  const steps = [`${b} × ${q} = ${b * q}`, r ? `${a} ${MINUS} ${b * q} = ${r}` : `${a} ${MINUS} ${b * q} = 0`, r ? `${q} remainder ${r} (${q} ${r}/${b})` : `${q} exactly`]
  return { n, prompt: { kind: 'binary', a, b, op: '÷' }, answer: { kind: 'quotient-remainder', q, r, divisor: b }, steps }
}
export function decimalize(n: number, num: number, den: number): BookProblem {
  const exact = num / den
  const value = Math.round(exact * 1000) / 1000
  const r = reduce({ num, den })
  const steps = [
    r.den !== den ? `${num}/${den} = ${ft(r)}` : `${num}/${den}`,
    `${r.num} ÷ ${r.den} = ${exact.toFixed(4).replace(/0+$/, '')}…`.replace('…', exact * 1e6 % 1 ? '…' : ''),
    `≈ ${value}`,
  ]
  return { n, prompt: { kind: 'fraction-task', value: { num, den }, task: 'to-decimal' }, answer: { kind: 'decimal', value, tolerance: 0.001 }, steps }
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
    7: `Double the last digit and subtract: ${Math.floor(value / 10)} ${MINUS} ${2 * (value % 10)} = ${Math.floor(value / 10) - 2 * (value % 10)}`,
    8: `Last three digits ${String(value).slice(-3)}`,
    9: `Digit sum ${sum}`,
    11: `Alternating sum ${ds.reduce((s, d, i) => s + (i % 2 ? -d : d), 0)}`,
    17: `Subtract 5 × last digit: ${Math.floor(value / 10)} ${MINUS} ${5 * (value % 10)} = ${Math.floor(value / 10) - 5 * (value % 10)}`,
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
  } else {
    raw = { num: op === '+' ? A.num * B.den + B.num * A.den : A.num * B.den - B.num * A.den, den: A.den * B.den }
    steps.push(`${A.num} × ${B.den} ${op === '+' ? '+' : MINUS} ${B.num} × ${A.den} = ${raw.num}`, `${A.den} × ${B.den} = ${raw.den}`, `= ${ft(raw)}`)
  }
  const ans = reduce(raw)
  if (ans.num !== raw.num || ans.den !== raw.den) steps.push(`${ft(raw)} reduces to ${ft(ans)}`)
  else steps[steps.length - 1] = `Answer: ${ft(ans)}`
  return { n, prompt: { kind: 'fraction-binary', a: A, b: B, op }, answer: { kind: 'fraction', value: ans, acceptDecimal: false }, steps }
}
export const mulF = (n: number, a: Pair, b: Pair) => fracProblem(n, a, b, '×')
export const divF = (n: number, a: Pair, b: Pair) => fracProblem(n, a, b, '÷')
export const addF = (n: number, a: Pair, b: Pair) => fracProblem(n, a, b, '+')
export const subF = (n: number, a: Pair, b: Pair) => fracProblem(n, a, b, '-')
export function simplify(n: number, num: number, den: number): BookProblem {
  const r = reduce({ num, den })
  const k = num / r.num
  return { n, prompt: { kind: 'fraction-task', value: { num, den }, task: 'simplify' }, answer: { kind: 'fraction', value: r, acceptDecimal: false }, steps: [`Both divide by ${k}`, `${num}/${den} = ${ft(r)}`] }
}
/** "Express a/b in twelfths" style: rewrite with the given denominator, answer must match exactly. */
export function rewrite(n: number, num: number, den: number, newDen: number): BookProblem {
  const k = newDen / den
  const value = { num: num * k, den: newDen }
  return { n, prompt: { kind: 'fraction-task', value: { num, den }, task: 'rewrite', den: newDen }, answer: { kind: 'fraction', value, acceptDecimal: false, exact: true }, steps: [`Multiply top and bottom by ${k}`, `${num}/${den} = ${ft(value)}`] }
}

// Chapter 5: estimates carry the exact value; the checker accepts within the tolerance.
export function estAdd(n: number, a: number, b: number, steps: string[]): BookProblem {
  return { n, prompt: { kind: 'binary', a, b, op: '+' }, answer: { kind: 'estimate', value: a + b, relTolerance: 0.02 }, steps }
}
export function estSub(n: number, a: number, b: number, steps: string[]): BookProblem {
  return { n, prompt: { kind: 'binary', a, b, op: '-' }, answer: { kind: 'estimate', value: a - b, relTolerance: 0.03 }, steps }
}
export function estMul(n: number, a: number, b: number, steps: string[]): BookProblem {
  return { n, prompt: { kind: 'binary', a, b, op: '×' }, answer: { kind: 'estimate', value: a * b, relTolerance: 0.05 }, steps }
}
export function estDiv(n: number, a: number, b: number, exact: number, steps: string[]): BookProblem {
  return { n, prompt: { kind: 'binary', a, b, op: '÷' }, answer: { kind: 'estimate', value: exact, relTolerance: 0.05 }, steps }
}
export function estSqrt(n: number, radicand: number, exact: number, steps: string[]): BookProblem {
  return { n, prompt: { kind: 'root', radicand, degree: 2 }, answer: { kind: 'estimate', value: exact, relTolerance: 0.02 }, steps }
}
/** A column of dollar amounts to estimate; shown in dollars, checked within 2%. */
export function estCol(n: number, amounts: number[], exact: number, steps: string[]): BookProblem {
  return { n, prompt: { kind: 'columns', numbers: amounts, unit: '$' }, answer: { kind: 'estimate', value: exact, relTolerance: 0.02 }, steps }
}
export function money(n: number, text: string, value: number, steps: string[], tolerance = 0.01): BookProblem {
  return { n, prompt: { kind: 'text', text }, answer: { kind: 'decimal', value, tolerance }, steps }
}
export function textInt(n: number, text: string, value: number, steps: string[]): BookProblem {
  return { n, prompt: { kind: 'text', text }, answer: { kind: 'integer', value }, steps }
}

// Chapter 6
export function columns(n: number, numbers: number[], steps: string[]): BookProblem {
  const total = numbers.reduce((s, x) => s + x, 0)
  return { n, prompt: { kind: 'columns', numbers }, answer: { kind: 'integer', value: total }, steps: [...steps, `Total ${total}`] }
}
export function colCents(n: number, amounts: number[], exact: number, steps: string[]): BookProblem {
  return { n, prompt: { kind: 'columns', numbers: amounts, unit: '$' }, answer: { kind: 'decimal', value: exact, tolerance: 0.005 }, steps: [...steps, `Total $${exact.toFixed(2)}`] }
}
export function paperSub(n: number, a: number, b: number, steps: string[]): BookProblem {
  return { n, prompt: { kind: 'binary', a, b, op: '-' }, answer: { kind: 'integer', value: a - b }, steps: [...steps, `${a} ${MINUS} ${b} = ${a - b}`] }
}
export function sqrtExact(n: number, radicand: number, value: number, steps: string[]): BookProblem {
  const isInt = Number.isInteger(value)
  return { n, prompt: { kind: 'root', radicand, degree: 2 }, answer: isInt ? { kind: 'integer', value } : { kind: 'decimal', value, tolerance: 0.01 }, steps }
}
export function crissCross(n: number, a: number, b: number, steps: string[]): BookProblem {
  return { n, prompt: { kind: 'binary', a, b, op: '×' }, answer: { kind: 'integer', value: a * b }, steps: [...steps, `${a} × ${b} = ${a * b}`] }
}

