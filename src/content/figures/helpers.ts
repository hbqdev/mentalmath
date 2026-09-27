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
export type Part = string | [label: string, value: string, op?: string, note?: string]

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
    else
      lines.push({
        label: p[0],
        op: p[2],
        value: p[1],
        note: p[3],
        rule: typeof parts[i + 1] === 'string',
      })
  })
  return { kind: 'column', lines }
}

export const split = (
  base: string,
  d: string,
  up: string,
  down: string,
  result?: string,
  label?: string,
): FigureSpec => ({
  kind: 'split',
  base: `${base}²`,
  up,
  down,
  upLabel: `+${d}`,
  downLabel: `−${d}`,
  result,
  label,
})
export const cc = (top: string, bottom: string, links: Array<[number, number]>): FigureSpec => ({
  kind: 'crisscross',
  top: [...top],
  bottom: [...bottom],
  links,
})

export const row = (items: FigureSpec[], sep?: string): FigureSpec => ({ kind: 'row', items, sep })
export const stack = (items: FigureSpec[], indent = false): FigureSpec => ({
  kind: 'stack',
  items,
  indent,
})

export const text = (lines: string[], align?: 'left' | 'center'): FigureSpec => ({
  kind: 'text',
  lines,
  align,
})
export const inline = (t: string): FigureSpec => ({ kind: 'inline', text: t })
export const grid = (
  rows: string[][],
  align: 'left' | 'right' | 'center' = 'left',
): FigureSpec => ({ kind: 'grid', rows, align })
export const pre = (lines: string[], align?: 'left' | 'center'): FigureSpec => ({
  kind: 'pre',
  lines,
  align,
})

export type LdLine =
  string | [value: string, note: string] | { value: string; rule?: boolean; note?: string }

/** Long division; a line starting with "−" is ruled; `[value, note]` adds a note beside the line; an object sets the rule explicitly. */
export function ld(
  divisor: string,
  dividend: string,
  quotient: string,
  lines: LdLine[],
  answer?: string,
): FigureSpec {
  return {
    kind: 'longdiv',
    divisor,
    dividend,
    quotient,
    lines: lines.map((l) => {
      if (typeof l === 'string') return { value: l, rule: l.trim().startsWith('−') }
      if (Array.isArray(l)) return { value: l[0], rule: l[0].trim().startsWith('−'), note: l[1] }
      return { value: l.value, rule: l.rule ?? l.value.trim().startsWith('−'), note: l.note }
    }),
    answer,
  }
}

/** "a / op b / result" column. */
export const vert = (a: string, op: string, b: string, result: string): FigureSpec => ({
  kind: 'column',
  lines: [{ value: a }, { op, value: b, rule: true }, { value: result }],
})
/** Exact column ≈ rounded column [or another rounded column]. */
export const approx = (exact: FigureSpec, rounded: FigureSpec, alt?: FigureSpec): FigureSpec =>
  row([exact, text(['≈']), rounded, ...(alt ? [text(['or']), alt] : [])])

/** Multiplication with a note beside each operand: "396 (−4) / × 387 (−13)" (the close-together method). */
export function mul2(
  top: string,
  topNote: string,
  m: string,
  mNote: string,
  parts: Part[],
): FigureSpec {
  const spec = mul(top, m, null, parts)
  if (spec.kind === 'column') {
    spec.lines[0]!.note = topNote
    spec.lines[1]!.note = mNote
  }
  return spec
}
export const col = (lines: ColumnLine[], caption?: string): FigureSpec => ({
  kind: 'column',
  lines,
  caption,
})
