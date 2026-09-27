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
  /** A small carry digit written above the column (`value` holds the digit and its spacing). */
  carry?: boolean
}

/**
 * Strings in `text`, `pre`, `grid`, `chain` steps, `inline` and long-division answers accept a
 * small inline markup: `{3/4}` a stacked fraction, `~09~` an overline (repeating decimal or
 * radicand), `‹8›` an underline, `^N^` a superscript.
 */
export type FigureSpec =
  /** Vertical arithmetic, one grid: label | op | value | note; `label` is a small caption above. */
  | { kind: 'column'; lines: ColumnLine[]; caption?: string }
  /** "47 + 32 = 77 + 2 = 79" with an optional note under each equals sign. */
  | { kind: 'chain'; steps: string[]; notes?: Array<string | undefined> }
  /** Plain lines of text. */
  | { kind: 'text'; lines: string[]; align?: 'left' | 'center'; serif?: boolean }
  /** Header row plus body rows; `headSpan` gives a colspan per header cell; `highlight` marks a body row; `grid` draws cell borders. */
  | {
      kind: 'table'
      head: string[]
      headSpan?: number[]
      rows: string[][]
      highlight?: number
      grid?: boolean
      plain?: boolean
    }
  /** The squaring diagram: base fans out to up/down, both fan in to the result. */
  | {
      kind: 'split'
      base: string
      up: string
      down: string
      upLabel: string
      downLabel: string
      result?: string
      label?: string
    }
  /** Multiplying by 11: "42 / × 11", then "4 _ 2" with the digit sum below, then "= 462". */
  | { kind: 'eleven'; n: string; sum: string; result: string }
  /** Items side by side, optionally separated by a word ("or"). */
  | { kind: 'row'; items: FigureSpec[]; sep?: string }
  /** Items stacked; `indent` steps each following item to the right (nested squares). */
  | { kind: 'stack'; items: FigureSpec[]; indent?: boolean }
  /** Long division: quotient over the bracket, then the subtraction lines right-aligned under the dividend (trailing spaces shift a line left). */
  | {
      kind: 'longdiv'
      divisor: string
      dividend: string
      quotient: string
      lines: Array<{ value: string; rule?: boolean; note?: string }>
      answer?: string
    }
  /** Criss-cross multiplication: two rows of digits with the lines the method draws between them. */
  | { kind: 'crisscross'; top: string[]; bottom: string[]; links: Array<[number, number]> }
  /** Cells laid out on a grid, one string per cell (arrows such as → and ↓ are plain cells); rows may be ragged. */
  | { kind: 'grid'; rows: string[][]; align?: 'left' | 'right' | 'center' }
  /** Monospaced lines with their spacing kept (the square-root layout, phonetic digit rows). */
  | { kind: 'pre'; lines: string[]; align?: 'left' | 'center' }
  /** A glyph the book set inline in a sentence (a fraction, a mixed number). */
  | { kind: 'inline'; text: string }

export type FigureOverrides = Record<string, FigureSpec>
