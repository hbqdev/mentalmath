import type { GeneratedSetDef, Rng } from '../types'
import { MINUS, digits, integer } from './shared'

const digitRoot = (n: number) => (n === 0 ? 0 : 1 + ((n - 1) % 9))
const bigNumber = (rng: Rng, d: number) => rng.int(10 ** (d - 1), 10 ** d - 1)

function crissCrossSteps(a: number, b: number): string[] {
  const A = digits(a).reverse()
  const B = digits(b).reverse()
  const steps: string[] = []
  let carry = 0
  const out: number[] = []
  for (let k = 0; k < A.length + B.length - 1; k++) {
    const terms: string[] = []
    let sum = carry
    for (let i = 0; i < A.length; i++) {
      const j = k - i
      if (j < 0 || j >= B.length) continue
      terms.push(`${A[i]} × ${B[j]}`)
      sum += A[i]! * B[j]!
    }
    steps.push(
      `${terms.join(' + ')}${carry ? ` + ${carry}` : ''} = ${sum}, write ${sum % 10}${sum >= 10 ? `, carry ${Math.floor(sum / 10)}` : ''}`,
    )
    out.push(sum % 10)
    carry = Math.floor(sum / 10)
  }
  if (carry) steps.push(`Leading carry ${carry}`)
  steps.push(`${a} × ${b} = ${a * b}`)
  return steps
}

export const sets: GeneratedSetDef[] = [
  {
    id: 'gen6-columns-of-numbers',
    chapterId: '6',
    sectionId: 'columns-of-numbers',
    title: 'Columns of numbers',
    description: 'Add top to bottom, keeping a running total; check with mod sums.',
    coversBookSets: ['ch6-columns-of-numbers'],
    generate(difficulty, rng) {
      const count = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8
      const numbers = Array.from({ length: count }, () =>
        bigNumber(rng, rng.int(2, difficulty === 'hard' ? 4 : 3)),
      )
      let running = 0
      const steps = numbers.map((n) => {
        running += n
        return `+ ${n} → ${running}`
      })
      const total = numbers.reduce((s, n) => s + n, 0)
      steps.push(
        `Mod sum check: ${digitRoot(numbers.reduce((s, n) => s + digitRoot(n), 0))} = ${digitRoot(total)}; total ${total}`,
      )
      return {
        difficulty,
        prompt: { kind: 'columns', numbers },
        answer: integer(total),
        solution: { steps },
      }
    },
  },
  {
    id: 'gen6-mod-sums',
    chapterId: '6',
    sectionId: 'mod-sums',
    title: 'Mod sums',
    description: 'Add the digits until one digit remains (9s count as 9).',
    generate(difficulty, rng) {
      const n = bigNumber(rng, difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 8)
      const s1 = digits(n).reduce((s, d) => s + d, 0)
      const value = digitRoot(n)
      const steps = [`Digits of ${n} add to ${s1}`]
      if (s1 >= 10) steps.push(`Digits of ${s1} add to ${digitRoot(s1)}`)
      steps.push(`Mod sum: ${value}`)
      return {
        difficulty,
        prompt: { kind: 'text', text: `What is the mod sum of ${n}?` },
        answer: integer(value),
        solution: { steps },
      }
    },
  },
  {
    id: 'gen6-subtracting-on-paper',
    chapterId: '6',
    sectionId: 'subtracting-on-paper',
    title: 'Subtracting on paper',
    description: 'Subtract left to right and verify with mod sums.',
    coversBookSets: ['ch6-subtracting-on-paper'],
    generate(difficulty, rng) {
      const d = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 6 : 8
      let a = bigNumber(rng, d)
      let b = bigNumber(rng, d - rng.int(0, 1))
      if (b >= a) [a, b] = [b + 1, a]
      const diff = a - b
      return {
        difficulty,
        prompt: { kind: 'binary', a, b, op: '-' },
        answer: integer(diff),
        solution: {
          steps: [
            `Subtract left to right, borrowing with complements where needed`,
            `Check: mod sum ${digitRoot(b)} + ${digitRoot(diff)} → ${digitRoot(digitRoot(b) + digitRoot(diff))} = mod sum of ${a} (${digitRoot(a)})`,
            `${a} ${MINUS} ${b} = ${diff}`,
          ],
        },
      }
    },
  },
  {
    id: 'gen6-square-roots',
    chapterId: '6',
    sectionId: 'pencil-and-paper-square-roots',
    title: 'Pencil-and-paper square roots',
    description: 'The doubling-and-dividing method, digit by digit.',
    coversBookSets: ['ch6-square-root-guesstimation'],
    generate(difficulty, rng) {
      if (difficulty !== 'hard') {
        const root = difficulty === 'easy' ? rng.int(11, 31) : rng.int(32, 99)
        const radicand = root * root
        const tens = Math.floor(root / 10) * 10
        return {
          difficulty,
          prompt: { kind: 'root', radicand, degree: 2 },
          answer: integer(root),
          solution: {
            steps: [
              `${tens}² = ${tens * tens} fits under ${radicand}`,
              `Remainder ${radicand - tens * tens}, double ${tens} → ${2 * tens}`,
              `${2 * tens + (root % 10)} × ${root % 10} = ${(2 * tens + (root % 10)) * (root % 10)}`,
              `√${radicand} = ${root}`,
            ],
          },
        }
      }
      let radicand: number
      do radicand = rng.int(200, 9999)
      while (Number.isInteger(Math.sqrt(radicand)))
      const value = Math.round(Math.sqrt(radicand) * 100) / 100
      const g = Math.floor(Math.sqrt(radicand))
      return {
        difficulty,
        prompt: { kind: 'root', radicand, degree: 2 },
        answer: { kind: 'decimal', value, tolerance: 0.01 },
        solution: {
          steps: [
            `${g}² = ${g * g} fits under ${radicand}`,
            `Continue with decimals: ${radicand} ÷ ${g} ≈ ${(radicand / g).toFixed(2)}, average with ${g}`,
            `√${radicand} ≈ ${value}`,
          ],
        },
      }
    },
  },
  {
    id: 'gen6-criss-cross',
    chapterId: '6',
    sectionId: 'pencil-and-paper-multiplication',
    title: 'Criss-cross multiplication',
    description: 'Write only the answer: pair up digits diagonally and carry as you go.',
    coversBookSets: ['ch6-pencil-and-paper-multiplication'],
    generate(difficulty, rng) {
      const a = bigNumber(rng, difficulty === 'easy' ? 2 : 3)
      const b = bigNumber(rng, difficulty === 'hard' ? 3 : 2)
      return {
        difficulty,
        prompt: { kind: 'binary', a, b, op: '×' },
        answer: integer(a * b),
        solution: { steps: crissCrossSteps(a, b) },
      }
    },
  },
  {
    id: 'gen6-casting-out-elevens',
    chapterId: '6',
    sectionId: 'casting-out-elevens',
    title: 'Casting out elevens',
    description: 'Alternately subtract and add the digits from right to left; reduce mod 11.',
    generate(difficulty, rng) {
      const n = bigNumber(rng, difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 9)
      const ds = digits(n).reverse()
      const alt = ds.reduce((s, d, i) => s + (i % 2 === 0 ? d : -d), 0)
      const value = ((alt % 11) + 11) % 11
      const expr = ds
        .map((d, i) => (i === 0 ? `${d}` : `${i % 2 === 0 ? '+' : MINUS} ${d}`))
        .join(' ')
      return {
        difficulty,
        prompt: { kind: 'text', text: `What does ${n} leave when you cast out elevens?` },
        answer: integer(value),
        solution: { steps: [`From the right: ${expr} = ${alt}`, `Mod 11: ${value}`] },
      }
    },
  },
]
