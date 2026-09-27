import type { FigureOverrides } from './types'
import { chapter0 } from './chapter0'
import { chapter1 } from './chapter1'
import { chapter2 } from './chapter2'

export const overrides: FigureOverrides = {
  ...chapter0,
  ...chapter1,
  ...chapter2,
}

export function figureOverride(id: string) {
  return overrides[id]
}
