import { WEEKDAY_OPTIONS, dayOfWeek, daySteps, isValidDate } from '../dates'
import type { GeneratedSetDef, Rng } from '../types'
import { MINUS, digits, integer } from './shared'

const CUBE_LAST_DIGIT: Record<number, number> = {
  0: 0,
  1: 1,
  8: 2,
  7: 3,
  4: 4,
  5: 5,
  6: 6,
  3: 7,
  2: 8,
  9: 9,
}

function randomIso(rng: Rng, yearLo: number, yearHi: number): string {
  for (;;) {
    const y = rng.int(yearLo, yearHi)
    const m = rng.int(1, 12)
    const d = rng.int(1, 31)
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (isValidDate(iso)) return iso
  }
}

export const sets: GeneratedSetDef[] = [
  {
    id: 'gen9-psychic-math',
    chapterId: '9',
    sectionId: 'psychic-math',
    title: 'Psychic math',
    description: 'Double, add, halve, subtract the original: the number they picked cancels out.',
    generate(difficulty, rng) {
      const k =
        difficulty === 'easy'
          ? rng.pick([12, 8, 10])
          : difficulty === 'medium'
            ? 2 * rng.int(5, 15)
            : 2 * rng.int(11, 30)
      const x = rng.int(1, 99)
      return {
        difficulty,
        prompt: {
          kind: 'text',
          text: `A volunteer picks a number (say ${x}), doubles it, adds ${k}, divides by 2, then subtracts the number they started with. What do they end with?`,
          emphasis: String(k),
        },
        answer: integer(k / 2),
        solution: {
          steps: [
            `2x + ${k}`,
            `(2x + ${k}) ÷ 2 = x + ${k / 2}`,
            `x + ${k / 2} ${MINUS} x = ${k / 2}`,
          ],
        },
      }
    },
  },
  {
    id: 'gen9-magic-1089',
    chapterId: '9',
    sectionId: 'the-magic-1089',
    title: 'The magic 1089',
    description: 'Reverse and subtract, then add the reverse of that: always 1089.',
    generate(difficulty, rng) {
      const a = rng.int(difficulty === 'easy' ? 3 : 2, 9)
      const c = rng.int(0, a - 2)
      const b = rng.int(0, 9)
      const n = a * 100 + b * 10 + c
      const rev = c * 100 + b * 10 + a
      const diff = n - rev
      const dd = digits(diff)
      while (dd.length < 3) dd.unshift(0)
      const diffRev = dd[2]! * 100 + dd[1]! * 10 + dd[0]!
      return {
        difficulty,
        prompt: {
          kind: 'text',
          text: `Start with ${n}. Reverse its digits and subtract the smaller from the larger, then add that result to its own reverse. What do you get?`,
          emphasis: String(n),
        },
        answer: integer(1089),
        solution: {
          steps: [
            `${n} ${MINUS} ${rev} = ${String(diff).padStart(3, '0')}`,
            `${String(diff).padStart(3, '0')} + ${diffRev} = ${diff + diffRev}`,
          ],
        },
      }
    },
  },
  {
    id: 'gen9-missing-digit',
    chapterId: '9',
    sectionId: 'missing-digit-tricks',
    title: 'Missing digit',
    description:
      'A multiple of 9 has digits summing to a multiple of 9, so one hidden digit gives itself away.',
    generate(difficulty, rng) {
      for (;;) {
        const base =
          difficulty === 'easy'
            ? rng.int(12, 99)
            : difficulty === 'medium'
              ? rng.int(100, 999)
              : rng.int(1000, 9999)
        const product = base * 9
        const ds = digits(product)
        const idx = rng.int(0, ds.length - 1)
        const hidden = ds[idx]!
        if (hidden === 0 || hidden === 9) continue // ambiguous with the rule
        const shown = ds.filter((_, i) => i !== idx)
        const sum = shown.reduce((s, d) => s + d, 0)
        const answer = (9 - (sum % 9)) % 9
        return {
          difficulty,
          prompt: {
            kind: 'text',
            text: `${base} × 9 was written down and one nonzero digit was crossed out. The remaining digits, in order, are ${shown.join(' ')}. Which digit was crossed out?`,
            emphasis: shown.join(' '),
          },
          answer: integer(answer),
          solution: {
            steps: [
              `Digits shown add to ${sum}`,
              `Next multiple of 9 above ${sum} is ${sum + answer}`,
              `Missing digit: ${answer}`,
            ],
          },
        }
      }
    },
  },
  {
    id: 'gen9-leapfrog',
    chapterId: '9',
    sectionId: 'leapfrog-addition',
    title: 'Leapfrog addition',
    description:
      'Ten numbers where each is the sum of the two before: the total is 11 times the seventh.',
    generate(difficulty, rng) {
      const hi = difficulty === 'easy' ? 9 : difficulty === 'medium' ? 20 : 50
      const xs = [rng.int(1, hi), rng.int(1, hi)]
      while (xs.length < 10) xs.push(xs[xs.length - 1]! + xs[xs.length - 2]!)
      const total = xs.reduce((s, x) => s + x, 0)
      return {
        difficulty,
        prompt: { kind: 'columns', numbers: xs },
        answer: integer(total),
        solution: { steps: [`The seventh number is ${xs[6]}`, `11 × ${xs[6]} = ${total}`] },
      }
    },
  },
  {
    id: 'gen9-cube-roots',
    chapterId: '9',
    sectionId: 'quick-cube-roots',
    title: 'Quick cube roots',
    description: 'The last digit tells the last digit; the thousands tell the tens.',
    generate(difficulty, rng) {
      const n =
        difficulty === 'easy'
          ? rng.int(11, 40)
          : difficulty === 'medium'
            ? rng.int(30, 70)
            : rng.int(60, 99)
      const cube = n ** 3
      const tens = Math.floor(n / 10)
      return {
        difficulty,
        prompt: { kind: 'root', radicand: cube, degree: 3 },
        answer: integer(n),
        solution: {
          steps: [
            `Last digit ${cube % 10} → the root ends in ${CUBE_LAST_DIGIT[cube % 10]}`,
            `${Math.floor(cube / 1000)} thousands sits between ${tens}³ = ${tens ** 3} and ${tens + 1}³ = ${(tens + 1) ** 3} → tens digit ${tens}`,
            `∛${cube} = ${n}`,
          ],
        },
      }
    },
  },
  {
    id: 'gen9-square-roots',
    chapterId: '9',
    sectionId: 'simplified-square-roots',
    title: 'Simplified square roots',
    description:
      'For perfect squares: the hundreds give the tens, the last digit narrows to two candidates, 5² decides.',
    generate(difficulty, rng) {
      const n =
        difficulty === 'easy'
          ? rng.int(11, 40)
          : difficulty === 'medium'
            ? rng.int(30, 70)
            : rng.int(60, 99)
      const sq = n * n
      const tens = Math.floor(n / 10)
      const last = n % 10
      const other = (10 - last) % 10
      const mid = tens * 10 + 5
      return {
        difficulty,
        prompt: { kind: 'root', radicand: sq, degree: 2 },
        answer: integer(n),
        solution: {
          steps: [
            `${Math.floor(sq / 100)} hundreds sits between ${tens}² = ${tens * tens} and ${tens + 1}² = ${(tens + 1) ** 2} → tens digit ${tens}`,
            last === 0 || last === 5
              ? `Last digit ${sq % 10} → the root ends in ${last}`
              : `Last digit ${sq % 10} → the root ends in ${Math.min(last, other)} or ${Math.max(last, other)}`,
            last === 0 || last === 5
              ? `√${sq} = ${n}`
              : `${mid}² = ${mid * mid}; ${sq} is ${sq > mid * mid ? 'more' : 'less'}, so √${sq} = ${n}`,
          ],
        },
      }
    },
  },
  {
    id: 'gen9-day-for-any-date',
    chapterId: '9',
    sectionId: 'a-day-for-any-date',
    title: 'A day for any date',
    description: 'Month code + date + year code, mod 7.',
    coversBookSets: ['ch9-a-day-for-any-date'],
    generate(difficulty, rng) {
      const iso =
        difficulty === 'easy'
          ? randomIso(rng, 2000, 2099)
          : difficulty === 'medium'
            ? randomIso(rng, 1900, 1999)
            : (() => {
                const c = rng.pick([1800, 2100, 2200, 2300]) // Gregorian only: the book's method starts after 1752
                return randomIso(rng, c, c + 99)
              })()
      return {
        difficulty,
        prompt: { kind: 'date', iso },
        answer: { kind: 'choice', options: [...WEEKDAY_OPTIONS], correct: dayOfWeek(iso) },
        solution: { steps: daySteps(iso) },
      }
    },
  },
]
