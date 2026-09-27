import type { BookSetData } from '@/exercises/bookSets'
import { big, sqBig } from './helpers'

// Prompts from figures ch8-f006, f022–f024, f032, f064/f065, f076; answers verified by
// computation and spot-checked against Answers images 00498–00524. Steps come from the
// chapter 8 route builders: four-digit squares round to the nearest thousand, five-digit
// squares split into thousands + rest, products factor, round-and-adjust, use the
// close-together method or split, and 5-by-5 uses the four partial products.
export const sets: BookSetData[] = [
  {
    id: 'ch8-four-digit-squares',
    problems: [
      sqBig(1, 1234),
      sqBig(2, 8639),
      sqBig(3, 5312),
      sqBig(4, 9863),
      sqBig(5, 3618),
      sqBig(6, 2971),
    ],
  },
  {
    id: 'ch8-3-by-2-multiplication',
    problems: [
      big(1, 858, 15),
      big(2, 796, 19),
      big(3, 148, 62),
      big(4, 773, 42),
      big(5, 906, 46),
      big(6, 952, 26),
      big(7, 411, 93),
      big(8, 967, 51),
      big(9, 484, 75),
      big(10, 126, 87),
      big(11, 157, 33),
      big(12, 616, 37),
      big(13, 841, 72),
      big(14, 361, 41),
      big(15, 218, 68),
      big(16, 538, 53),
      big(17, 817, 61),
      big(18, 668, 63),
      big(19, 499, 25),
      big(20, 144, 56),
      big(21, 281, 44),
      big(22, 988, 22),
      big(23, 383, 49),
      big(24, 589, 87),
      big(25, 286, 64),
      big(26, 853, 32),
      big(27, 878, 24),
      big(28, 423, 45),
      big(29, 154, 19),
      big(30, 834, 34),
      big(31, 545, 27),
      big(32, 653, 69),
      big(33, 216, 78),
      big(34, 822, 95),
    ],
  },
  {
    id: 'ch8-five-digit-squares',
    problems: [
      sqBig(1, 45795),
      sqBig(2, 21231),
      sqBig(3, 58324),
      sqBig(4, 62457),
      sqBig(5, 89854),
      sqBig(6, 76934),
    ],
  },
  {
    id: 'ch8-3-by-3-multiplication',
    problems: [
      big(1, 644, 286),
      big(2, 596, 167),
      big(3, 853, 325),
      big(4, 343, 226),
      big(5, 809, 527),
      big(6, 942, 879),
      big(7, 692, 644),
      big(8, 446, 176),
      big(9, 658, 468),
      big(10, 273, 138),
      big(11, 824, 206),
      big(12, 642, 249),
      big(13, 783, 589),
      big(14, 871, 926),
      big(15, 341, 715),
      big(16, 417, 298),
      big(17, 557, 756),
      big(18, 976, 878),
      big(19, 765, 350),
    ],
  },
  {
    id: 'ch8-5-by-5-multiplication',
    problems: [
      big(1, 65154, 19423),
      big(2, 34545, 27834),
      big(3, 69216, 78653),
      big(4, 95393, 81822),
    ],
  },
]
