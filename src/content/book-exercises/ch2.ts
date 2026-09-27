import type { BookSetData } from '@/exercises/bookSets'
import { mul, sq } from './helpers'

// Problems from the exercise figures (ch2-f012, ch2-f027, ch2-f038); answers and steps checked
// against Answers images 00456–00463. Steps follow the book's partial-product and
// round-and-adjust layouts.
export const sets: BookSetData[] = [
  {
    id: 'ch2-2-by-1-multiplication',
    problems: [
      mul(1, 82, 9), mul(2, 43, 7), mul(3, 67, 5), mul(4, 71, 3), mul(5, 93, 8),
      mul(6, 49, 9, ['50 × 9 = 450', '1 × 9 = 9', '450 − 9 = 441']),
      mul(7, 28, 4), mul(8, 53, 5), mul(9, 84, 5), mul(10, 58, 6),
      mul(11, 97, 4), mul(12, 78, 2), mul(13, 96, 9), mul(14, 75, 4), mul(15, 57, 7),
      mul(16, 37, 6), mul(17, 46, 2), mul(18, 76, 8), mul(19, 29, 3), mul(20, 64, 8),
    ],
  },
  {
    id: 'ch2-3-by-1-multiplication',
    problems: [
      mul(1, 431, 6), mul(2, 637, 5), mul(3, 862, 4), mul(4, 957, 6), mul(5, 927, 7), mul(6, 728, 2),
      mul(7, 328, 6), mul(8, 529, 9), mul(9, 807, 9), mul(10, 587, 4), mul(11, 184, 7), mul(12, 214, 8),
      mul(13, 757, 8), mul(14, 259, 7),
      mul(15, 297, 8, ['300 × 8 = 2400', '3 × 8 = 24', '2400 − 24 = 2376']),
      mul(16, 751, 9), mul(17, 457, 7), mul(18, 339, 8), mul(19, 134, 8), mul(20, 611, 3),
      mul(21, 578, 9), mul(22, 247, 5), mul(23, 188, 6), mul(24, 968, 6),
      mul(25, 499, 9, ['500 × 9 = 4500', '1 × 9 = 9', '4500 − 9 = 4491']),
      mul(26, 670, 4), mul(27, 429, 3), mul(28, 862, 5), mul(29, 285, 6), mul(30, 488, 9),
      mul(31, 693, 6), mul(32, 722, 9), mul(33, 457, 9), mul(34, 767, 3), mul(35, 312, 9), mul(36, 691, 3),
    ],
  },
  {
    id: 'ch2-two-digit-squares',
    problems: [
      sq(1, 14), sq(2, 27), sq(3, 65), sq(4, 89), sq(5, 98), sq(6, 31), sq(7, 41), sq(8, 59), sq(9, 26), sq(10, 53),
      sq(11, 21), sq(12, 64), sq(13, 42), sq(14, 55), sq(15, 75), sq(16, 45), sq(17, 84), sq(18, 67), sq(19, 103), sq(20, 208),
    ],
  },
]
