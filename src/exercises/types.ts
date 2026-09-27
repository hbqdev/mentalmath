export type Op = '+' | '-' | '×' | '÷'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Frac {
  num: number
  den: number
}

export type Prompt =
  | { kind: 'binary'; a: number; b: number; op: Op }
  | { kind: 'columns'; numbers: number[]; unit?: '$' }
  | { kind: 'power'; base: number; exp: 2 | 3 }
  | { kind: 'root'; radicand: number; degree: 2 | 3 }
  | { kind: 'fraction-binary'; a: Frac; b: Frac; op: Op }
  | {
      kind: 'fraction-task'
      value: Frac
      task: 'simplify' | 'to-decimal' | 'rewrite'
      den?: number
    }
  | { kind: 'percent'; percent: number; of: number }
  | { kind: 'divisible'; n: number; by: number }
  | { kind: 'date'; iso: string }
  | { kind: 'text'; text: string; emphasis?: string }

export type AnswerSpec =
  | { kind: 'integer'; value: number }
  | { kind: 'decimal'; value: number; tolerance: number }
  | { kind: 'fraction'; value: Frac; acceptDecimal: boolean; exact?: boolean }
  | { kind: 'quotient-remainder'; q: number; r: number; divisor: number }
  | { kind: 'choice'; options: string[]; correct: string }
  | { kind: 'text'; accept: string[]; normalize: 'lower' | 'digits' | 'none' }
  | { kind: 'phonetic'; digits: string }
  | { kind: 'estimate'; value: number; relTolerance: number }

export interface Exercise {
  id: string
  setId: string
  source: 'book' | 'generated'
  difficulty?: Difficulty
  prompt: Prompt
  answer: AnswerSpec
  solution?: { steps: string[] }
}

/** What a generator returns; id/setId/source are stamped by the caller. */
export type ExerciseDraft = Omit<Exercise, 'id' | 'setId' | 'source'>

export interface Rng {
  seed: number
  int(min: number, max: number): number
  pick<T>(xs: readonly T[]): T
  chance(p: number): boolean
  shuffle<T>(xs: readonly T[]): T[]
}

export interface GeneratedSetDef {
  id: string
  chapterId: string
  sectionId: string
  title: string
  description: string
  /** Book set ids this drill is the generated twin of. */
  coversBookSets?: string[]
  generate(difficulty: Difficulty, rng: Rng): ExerciseDraft
}

export interface BookSetRef {
  id: string
  chapterId: string
  sectionId: string
  title: string
}
