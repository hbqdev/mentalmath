/**
 * Hand-typeset replacements for the EPUB's worked-example images.
 * Every number is a string exactly as printed in the book (commas, superscripts, "??").
 * Sizes are in em so the layouts scale with the prose.
 */

export interface ColumnLine {
  /** Text left of the operator gutter, e.g. "40 × 7 =", "Bill:". */
  label?: string
  /** Sign in the operator gutter: "+", "−", "×". */
  op?: string
  /** Right-aligned figure. */
  value: string
  /** Draw a rule under the operator and value of this line. */
  rule?: boolean
  /** Trailing annotation, e.g. "(40 + 2)" or "= Tuesday". */
  note?: string
}

export type FigureSpec =
  /** Vertical arithmetic, one grid: label | op | value | note. */
  | { kind: 'column'; lines: ColumnLine[] }
  /** "47 + 32 = 77 + 2 = 79" with an optional note under each equals sign. */
  | { kind: 'chain'; steps: string[]; notes?: Array<string | undefined> }
  /** Plain lines of text. */
  | { kind: 'text'; lines: string[]; align?: 'left' | 'center' }
  /** Header row plus body rows; `highlight` marks a body row; `grid` draws cell borders. */
  | { kind: 'table'; head: string[]; rows: string[][]; highlight?: number; grid?: boolean }
  /** The squaring diagram: base fans out to up/down, both fan in to the result. */
  | {
      kind: 'split'
      base: string
      up: string
      down: string
      upLabel: string
      downLabel: string
      result?: string
    }
  /** Multiplying by 11: "42 / × 11", then "4 _ 2" with the digit sum below, then "= 462". */
  | { kind: 'eleven'; n: string; sum: string; result: string }
  /** Items side by side, optionally separated by a word ("or"). */
  | { kind: 'row'; items: FigureSpec[]; sep?: string }
  /** Items stacked; `indent` steps each following item to the right (nested squares). */
  | { kind: 'stack'; items: FigureSpec[]; indent?: boolean }

export type FigureOverrides = Record<string, FigureSpec>
