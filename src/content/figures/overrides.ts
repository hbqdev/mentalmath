import type { FigureOverrides } from './types'
import { chapter0 } from './chapter0'

export const overrides: FigureOverrides = {
  ...chapter0,
}

export function figureOverride(id: string) {
  return overrides[id]
}
