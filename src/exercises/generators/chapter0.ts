import type { GeneratedSetDef } from '../types'
import { integer, stepsTimes11, times } from './shared'

export const sets: GeneratedSetDef[] = [
  {
    id: 'gen0-multiply-by-11',
    chapterId: '0',
    sectionId: 'instant-multiplication',
    title: 'Multiply by 11',
    description: 'Add the neighbouring digits and slide the sum in between.',
    generate(difficulty, rng) {
      let a: number
      if (difficulty === 'easy') {
        do a = rng.int(10, 49)
        while (Math.floor(a / 10) + (a % 10) >= 10)
      } else if (difficulty === 'medium') {
        do a = rng.int(50, 99)
        while (Math.floor(a / 10) + (a % 10) < 10)
      } else {
        a = rng.int(100, 999)
      }
      return { difficulty, prompt: times(a, 11), answer: integer(a * 11), solution: { steps: stepsTimes11(a) } }
    },
  },
  {
    id: 'gen0-square-ending-in-5',
    chapterId: '0',
    sectionId: 'squaring-and-more',
    title: 'Squares ending in 5',
    description: 'Multiply the leading part by one more than itself, then append 25.',
    generate(difficulty, rng) {
      const t = difficulty === 'easy' ? rng.int(1, 4) : difficulty === 'medium' ? rng.int(5, 9) : rng.int(10, 99)
      const base = t * 10 + 5
      return {
        difficulty,
        prompt: { kind: 'power', base, exp: 2 },
        answer: integer(base * base),
        solution: { steps: [`${t} × ${t + 1} = ${t * (t + 1)}`, `Append 25: ${base * base}`] },
      }
    },
  },
  {
    id: 'gen0-same-tens-sum-10',
    chapterId: '0',
    sectionId: 'squaring-and-more',
    title: 'Same tens, ones adding to 10',
    description: 'Same first digit, last digits summing to 10: multiply up the tens, then the ones.',
    generate(difficulty, rng) {
      const t = difficulty === 'easy' ? rng.int(2, 4) : difficulty === 'medium' ? rng.int(5, 7) : rng.int(8, 9)
      const x = difficulty === 'hard' ? rng.int(6, 9) : rng.int(1, 9)
      const y = 10 - x
      const a = t * 10 + x
      const b = t * 10 + y
      const head = t * (t + 1)
      const tail = x * y
      return {
        difficulty,
        prompt: times(a, b),
        answer: integer(a * b),
        solution: {
          steps: [`${t} × ${t + 1} = ${head}`, `${x} × ${y} = ${tail}`, `Join them: ${head}${String(tail).padStart(2, '0')} = ${a * b}`],
        },
      }
    },
  },
]
