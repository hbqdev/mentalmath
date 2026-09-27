import type { BookSetData } from '@/exercises/bookSets'
import { addF, decimalize, div, divF, divisible, mulF, rewrite, simplify, subF } from './helpers'

// Prompts from figures ch4-f008, f026, f055, f058/f059, f061, f065, f083/f084, f087, f097, f100;
// answers checked against Answers images 00474–00485.
export const sets: BookSetData[] = [
  {
    id: 'ch4-one-digit-division',
    problems: [div(1, 318, 9), div(2, 726, 5), div(3, 428, 7), div(4, 289, 8), div(5, 1328, 3), div(6, 2782, 4)],
  },
  {
    id: 'ch4-two-digit-division',
    problems: [div(1, 738, 17), div(2, 591, 24), div(3, 321, 79), div(4, 4268, 28), div(5, 7214, 11), div(6, 3074, 18)],
  },
  {
    id: 'ch4-decimalization',
    problems: [
      decimalize(1, 2, 5), decimalize(2, 4, 7), decimalize(3, 3, 8), decimalize(4, 9, 12),
      decimalize(5, 5, 12), decimalize(6, 6, 11), decimalize(7, 14, 24), decimalize(8, 13, 27),
      decimalize(9, 18, 48), decimalize(10, 10, 14), decimalize(11, 6, 32), decimalize(12, 19, 45),
    ],
  },
  {
    id: 'ch4-testing-for-divisibility',
    problems: [
      divisible(1, 53428, 2), divisible(2, 293, 2), divisible(3, 7241, 2), divisible(4, 9846, 2),
      divisible(5, 3932, 4), divisible(6, 67348, 4), divisible(7, 358, 4), divisible(8, 57929, 4),
      divisible(9, 59366, 8), divisible(10, 73488, 8), divisible(11, 248, 8), divisible(12, 6111, 8),
      divisible(13, 83671, 3), divisible(14, 94737, 3), divisible(15, 7359, 3), divisible(16, 3267486, 3),
      divisible(17, 5334, 6), divisible(18, 67386, 6), divisible(19, 248, 6), divisible(20, 5991, 6),
      divisible(21, 1234, 9), divisible(22, 8469, 9), divisible(23, 4425575, 9), divisible(24, 314159265, 9),
      divisible(25, 47830, 5), divisible(26, 43762, 5), divisible(27, 56785, 5), divisible(28, 37210, 5),
      divisible(29, 53867, 11), divisible(30, 4969, 11), divisible(31, 3828, 11), divisible(32, 941369, 11),
      divisible(33, 5784, 7), divisible(34, 7336, 7), divisible(35, 875, 7), divisible(36, 1183, 7),
      divisible(37, 694, 17), divisible(38, 629, 17), divisible(39, 8273, 17), divisible(40, 13855, 17),
    ],
  },
  {
    id: 'ch4-multiplying-fractions',
    problems: [mulF(1, [3, 5], [2, 7]), mulF(2, [4, 9], [11, 7]), mulF(3, [6, 7], [3, 4]), mulF(4, [9, 10], [7, 8])],
  },
  {
    id: 'ch4-dividing-fractions',
    problems: [divF(1, [2, 5], [1, 2]), divF(2, [1, 3], [6, 5]), divF(3, [2, 5], [3, 5])],
  },
  {
    id: 'ch4-simplifying-fractions',
    // Problems 1-4 ask for twelfths (the book's "express in twelfths"), 5-8 reduce.
    problems: [
      rewrite(1, 1, 3, 12), rewrite(2, 5, 6, 12), rewrite(3, 3, 4, 12), rewrite(4, 5, 2, 12),
      simplify(5, 8, 10), simplify(6, 6, 15), simplify(7, 24, 36), simplify(8, 20, 36),
    ],
  },
  {
    id: 'ch4-adding-fractions-equal-denominators',
    problems: [addF(1, [2, 9], [5, 9]), addF(2, [5, 12], [4, 12]), addF(3, [5, 18], [6, 18]), addF(4, [3, 10], [3, 10])],
  },
  {
    id: 'ch4-adding-fractions-unequal-denominators',
    problems: [
      addF(1, [1, 5], [1, 10]), addF(2, [1, 6], [5, 18]), addF(3, [1, 3], [1, 5]), addF(4, [2, 7], [5, 21]),
      addF(5, [2, 3], [3, 4]), addF(6, [3, 7], [3, 5]), addF(7, [2, 11], [5, 9]),
    ],
  },
  {
    id: 'ch4-subtracting-fractions',
    problems: [
      subF(1, [8, 11], [3, 11]), subF(2, [12, 7], [8, 7]), subF(3, [13, 18], [5, 18]), subF(4, [4, 5], [1, 15]),
      subF(5, [9, 10], [3, 5]), subF(6, [3, 4], [2, 3]), subF(7, [7, 8], [1, 16]), subF(8, [4, 7], [2, 5]), subF(9, [8, 9], [1, 2]),
    ],
  },
]
