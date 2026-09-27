import type { FigureOverrides, FigureSpec } from './types'
import { col, grid, inline, row, text } from './helpers'

const magic = (rows: number[][], total: number): FigureSpec =>
  row([
    { kind: 'table', grid: true, plain: true, head: [], rows: rows.map((r) => r.map(String)) },
    text([`= ${total}`]),
  ])

// Year codes 2000–2099: (yy + ⌊yy/4⌋) mod 7, in four column pairs as the book prints them,
// as two tables so they sit side by side on a desktop and stack on a phone.
const yearTable = (bases: number[]): FigureSpec => ({
  kind: 'table',
  head: bases.flatMap(() => ['Year', 'Code']),
  rows: Array.from({ length: 25 }, (_, i) =>
    bases.flatMap((base) => {
      const yy = base + i
      return [String(2000 + yy), String((yy + Math.floor(yy / 4)) % 7)]
    }),
  ),
})
const yearCodes: FigureSpec = row([yearTable([0, 25]), yearTable([50, 75])])

// Chapter 9, "Presto-digit-ation: The Art of Mathematical Magic".
export const chapter9: FigureOverrides = {
  'ch9-f001': col([
    { value: '851' },
    { op: '−', value: '158', rule: true },
    { value: '693' },
    { op: '+', value: '396', rule: true },
    { value: '1089' },
  ]),
  'ch9-f002': text(
    ['100a + 10b + c − (100c + 10b + a)', '= 100(a − c) + (c − a)', '= 99(a − c)'],
    'left',
  ),
  'ch9-f003': grid(
    [
      ['1', '‹9›'],
      ['2', '‹2›'],
      ['3', '‹11›'],
      ['4', '‹13›'],
      ['5', '‹24›'],
      ['6', '‹37›'],
      ['7', '‹61›'],
      ['8', '‹98›'],
      ['9', '‹159›'],
      ['10', '‹257›'],
    ],
    'right',
  ),
  'ch9-f004': inline('{257/159}'),
  'ch9-f005': grid(
    [
      ['1', '‹x›'],
      ['2', '‹y›'],
      ['3', '‹x + y›'],
      ['4', '‹x + 2y›'],
      ['5', '‹2x + 3y›'],
      ['6', '‹3x + 5y›'],
      ['7', '‹5x + 8y›'],
      ['8', '‹8x + 13y›'],
      ['9', '‹13x + 21y›'],
      ['10', '‹21x + 34y›'],
      ['Total:', '‹55x + 88y›'],
    ],
    'right',
  ),
  'ch9-f006': text(['{a/b} < {a + c/b + d} < {c/d}']),
  'ch9-f007': text(['1.615 . . . = {21x/13x} < {21x + 34y/13x + 21y} < {34y/21y} = 1.619 . . .']),
  'ch9-f008': text(['{1 + √5/2} ≈ 1.6180339887 . . .']),
  'ch9-f009': magic(
    [
      [8, 11, 14, 1],
      [13, 2, 7, 12],
      [3, 16, 9, 6],
      [10, 5, 4, 15],
    ],
    34,
  ),
  'ch9-f010': magic(
    [
      [16, 19, 23, 9],
      [22, 10, 15, 20],
      [11, 25, 17, 14],
      [18, 13, 12, 24],
    ],
    67,
  ),
  'ch9-f011': magic(
    [
      [20, 23, 26, 13],
      [25, 14, 19, 24],
      [15, 28, 21, 18],
      [22, 17, 16, 27],
    ],
    82,
  ),
  'ch9-f012': magic(
    [
      [20, 23, 29, 13],
      [28, 14, 19, 24],
      [15, 31, 21, 18],
      [22, 17, 16, 30],
    ],
    85,
  ),
  'ch9-f013': magic(
    [
      [4, 9, 2],
      [3, 5, 7],
      [8, 1, 6],
    ],
    15,
  ),
  'ch9-f014': grid(
    [
      ['', 'A', 'B', 'C'],
      ['', '8', '9', '5'],
      ['', '4', '5', '3'],
      ['', '2', '2', '4'],
      ['', '‹6›', '‹7›', '‹7›'],
      ['2', '2', '4', '7'],
    ],
    'right',
  ),
  'ch9-f015': inline('{61/4}'),
  'ch9-f016': yearCodes,
  'ch9-f017': inline('{98/4}'),
}
