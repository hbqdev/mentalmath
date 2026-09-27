import type { GeneratedSetDef } from '../types'
import { integer, stepsMultiplyByDigit, stepsSquareNear, times } from './shared'

export const sets: GeneratedSetDef[] = [
  {
    id: 'gen2-2-by-1-multiplication',
    chapterId: '2',
    sectionId: '2-by-1-multiplication-problems',
    title: '2-by-1 multiplication',
    description: 'Split the two-digit number into tens and ones, multiply each, add left to right.',
    coversBookSets: ['ch2-2-by-1-multiplication'],
    generate(difficulty, rng) {
      const a = difficulty === 'easy' ? rng.int(11, 49) : rng.int(11, 99)
      const d = difficulty === 'easy' ? rng.int(2, 5) : difficulty === 'medium' ? rng.int(2, 9) : rng.int(6, 9)
      return { difficulty, prompt: times(a, d), answer: integer(a * d), solution: { steps: stepsMultiplyByDigit(a, d) } }
    },
  },
  {
    id: 'gen2-3-by-1-multiplication',
    chapterId: '2',
    sectionId: '3-by-1-multiplication-problems',
    title: '3-by-1 multiplication',
    description: 'Hundreds, tens, ones: multiply each part and keep a running total.',
    coversBookSets: ['ch2-3-by-1-multiplication'],
    generate(difficulty, rng) {
      const a = difficulty === 'easy' ? rng.int(101, 399) : rng.int(101, 999)
      const d = difficulty === 'easy' ? rng.int(2, 5) : difficulty === 'medium' ? rng.int(2, 9) : rng.int(6, 9)
      return { difficulty, prompt: times(a, d), answer: integer(a * d), solution: { steps: stepsMultiplyByDigit(a, d) } }
    },
  },
  {
    id: 'gen2-two-digit-squares',
    chapterId: '2',
    sectionId: 'be-there-or-b2-squaring-two-digit-numbers',
    title: 'Two-digit squares',
    description: 'Round to the nearest ten, multiply up and down, add the square of the difference.',
    coversBookSets: ['ch2-two-digit-squares'],
    generate(difficulty, rng) {
      const base = difficulty === 'easy' ? rng.int(11, 39) : difficulty === 'medium' ? rng.int(40, 69) : rng.int(70, 99)
      return {
        difficulty,
        prompt: { kind: 'power', base, exp: 2 },
        answer: integer(base * base),
        solution: { steps: stepsSquareNear(base, 10) },
      }
    },
  },
]
