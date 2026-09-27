import type { BookSetData } from '@/exercises/bookSets'
import { cube, mulAdd, mulFactor, mulSub, sq, times11 } from './helpers'

// Prompts from figures ch3-f012, f014, f023, f027, f030–f032, f041, f042; answers from the
// Answers section (images 00464–00473, text for factoring and cubes).
export const sets: BookSetData[] = [
  {
    id: 'ch3-multiplying-by-11',
    problems: [times11(1, 35), times11(2, 48), times11(3, 94)],
  },
  {
    id: 'ch3-2-by-2-addition-method',
    problems: [
      mulAdd(1, 31, 41), mulAdd(2, 27, 18), mulAdd(3, 59, 26), mulAdd(4, 53, 58), mulAdd(5, 77, 43),
      mulAdd(6, 23, 84), mulAdd(7, 62, 94), mulAdd(8, 88, 76), mulAdd(9, 92, 35),
      times11(10, 34), times11(11, 85),
    ],
  },
  {
    id: 'ch3-2-by-2-subtraction-method',
    problems: [
      mulSub(1, 29, 45), mulSub(2, 98, 43), mulSub(3, 47, 59), mulSub(4, 68, 38), mulSub(5, 96, 29),
      mulSub(6, 79, 54), mulSub(7, 37, 19), mulSub(8, 87, 22), mulSub(9, 85, 38), mulSub(10, 57, 39), mulSub(11, 88, 49),
    ],
  },
  {
    id: 'ch3-2-by-2-factoring-method',
    problems: [
      mulFactor(1, 27, 14, [7, 2]), mulFactor(2, 86, 28, [7, 4]), mulFactor(3, 57, 14, [7, 2]), mulFactor(4, 81, 48, [8, 6]),
      mulFactor(5, 29, 56, [7, 8]), mulFactor(6, 83, 18, [6, 3]), mulFactor(7, 17, 72, [9, 8]), mulFactor(8, 85, 42, [6, 7]),
      mulFactor(9, 33, 16, [8, 2]), mulFactor(10, 62, 77, [11, 7]), mulFactor(11, 45, 36, [6, 6]), mulFactor(12, 37, 48, [8, 6]),
    ],
  },
  {
    id: 'ch3-2-by-2-general-multiplication',
    problems: [
      mulSub(1, 53, 39), mulAdd(2, 81, 57), mulFactor(3, 73, 18, [9, 2]), mulSub(4, 89, 55), mulFactor(5, 77, 36, [4, 9]),
      mulAdd(6, 92, 53), sq(7, 87), mulSub(8, 67, 58), mulFactor(9, 37, 56, [8, 7]), mulAdd(10, 59, 21),
      mulFactor(11, 37, 72, [9, 8]), mulAdd(12, 57, 73), mulFactor(13, 38, 63, [9, 7]), mulAdd(14, 43, 76), mulFactor(15, 43, 75, [5, 15]),
      mulAdd(16, 74, 62), mulAdd(17, 61, 37), mulFactor(18, 41, 36, [6, 6]), mulFactor(19, 54, 53, [9, 6]), sq(20, 53),
      mulAdd(21, 83, 58), mulAdd(22, 91, 46), mulAdd(23, 52, 47), mulSub(24, 29, 26), mulFactor(25, 41, 15, [5, 3]),
      mulSub(26, 65, 19), mulFactor(27, 34, 27, [9, 3]), mulSub(28, 69, 78), mulFactor(29, 95, 81, [9, 9]), mulAdd(30, 65, 47),
      mulSub(31, 65, 69), mulAdd(32, 95, 26), mulAdd(33, 41, 93),
    ],
  },
  {
    id: 'ch3-three-digit-squares',
    problems: [sq(1, 409), sq(2, 805), sq(3, 217), sq(4, 896), sq(5, 345), sq(6, 346), sq(7, 276), sq(8, 682), sq(9, 431), sq(10, 781), sq(11, 975)],
  },
  {
    id: 'ch3-two-digit-cubes',
    problems: [
      cube(1, 12), cube(2, 17), cube(3, 21), cube(4, 28), cube(5, 33), cube(6, 39), cube(7, 40), cube(8, 44),
      cube(9, 52), cube(10, 56), cube(11, 65), cube(12, 71), cube(13, 78), cube(14, 85), cube(15, 87), cube(16, 99),
    ],
  },
]

