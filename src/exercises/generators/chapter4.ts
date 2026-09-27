import { reduce } from '../checker'
import type { Frac, GeneratedSetDef, Rng } from '../types'
import { MINUS, placeParts } from './shared'

const div = (a: number, b: number) => ({ kind: 'binary' as const, a, b, op: '÷' as const })
const qr = (a: number, b: number) => ({ kind: 'quotient-remainder' as const, q: Math.floor(a / b), r: a % b, divisor: b })
const frac = (value: Frac) => ({ kind: 'fraction' as const, value, acceptDecimal: false })
const ft = (f: Frac) => `${f.num}/${f.den}`

/** Long division left to right by place value, as the book does it: 9 into 2782 → 300, 9 more... */
function divisionSteps(a: number, b: number): string[] {
  const steps: string[] = []
  let rem = a
  const q = Math.floor(a / b)
  for (const part of placeParts(q)) {
    steps.push(`${b} × ${part} = ${b * part}, ${rem} ${MINUS} ${b * part} = ${rem - b * part}`)
    rem -= b * part
  }
  steps.push(rem === 0 ? `Answer: ${q}` : `Answer: ${q} remainder ${rem}`)
  return steps
}

function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b]
  return a
}

function twoDigitDivisionSteps(a: number, b: number): string[] {
  const g = gcd(a, b)
  const q = Math.floor(a / b)
  const r = a % b
  const steps: string[] = []
  if (g > 1 && g <= 9 && r === 0) steps.push(`Both divide by ${g}: ${a} ÷ ${b} = ${a / g} ÷ ${b / g}`)
  steps.push(`${b} × ${q} = ${b * q}`)
  if (r !== 0) steps.push(`${a} ${MINUS} ${b * q} = ${r}`)
  steps.push(r === 0 ? `Answer: ${q}` : `Answer: ${q} remainder ${r}`)
  return steps
}

const DECIMAL_KNOWLEDGE: Record<number, string> = {
  2: 'halves: .50',
  3: 'thirds: .333…, .666…',
  4: 'quarters: .25, .50, .75',
  5: 'fifths: multiples of .20',
  6: 'sixths: .1666…, .8333… (others reduce)',
  7: 'sevenths cycle 142857',
  8: 'eighths: multiples of .125',
  9: 'ninths: repeat the numerator',
  10: 'tenths: move the point',
  11: 'elevenths: multiples of .0909…',
  12: 'twelfths: .0833… steps',
}

function divisibilityRule(by: number, n: number): string {
  const ds = String(n).split('').map(Number)
  const sum = ds.reduce((s, d) => s + d, 0)
  switch (by) {
    case 2: return `Last digit ${n % 10} is ${n % 2 === 0 ? 'even' : 'odd'}`
    case 3: return `Digit sum ${sum} ${sum % 3 === 0 ? 'is' : 'is not'} a multiple of 3`
    case 4: return `Last two digits ${String(n).slice(-2)} ${n % 4 === 0 ? 'are' : 'are not'} divisible by 4`
    case 5: return `Last digit ${n % 10} ${n % 5 === 0 ? 'is' : 'is not'} 0 or 5`
    case 6: return `Even: ${n % 2 === 0 ? 'yes' : 'no'}; digit sum ${sum} divisible by 3: ${sum % 3 === 0 ? 'yes' : 'no'}`
    case 7: {
      const t = Math.floor(n / 10) - 2 * (n % 10)
      return `Double the last digit and subtract: ${Math.floor(n / 10)} ${MINUS} ${2 * (n % 10)} = ${t}, ${t % 7 === 0 ? 'a' : 'not a'} multiple of 7`
    }
    case 8: return `Last three digits ${String(n).slice(-3)} ${n % 8 === 0 ? 'are' : 'are not'} divisible by 8`
    case 9: return `Digit sum ${sum} ${sum % 9 === 0 ? 'is' : 'is not'} a multiple of 9`
    default: {
      const alt = ds.reduce((s, d, i) => s + (i % 2 === 0 ? d : -d), 0)
      return `Alternating digit sum ${alt} ${alt % 11 === 0 ? 'is' : 'is not'} a multiple of 11`
    }
  }
}

function pickFrac(rng: Rng, maxDen: number, proper = true): Frac {
  const den = rng.int(2, maxDen)
  const num = proper ? rng.int(1, den - 1) : rng.int(1, maxDen)
  return { num, den }
}

export const sets: GeneratedSetDef[] = [
  {
    id: 'gen4-one-digit-division',
    chapterId: '4',
    sectionId: 'one-digit-division',
    title: 'One-digit division',
    description: 'Divide left to right, one place value at a time.',
    coversBookSets: ['ch4-one-digit-division'],
    generate(difficulty, rng) {
      const b = difficulty === 'easy' ? rng.int(2, 5) : rng.int(3, 9)
      const a = difficulty === 'easy' ? rng.int(100, 500) : difficulty === 'medium' ? rng.int(200, 1000) : rng.int(500, 3000)
      return { difficulty, prompt: div(a, b), answer: qr(a, b), solution: { steps: divisionSteps(a, b) } }
    },
  },
  {
    id: 'gen4-two-digit-division',
    chapterId: '4',
    sectionId: 'two-digit-division',
    title: 'Two-digit division',
    description: 'Simplify by a common factor when you can, then estimate the quotient.',
    coversBookSets: ['ch4-two-digit-division'],
    generate(difficulty, rng) {
      const b = difficulty === 'easy' ? rng.int(11, 29) : rng.int(11, 99)
      const a = difficulty === 'easy' ? rng.int(100, 999) : difficulty === 'medium' ? rng.int(300, 3000) : rng.int(1000, 9999)
      return { difficulty, prompt: div(a, b), answer: qr(a, b), solution: { steps: twoDigitDivisionSteps(a, b) } }
    },
  },
  {
    id: 'gen4-decimalization',
    chapterId: '4',
    sectionId: 'matching-wits-with-a-calculator-learning-decimalization',
    title: 'Decimalization',
    description: 'Turn a fraction into its decimal by knowing the families: halves, thirds, sevenths…',
    coversBookSets: ['ch4-decimalization'],
    generate(difficulty, rng) {
      const dens = difficulty === 'easy' ? [2, 3, 4, 5, 10] : difficulty === 'medium' ? [3, 6, 8, 9, 11] : [7, 9, 11, 12]
      const den = rng.pick(dens)
      const num = rng.int(1, den - 1)
      const value = num / den
      const rounded = Math.round(value * 1000) / 1000
      return {
        difficulty,
        prompt: { kind: 'fraction-task', value: { num, den }, task: 'to-decimal' },
        answer: { kind: 'decimal', value: rounded, tolerance: 0.001 },
        solution: { steps: [`${num}/${den}: ${DECIMAL_KNOWLEDGE[den] ?? 'divide'}`, `${num} ÷ ${den} = ${rounded}`] },
      }
    },
  },
  {
    id: 'gen4-divisibility',
    chapterId: '4',
    sectionId: 'matching-wits-with-a-calculator-learning-decimalization',
    title: 'Testing for divisibility',
    description: 'Apply the digit rules for 2 through 11.',
    coversBookSets: ['ch4-testing-for-divisibility'],
    generate(difficulty, rng) {
      const by = rng.pick(difficulty === 'easy' ? [2, 3, 4, 5, 9] : difficulty === 'medium' ? [3, 4, 6, 8, 9] : [7, 8, 11])
      const n = difficulty === 'easy' ? rng.int(100, 9999) : difficulty === 'medium' ? rng.int(1000, 99999) : rng.int(1000, 999999)
      const yes = n % by === 0
      return {
        difficulty,
        prompt: { kind: 'divisible', n, by },
        answer: { kind: 'choice', options: ['Yes', 'No'], correct: yes ? 'Yes' : 'No' },
        solution: { steps: [divisibilityRule(by, n), `So: ${yes ? 'Yes' : 'No'}`] },
      }
    },
  },
  {
    id: 'gen4-multiplying-fractions',
    chapterId: '4',
    sectionId: 'matching-wits-with-a-calculator-learning-decimalization',
    title: 'Multiplying fractions',
    description: 'Multiply tops, multiply bottoms, then reduce.',
    coversBookSets: ['ch4-multiplying-fractions'],
    generate(difficulty, rng) {
      const a = pickFrac(rng, difficulty === 'easy' ? 6 : 12)
      const b = pickFrac(rng, difficulty === 'hard' ? 12 : 9)
      const raw = { num: a.num * b.num, den: a.den * b.den }
      const ans = reduce(raw)
      const steps = [`${a.num} × ${b.num} = ${raw.num}`, `${a.den} × ${b.den} = ${raw.den}`]
      steps.push(ans.den === raw.den ? `Answer: ${ft(ans)}` : `${ft(raw)} reduces to ${ft(ans)}`)
      return { difficulty, prompt: { kind: 'fraction-binary', a, b, op: '×' }, answer: frac(ans), solution: { steps } }
    },
  },
  {
    id: 'gen4-dividing-fractions',
    chapterId: '4',
    sectionId: 'matching-wits-with-a-calculator-learning-decimalization',
    title: 'Dividing fractions',
    description: 'Invert the second fraction and multiply.',
    coversBookSets: ['ch4-dividing-fractions'],
    generate(difficulty, rng) {
      const a = pickFrac(rng, difficulty === 'easy' ? 6 : 12)
      const b = pickFrac(rng, difficulty === 'hard' ? 12 : 9)
      const raw = { num: a.num * b.den, den: a.den * b.num }
      const ans = reduce(raw)
      const steps = [`${ft(a)} ÷ ${ft(b)} = ${ft(a)} × ${b.den}/${b.num}`, `= ${ft(raw)}`]
      steps.push(ans.den === raw.den && ans.num === raw.num ? `Answer: ${ft(ans)}` : `${ft(raw)} reduces to ${ft(ans)}`)
      return { difficulty, prompt: { kind: 'fraction-binary', a, b, op: '÷' }, answer: frac(ans), solution: { steps } }
    },
  },
  {
    id: 'gen4-simplifying-fractions',
    chapterId: '4',
    sectionId: 'matching-wits-with-a-calculator-learning-decimalization',
    title: 'Simplifying fractions',
    description: 'Divide top and bottom by their common factor.',
    coversBookSets: ['ch4-simplifying-fractions'],
    generate(difficulty, rng) {
      const base = pickFrac(rng, difficulty === 'easy' ? 5 : 9)
      const r = reduce(base)
      const k = difficulty === 'easy' ? rng.int(2, 4) : difficulty === 'medium' ? rng.int(2, 7) : rng.int(3, 12)
      const value = { num: r.num * k, den: r.den * k }
      return {
        difficulty,
        prompt: { kind: 'fraction-task', value, task: 'simplify' },
        answer: frac(r),
        solution: { steps: [`Both ${value.num} and ${value.den} divide by ${k}`, `${ft(value)} = ${ft(r)}`] },
      }
    },
  },
  {
    id: 'gen4-adding-fractions',
    chapterId: '4',
    sectionId: 'matching-wits-with-a-calculator-learning-decimalization',
    title: 'Adding fractions',
    description: 'Same denominators add straight across; otherwise cross-multiply.',
    coversBookSets: ['ch4-adding-fractions-equal-denominators', 'ch4-adding-fractions-unequal-denominators'],
    generate(difficulty, rng) {
      const a = pickFrac(rng, difficulty === 'hard' ? 12 : 9)
      const b = difficulty === 'easy' ? { num: rng.int(1, a.den - 1), den: a.den } : pickFrac(rng, difficulty === 'hard' ? 12 : 9)
      const raw = a.den === b.den ? { num: a.num + b.num, den: a.den } : { num: a.num * b.den + b.num * a.den, den: a.den * b.den }
      const ans = reduce(raw)
      const steps =
        a.den === b.den
          ? [`${a.num} + ${b.num} = ${raw.num}`, `= ${ft(raw)}`]
          : [`${a.num} × ${b.den} + ${b.num} × ${a.den} = ${raw.num}`, `${a.den} × ${b.den} = ${raw.den}`, `= ${ft(raw)}`]
      if (ans.den !== raw.den || ans.num !== raw.num) steps.push(`${ft(raw)} reduces to ${ft(ans)}`)
      else steps[steps.length - 1] = `Answer: ${ft(ans)}`
      return { difficulty, prompt: { kind: 'fraction-binary', a, b, op: '+' }, answer: frac(ans), solution: { steps } }
    },
  },
  {
    id: 'gen4-subtracting-fractions',
    chapterId: '4',
    sectionId: 'matching-wits-with-a-calculator-learning-decimalization',
    title: 'Subtracting fractions',
    description: 'Cross-multiply, subtract the tops, reduce.',
    coversBookSets: ['ch4-subtracting-fractions'],
    generate(difficulty, rng) {
      let a = pickFrac(rng, difficulty === 'hard' ? 12 : 9)
      let b = difficulty === 'easy' ? { num: rng.int(1, a.den - 1), den: a.den } : pickFrac(rng, difficulty === 'hard' ? 12 : 9)
      if (a.num * b.den <= b.num * a.den) [a, b] = [b, a]
      if (a.num * b.den === b.num * a.den) a = { num: a.num + 1, den: a.den }
      const raw = a.den === b.den ? { num: a.num - b.num, den: a.den } : { num: a.num * b.den - b.num * a.den, den: a.den * b.den }
      const ans = reduce(raw)
      const steps =
        a.den === b.den
          ? [`${a.num} ${MINUS} ${b.num} = ${raw.num}`, `= ${ft(raw)}`]
          : [`${a.num} × ${b.den} ${MINUS} ${b.num} × ${a.den} = ${raw.num}`, `${a.den} × ${b.den} = ${raw.den}`, `= ${ft(raw)}`]
      if (ans.den !== raw.den || ans.num !== raw.num) steps.push(`${ft(raw)} reduces to ${ft(ans)}`)
      else steps[steps.length - 1] = `Answer: ${ft(ans)}`
      return { difficulty, prompt: { kind: 'fraction-binary', a, b, op: '-' }, answer: frac(ans), solution: { steps } }
    },
  },
]
