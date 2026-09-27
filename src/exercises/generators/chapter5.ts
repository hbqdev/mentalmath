import type { GeneratedSetDef, Rng } from '../types'
import { MINUS } from './shared'

const estimate = (value: number, relTolerance: number) => ({ kind: 'estimate' as const, value, relTolerance })

/** Round to two significant digits, the book's guesstimation habit. */
function round2(n: number): number {
  if (n === 0) return 0
  const mag = 10 ** (Math.floor(Math.log10(Math.abs(n))) - 1)
  return Math.round(n / mag) * mag
}

function bigNumber(rng: Rng, digits: number): number {
  return rng.int(10 ** (digits - 1), 10 ** digits - 1)
}

export const sets: GeneratedSetDef[] = [
  {
    id: 'gen5-addition-guesstimation',
    chapterId: '5',
    sectionId: 'addition-guesstimation',
    title: 'Addition guesstimation',
    description: 'Round each number to two leading digits, then add.',
    coversBookSets: ['ch5-addition-guesstimation'],
    generate(difficulty, rng) {
      const d = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 7
      const a = bigNumber(rng, d)
      const b = bigNumber(rng, rng.int(d - 1, d))
      const ra = round2(a)
      const rb = round2(b)
      return {
        difficulty,
        prompt: { kind: 'binary', a, b, op: '+' },
        answer: estimate(a + b, 0.02),
        solution: { steps: [`${a} ≈ ${ra}`, `${b} ≈ ${rb}`, `${ra} + ${rb} = ${ra + rb}`, `Exact: ${a + b}`] },
      }
    },
  },
  {
    id: 'gen5-subtraction-guesstimation',
    chapterId: '5',
    sectionId: 'subtraction-guesstimation',
    title: 'Subtraction guesstimation',
    description: 'Round both numbers the same way, then subtract.',
    coversBookSets: ['ch5-subtraction-guesstimation'],
    generate(difficulty, rng) {
      const d = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 7
      let a = bigNumber(rng, d)
      let b = bigNumber(rng, rng.int(d - 1, d))
      if (b >= a) [a, b] = [b + 1, a]
      const ra = round2(a)
      const rb = round2(b)
      return {
        difficulty,
        prompt: { kind: 'binary', a, b, op: '-' },
        answer: estimate(a - b, 0.03),
        solution: { steps: [`${a} ≈ ${ra}`, `${b} ≈ ${rb}`, `${ra} ${MINUS} ${rb} = ${ra - rb}`, `Exact: ${a - b}`] },
      }
    },
  },
  {
    id: 'gen5-division-guesstimation',
    chapterId: '5',
    sectionId: 'division-guesstimation',
    title: 'Division guesstimation',
    description: 'Round the divisor, find the first digit of the quotient, then refine.',
    coversBookSets: ['ch5-division-guesstimation'],
    generate(difficulty, rng) {
      const a = bigNumber(rng, difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 7)
      const b = difficulty === 'easy' ? rng.int(2, 9) : difficulty === 'medium' ? rng.int(11, 99) : rng.int(101, 999)
      const exact = a / b
      const value = Math.round(exact * 10) / 10
      const rb = round2(b)
      return {
        difficulty,
        prompt: { kind: 'binary', a, b, op: '÷' },
        answer: estimate(value, 0.05),
        solution: { steps: [`${b} ≈ ${rb}`, `${a} ÷ ${rb} ≈ ${Math.round((a / rb) * 10) / 10}`, `Exact to one decimal: ${value}`] },
      }
    },
  },
  {
    id: 'gen5-multiplication-guesstimation',
    chapterId: '5',
    sectionId: 'multiplication-guesstimation',
    title: 'Multiplication guesstimation',
    description: 'Round one number up and the other down, then multiply.',
    coversBookSets: ['ch5-multiplication-guesstimation'],
    generate(difficulty, rng) {
      const a = bigNumber(rng, difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 5)
      const b = bigNumber(rng, difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4)
      const ra = round2(a)
      const rb = round2(b)
      return {
        difficulty,
        prompt: { kind: 'binary', a, b, op: '×' },
        answer: estimate(a * b, 0.05),
        solution: { steps: [`${a} ≈ ${ra}`, `${b} ≈ ${rb}`, `${ra} × ${rb} = ${ra * rb}`, `Exact: ${a * b}`] },
      }
    },
  },
  {
    id: 'gen5-square-root-guesstimation',
    chapterId: '5',
    sectionId: 'square-root-estimation-divide-and-average',
    title: 'Square root guesstimation',
    description: 'Divide and average: guess, divide the number by the guess, average the two.',
    coversBookSets: ['ch5-square-root-guesstimation'],
    generate(difficulty, rng) {
      let radicand: number
      do radicand = rng.int(difficulty === 'easy' ? 10 : difficulty === 'medium' ? 100 : 1000, difficulty === 'easy' ? 99 : difficulty === 'medium' ? 999 : 9999)
      while (Number.isInteger(Math.sqrt(radicand)))
      const exact = Math.sqrt(radicand)
      const guess = Math.floor(exact)
      const q = Math.round((radicand / guess) * 10) / 10
      const avg = Math.round(((guess + q) / 2) * 10) / 10
      const value = Math.round(exact * 10) / 10
      return {
        difficulty,
        prompt: { kind: 'root', radicand, degree: 2 },
        answer: estimate(value, 0.02),
        solution: { steps: [`Guess ${guess} (${guess}² = ${guess * guess})`, `${radicand} ÷ ${guess} ≈ ${q}`, `Average: (${guess} + ${q}) ÷ 2 ≈ ${avg}`, `√${radicand} ≈ ${value}`] },
      }
    },
  },
  {
    id: 'gen5-tips',
    chapterId: '5',
    sectionId: 'more-tips-on-tips',
    title: 'Tips',
    description: '10% then half again for 15%; 10% doubled for 20%.',
    generate(difficulty, rng) {
      const percent = difficulty === 'hard' ? 15 : rng.pick([15, 20])
      const dollars = difficulty === 'easy' ? rng.int(10, 60) : rng.int(20, 200)
      const cents = difficulty === 'easy' ? 0 : rng.pick([0, 25, 50, 75, rng.int(0, 99)])
      const bill = dollars + cents / 100
      const ten = Math.round(bill * 10) / 100
      const value = Math.round(bill * percent) / 100
      const steps =
        percent === 15
          ? [`10% of ${bill.toFixed(2)} = ${ten.toFixed(2)}`, `Half of that = ${(ten / 2).toFixed(2)}`, `${ten.toFixed(2)} + ${(ten / 2).toFixed(2)} = ${value.toFixed(2)}`]
          : [`10% of ${bill.toFixed(2)} = ${ten.toFixed(2)}`, `Double it: ${value.toFixed(2)}`]
      return { difficulty, prompt: { kind: 'percent', percent, of: bill }, answer: { kind: 'decimal', value, tolerance: 0.01 }, solution: { steps } }
    },
  },
  {
    id: 'gen5-sales-tax',
    chapterId: '5',
    sectionId: 'not-too-taxing-calculations',
    title: 'Sales tax',
    description: 'Multiply by the percent, then move the decimal point two places.',
    generate(difficulty, rng) {
      const percent = rng.int(5, 9)
      const price = difficulty === 'easy' ? rng.int(10, 90) : difficulty === 'medium' ? rng.int(20, 500) : rng.int(100, 5000)
      const value = Math.round(price * percent) / 100
      return {
        difficulty,
        prompt: { kind: 'percent', percent, of: price },
        answer: { kind: 'decimal', value, tolerance: 0.01 },
        solution: { steps: [`${price} × ${percent} = ${price * percent}`, `Move the point two places: ${value.toFixed(2)}`] },
      }
    },
  },
  {
    id: 'gen5-doubling-time',
    chapterId: '5',
    sectionId: 'some-interest-ing-calculations',
    title: 'Doubling time',
    description: 'Rule of 70: years to double ≈ 70 ÷ the interest rate.',
    generate(difficulty, rng) {
      const rate = rng.pick(difficulty === 'easy' ? [5, 7, 10] : difficulty === 'medium' ? [2, 4, 6, 8, 14] : [3, 9, 11, 12, 15])
      const value = Math.round(70 / rate)
      return {
        difficulty,
        prompt: { kind: 'text', text: `At ${rate}% interest, about how many years does money take to double?` },
        answer: { kind: 'integer', value },
        solution: { steps: [`Rule of 70: 70 ÷ ${rate} ≈ ${(70 / rate).toFixed(1)}`, `About ${value} years`] },
      }
    },
  },
]
