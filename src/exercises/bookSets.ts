import type { AnswerSpec, Exercise, Prompt } from './types'

export interface BookProblem {
  n: number
  prompt: Prompt
  answer: AnswerSpec
  steps: string[]
}

export interface BookSetData {
  id: string
  problems: BookProblem[]
}

/** The book's own problem sets with the authors' answers, registered by src/content/book-exercises/index.ts. */
const registry = new Map<string, BookSetData>()

export function registerBookSets(sets: BookSetData[]) {
  for (const s of sets) registry.set(s.id, s)
}

export function allBookSets(): BookSetData[] {
  return [...registry.values()]
}

export function bookExercises(setId: string): Exercise[] {
  const set = registry.get(setId)
  if (!set) return []
  return set.problems.map((p) => ({
    id: `${setId}-${p.n}`,
    setId,
    source: 'book',
    prompt: p.prompt,
    answer: p.answer,
    solution: { steps: p.steps },
  }))
}
