import type { Exercise } from './types'

/**
 * Book problem sets with the authors' answers. Plan 3 fills `src/content/book-exercises/`
 * and registers the data here; until then every set is empty and the practice view offers
 * the generated twin instead.
 */
const registry = new Map<string, Exercise[]>()

export function registerBookExercises(setId: string, exercises: Exercise[]) {
  registry.set(setId, exercises)
}

export function bookExercises(setId: string): Exercise[] {
  return registry.get(setId) ?? []
}
