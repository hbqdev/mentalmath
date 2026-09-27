import type { GeneratedSetDef, Rng } from '../types'
import { integer, stepsLeftToRightAdd, stepsLeftToRightSub } from './shared'

const plus = (a: number, b: number) => ({ kind: 'binary' as const, a, b, op: '+' as const })
const minus = (a: number, b: number) => ({ kind: 'binary' as const, a, b, op: '-' as const })

function twoDigitPair(difficulty: string, rng: Rng): [number, number] {
  if (difficulty === 'easy') {
    // no carry in the ones or tens
    const a = rng.int(10, 88)
    const b = rng.int(10, 99 - a) // keep the sum under 100
    if ((a % 10) + (b % 10) < 10) return [a, b]
    return [a, b - (b % 10) + Math.max(0, 9 - (a % 10))]
  }
  if (difficulty === 'medium') {
    let a = rng.int(20, 99)
    let b = rng.int(20, 99)
    if ((a % 10) + (b % 10) < 10) {
      a = a - (a % 10) + rng.int(6, 9)
      b = b - (b % 10) + rng.int(6, 9)
    }
    return [a, b]
  }
  return [rng.int(50, 99), rng.int(50, 99)]
}

export const sets: GeneratedSetDef[] = [
  {
    id: 'gen1-two-digit-addition',
    chapterId: '1',
    sectionId: 'left-to-right-addition',
    title: 'Two-digit addition',
    description: 'Add left to right: tens first, then ones.',
    coversBookSets: ['ch1-two-digit-addition'],
    generate(difficulty, rng) {
      const [a, b] = twoDigitPair(difficulty, rng)
      return {
        difficulty,
        prompt: plus(a, b),
        answer: integer(a + b),
        solution: { steps: stepsLeftToRightAdd(a, b) },
      }
    },
  },
  {
    id: 'gen1-three-digit-addition',
    chapterId: '1',
    sectionId: 'left-to-right-addition',
    title: 'Three-digit addition',
    description: 'Hundreds, then tens, then ones, simplifying as you go.',
    coversBookSets: ['ch1-three-digit-addition'],
    generate(difficulty, rng) {
      const a =
        difficulty === 'easy'
          ? rng.int(100, 499)
          : difficulty === 'medium'
            ? rng.int(100, 999)
            : rng.int(1000, 9999)
      const b = difficulty === 'easy' ? rng.int(100, 499) : rng.int(100, 999)
      return {
        difficulty,
        prompt: plus(a, b),
        answer: integer(a + b),
        solution: { steps: stepsLeftToRightAdd(a, b) },
      }
    },
  },
  {
    id: 'gen1-two-digit-subtraction',
    chapterId: '1',
    sectionId: 'left-to-right-subtraction',
    title: 'Two-digit subtraction',
    description:
      'Subtract left to right; when the ones borrow, round up and add back the difference.',
    coversBookSets: ['ch1-two-digit-subtraction'],
    generate(difficulty, rng) {
      let a: number
      let b: number
      if (difficulty === 'easy') {
        b = rng.int(11, 79)
        a = b + rng.int(10, 99 - b)
        if (a % 10 < b % 10) a = a - (a % 10) + (b % 10) // no borrow
        if (a <= b) a = b + 10
      } else if (difficulty === 'medium') {
        b = rng.int(15, 79)
        a = b + rng.int(10, 99 - b)
        if (a % 10 >= b % 10) {
          const ones = rng.int(0, Math.max(0, (b % 10) - 1))
          a = a - (a % 10) + ones
          if (a <= b) a += 10
        }
      } else {
        a = rng.int(100, 199)
        b = rng.int(20, 99)
      }
      return {
        difficulty,
        prompt: minus(a, b),
        answer: integer(a - b),
        solution: { steps: stepsLeftToRightSub(a, b) },
      }
    },
  },
  {
    id: 'gen1-three-digit-subtraction',
    chapterId: '1',
    sectionId: 'left-to-right-subtraction',
    title: 'Three-digit subtraction',
    description: 'Use complements: subtract a round number and add the difference back.',
    coversBookSets: ['ch1-three-digit-subtraction'],
    generate(difficulty, rng) {
      const b = rng.int(100, difficulty === 'easy' ? 499 : 999)
      let a: number
      if (difficulty === 'hard') a = rng.int(1000, 2999)
      else {
        a = b + rng.int(50, 999 - b > 50 ? 999 - b : 50)
        if (a > 999) a = 999
      }
      if (difficulty === 'easy' && a % 10 < b % 10) a = a - (a % 10) + (b % 10)
      if (a <= b) a = b + 101
      return {
        difficulty,
        prompt: minus(a, b),
        answer: integer(a - b),
        solution: { steps: stepsLeftToRightSub(a, b) },
      }
    },
  },
]
