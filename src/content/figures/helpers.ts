import type { ColumnLine, FigureSpec } from './types'

/** "a / op b (note)" with a rule under the second line. */
export const pair = (a: string, op: string, b: string, note?: string): FigureSpec => ({
  kind: 'column',
  lines: [{ value: a }, { op, value: b, rule: true, note }],
})

export const chain = (steps: string[], notes?: Array<string | undefined>): FigureSpec => ({
  kind: 'chain',
  steps,
  notes,
})

/** A partial-products row: label, value and the sign in front of the value. A bare string is a subtotal or the result. */
export type Part = string | [label: string, value: string, op?: string]

/**
 * The book's multiplication layout: multiplicand over "× multiplier", then labelled partial
 * products, with a rule under any labelled line that is followed by a subtotal or the result.
 * `note` is the "(40 + 2)" breakdown; `noteBelow` prints it beside the multiplier instead.
 */
export function mul(
  top: string,
  m: string,
  note: string | null,
  parts: Part[],
  noteBelow = false,
): FigureSpec {
  const lines: ColumnLine[] = [
    { value: top, note: noteBelow ? undefined : (note ?? undefined) },
    { op: '×', value: m, rule: true, note: noteBelow ? (note ?? undefined) : undefined },
  ]
  parts.forEach((p, i) => {
    if (typeof p === 'string') lines.push({ value: p })
    else lines.push({ label: p[0], op: p[2], value: p[1], rule: typeof parts[i + 1] === 'string' })
  })
  return { kind: 'column', lines }
}

export const split = (
  base: string,
  d: string,
  up: string,
  down: string,
  result?: string,
): FigureSpec => ({
  kind: 'split',
  base: `${base}²`,
  up,
  down,
  upLabel: `+${d}`,
  downLabel: `−${d}`,
  result,
})

export const row = (items: FigureSpec[], sep?: string): FigureSpec => ({ kind: 'row', items, sep })
export const stack = (items: FigureSpec[], indent = false): FigureSpec => ({
  kind: 'stack',
  items,
  indent,
})
