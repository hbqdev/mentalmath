import type { BookSetData } from '@/exercises/bookSets'
import { colCents, columns, crissCross, paperSub, sqrtExact } from './helpers'

// Prompts from figures ch6-f047/f048, f050, f052, f053; answers from images 00494–00497.
export const sets: BookSetData[] = [
  {
    id: 'ch6-columns-of-numbers',
    problems: [
      columns(1, [672, 1367, 107, 7845, 358, 210, 916], ['Mod sums: 6, 8, 8, 6, 7, 3, 7 → 45 → 9', 'Total 11,475 has mod sum 9 ✓']),
      colCents(2, [21.56, 19.38, 211.02, 9.16, 26.17, 1.43], 288.72, ['Mod sums of the digits: 5, 3, 6, 7, 7, 3 → 31 → 4', 'Digits of 28872 → 27 → 9; the book\u2019s check uses the cents as digits']),
    ],
  },
  {
    id: 'ch6-subtracting-on-paper',
    problems: [
      paperSub(1, 75423, 46298, ['Mod sums: 3 − 2 = 1', '29,125 → 1 ✓']),
      paperSub(2, 876452, 593876, ['Mod sums: 5 − 2 = 3', '282,576 → 3 ✓']),
      paperSub(3, 3249202, 2903445, ['Mod sums: 4 − 9 → 4 + 9 − 9 = 4', '345,757 → 4 ✓']),
      paperSub(4, 45394358, 36472659, ['Mod sums: 5 − 6 → 5 + 9 − 6 = 8', '8,921,699 → 8 ✓']),
    ],
  },
  {
    id: 'ch6-square-root-guesstimation',
    problems: [
      sqrtExact(1, 15, 3.87, ['3² = 9, remainder 6 → 600', '68 × 8 = 544, remainder 56 → 5600', '767 × 7 = 5369', '√15 ≈ 3.87']),
      sqrtExact(2, 502, 22.4, ['2² = 4, remainder 1 → 102', '42 × 2 = 84, remainder 18 → 1800', '444 × 4 = 1776, remainder 24 → 2400', '4480 × 0 = 0', '√502 ≈ 22.40']),
      sqrtExact(3, 439.2, 20.95, ['2² = 4, remainder 0 → 039', '40 × 0 = 0 → 3920', '409 × 9 = 3681, remainder 239 → 23900', '4185 × 5 = 20925', '√439.2 ≈ 20.95']),
      sqrtExact(4, 361, 19, ['1² = 1, remainder 2 → 261', '29 × 9 = 261, remainder 0', '√361 = 19 exactly']),
    ],
  },
  {
    id: 'ch6-pencil-and-paper-multiplication',
    problems: [
      crissCross(1, 54, 37, ['Mod sums: 9 × 1 = 9', '1998 → 9 ✓']),
      crissCross(2, 273, 217, ['Mod sums: 3 × 1 = 3', '59,241 → 3 ✓']),
      crissCross(3, 725, 609, ['Mod sums: 5 × 6 = 30 → 3', '441,525 → 3 ✓']),
      crissCross(4, 3309, 2868, ['Mod sums: 6 × 6 = 36 → 9', '9,490,212 → 9 ✓']),
      crissCross(5, 52819, 47820, ['Mod sums: 7 × 3 = 21 → 3', '2,525,804,580 → 3 ✓']),
      crissCross(6, 3923759, 2674093, ['Mod sums: 3 × 4 = 12 → 3', '10,492,496,475,587 → 3 ✓']),
    ],
  },
]
