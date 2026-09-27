import type { GeneratedSetDef } from '../types'
import { integer, stepsBigProduct, stepsSquareNear, times } from './shared'

export const sets: GeneratedSetDef[] = [
  {
    id: 'gen8-four-digit-squares',
    chapterId: '8',
    sectionId: 'four-digit-squares',
    title: 'Four-digit squares',
    description: 'Round to the nearest thousand, multiply up and down, add the square of the difference.',
    coversBookSets: ['ch8-four-digit-squares'],
    generate(difficulty, rng) {
      const base = difficulty === 'easy' ? rng.int(1001, 3999) : difficulty === 'medium' ? rng.int(3000, 6999) : rng.int(6000, 9999)
      return { difficulty, prompt: { kind: 'power', base, exp: 2 }, answer: integer(base * base), solution: { steps: stepsSquareNear(base, 1000) } }
    },
  },
  {
    id: 'gen8-3-by-2',
    chapterId: '8',
    sectionId: '3-by-2-multiplication',
    title: '3-by-2 multiplication',
    description: 'Factor the two-digit number, round it, or split it: whichever makes the two products easy.',
    coversBookSets: ['ch8-3-by-2-multiplication'],
    generate(difficulty, rng) {
      const a = rng.int(101, 999)
      const b = difficulty === 'easy' ? rng.pick([12, 14, 15, 16, 18, 21, 24, 25, 27, 28, 32, 35, 36, 42, 45, 48, 49, 54, 56, 63, 64, 72, 81]) : difficulty === 'medium' ? rng.int(11, 59) : rng.int(41, 99)
      return { difficulty, prompt: times(a, b), answer: integer(a * b), solution: { steps: stepsBigProduct(a, b) } }
    },
  },
  {
    id: 'gen8-five-digit-squares',
    chapterId: '8',
    sectionId: 'five-digit-squares',
    title: 'Five-digit squares',
    description: 'The same rounding idea one step bigger, holding the middle term with the phonetic code.',
    coversBookSets: ['ch8-five-digit-squares'],
    generate(difficulty, rng) {
      const base = difficulty === 'easy' ? rng.int(10001, 29999) : difficulty === 'medium' ? rng.int(30000, 69999) : rng.int(70000, 99999)
      return { difficulty, prompt: { kind: 'power', base, exp: 2 }, answer: integer(base * base), solution: { steps: stepsSquareNear(base, 1000) } }
    },
  },
  {
    id: 'gen8-3-by-3',
    chapterId: '8',
    sectionId: '3-by-3-multiplication',
    title: '3-by-3 multiplication',
    description: 'Split the smaller number into hundreds and the rest; two easier products, then add.',
    coversBookSets: ['ch8-3-by-3-multiplication'],
    generate(difficulty, rng) {
      const a = rng.int(101, 999)
      const b = difficulty === 'easy' ? rng.int(101, 399) : difficulty === 'medium' ? rng.int(101, 699) : rng.int(101, 999)
      return { difficulty, prompt: times(a, b), answer: integer(a * b), solution: { steps: stepsBigProduct(a, b) } }
    },
  },
  {
    id: 'gen8-5-by-5',
    chapterId: '8',
    sectionId: '5-by-5-multiplication',
    title: '5-by-5 multiplication',
    description: 'The largest problem in the book: split both numbers and keep the partial products in mind.',
    coversBookSets: ['ch8-5-by-5-multiplication'],
    generate(difficulty, rng) {
      const a = rng.int(10001, 99999)
      const b = difficulty === 'easy' ? rng.int(10001, 29999) : difficulty === 'medium' ? rng.int(10001, 59999) : rng.int(10001, 99999)
      return { difficulty, prompt: times(a, b), answer: integer(a * b), solution: { steps: stepsBigProduct(a, b) } }
    },
  },
]
