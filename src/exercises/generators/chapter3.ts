import type { GeneratedSetDef } from '../types'
import {
  integer,
  nearestFactorPair,
  stepsAdditionMethod,
  stepsFactoring,
  stepsSquareNear,
  stepsSubtractionMethod,
  stepsTimes11,
  times,
} from './shared'

const FACTORABLE = Array.from({ length: 88 }, (_, i) => i + 12).filter(
  (n) => nearestFactorPair(n) !== null,
)

function cubeSteps(n: number): string[] {
  const near = Math.round(n / 10) * 10
  const d = Math.abs(n - near)
  if (d === 0) return [`${n}³ = ${n} × ${n} × ${n} = ${n ** 3}`]
  const lo = n - d
  const hi = n + d
  return [
    `${n}³ = ${lo} × ${n} × ${hi} + ${d}² × ${n}`,
    `${lo} × ${hi} = ${lo * hi}`,
    `${lo * hi} × ${n} = ${lo * hi * n}`,
    `${d}² × ${n} = ${d * d * n}`,
    `${lo * hi * n} + ${d * d * n} = ${n ** 3}`,
  ]
}

export const sets: GeneratedSetDef[] = [
  {
    id: 'gen3-multiplying-by-11',
    chapterId: '3',
    sectionId: '2-by-2-multiplication-problems',
    title: 'Multiplying by 11',
    description: 'The neighbour-sum trick, now with three and four digits.',
    coversBookSets: ['ch3-multiplying-by-11'],
    generate(difficulty, rng) {
      const a =
        difficulty === 'easy'
          ? rng.int(10, 99)
          : difficulty === 'medium'
            ? rng.int(100, 999)
            : rng.int(1000, 9999)
      return {
        difficulty,
        prompt: times(a, 11),
        answer: integer(a * 11),
        solution: { steps: stepsTimes11(a) },
      }
    },
  },
  {
    id: 'gen3-2-by-2-addition-method',
    chapterId: '3',
    sectionId: '2-by-2-multiplication-problems',
    title: '2-by-2: addition method',
    description: 'Split the second factor into tens and ones, multiply each, add.',
    coversBookSets: ['ch3-2-by-2-addition-method'],
    generate(difficulty, rng) {
      const a = difficulty === 'easy' ? rng.int(12, 49) : rng.int(12, 99)
      const b = (difficulty === 'hard' ? rng.int(4, 9) : rng.int(1, 5)) * 10 + rng.int(1, 3)
      return {
        difficulty,
        prompt: times(a, b),
        answer: integer(a * b),
        solution: { steps: stepsAdditionMethod(a, b) },
      }
    },
  },
  {
    id: 'gen3-2-by-2-subtraction-method',
    chapterId: '3',
    sectionId: '2-by-2-multiplication-problems',
    title: '2-by-2: subtraction method',
    description: 'Round the second factor up to a multiple of 10, multiply, subtract the excess.',
    coversBookSets: ['ch3-2-by-2-subtraction-method'],
    generate(difficulty, rng) {
      const a = difficulty === 'easy' ? rng.int(12, 49) : rng.int(12, 99)
      const b = (difficulty === 'hard' ? rng.int(5, 10) : rng.int(2, 6)) * 10 - rng.int(1, 3)
      return {
        difficulty,
        prompt: times(a, b),
        answer: integer(a * b),
        solution: { steps: stepsSubtractionMethod(a, b) },
      }
    },
  },
  {
    id: 'gen3-2-by-2-factoring-method',
    chapterId: '3',
    sectionId: '2-by-2-multiplication-problems',
    title: '2-by-2: factoring method',
    description: 'Break one factor into two small factors and multiply in turn.',
    coversBookSets: ['ch3-2-by-2-factoring-method'],
    generate(difficulty, rng) {
      const a = difficulty === 'easy' ? rng.int(12, 49) : rng.int(12, 99)
      const pool = difficulty === 'easy' ? FACTORABLE.filter((n) => n <= 48) : FACTORABLE
      const b = rng.pick(pool)
      const [f1, f2] = nearestFactorPair(b)!
      return {
        difficulty,
        prompt: times(a, b),
        answer: integer(a * b),
        solution: { steps: stepsFactoring(a, b, f1, f2) },
      }
    },
  },
  {
    id: 'gen3-2-by-2-general',
    chapterId: '3',
    sectionId: 'approaching-multiplication-creatively',
    title: '2-by-2: anything goes',
    description: 'Pick whichever method fits: addition, subtraction or factoring.',
    coversBookSets: ['ch3-2-by-2-general-multiplication'],
    generate(difficulty, rng) {
      const a = difficulty === 'easy' ? rng.int(12, 49) : rng.int(12, 99)
      const b = difficulty === 'easy' ? rng.int(12, 49) : rng.int(12, 99)
      const pair = nearestFactorPair(b)
      const steps = pair
        ? stepsFactoring(a, b, pair[0], pair[1])
        : b % 10 >= 7
          ? stepsSubtractionMethod(a, b)
          : stepsAdditionMethod(a, b)
      return { difficulty, prompt: times(a, b), answer: integer(a * b), solution: { steps } }
    },
  },
  {
    id: 'gen3-three-digit-squares',
    chapterId: '3',
    sectionId: 'three-digit-squares',
    title: 'Three-digit squares',
    description: 'Round to the nearest hundred, multiply up and down, add the small square.',
    coversBookSets: ['ch3-three-digit-squares'],
    generate(difficulty, rng) {
      const base =
        difficulty === 'easy'
          ? rng.int(101, 399)
          : difficulty === 'medium'
            ? rng.int(300, 699)
            : rng.int(600, 999)
      return {
        difficulty,
        prompt: { kind: 'power', base, exp: 2 },
        answer: integer(base * base),
        solution: { steps: stepsSquareNear(base, 100) },
      }
    },
  },
  {
    id: 'gen3-two-digit-cubes',
    chapterId: '3',
    sectionId: 'cubing',
    title: 'Two-digit cubes',
    description: 'n³ = (n − d) × n × (n + d) + d² × n, with d chosen to round n.',
    coversBookSets: ['ch3-two-digit-cubes'],
    generate(difficulty, rng) {
      const base =
        difficulty === 'easy'
          ? rng.int(11, 30)
          : difficulty === 'medium'
            ? rng.int(25, 60)
            : rng.int(50, 99)
      return {
        difficulty,
        prompt: { kind: 'power', base, exp: 3 },
        answer: integer(base ** 3),
        solution: { steps: cubeSteps(base) },
      }
    },
  },
]
