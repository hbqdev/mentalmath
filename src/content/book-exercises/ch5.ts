import type { BookSetData } from '@/exercises/bookSets'
import { estAdd, estCol, estDiv, estMul, estSqrt, estSub, money, textInt } from './helpers'

// Prompts from figures ch5-f046/f047, f049, f051, f053, f055 and the everyday-math text;
// answers from Answers images 00486–00493 (exact values and the book's guesstimates).
export const sets: BookSetData[] = [
  {
    id: 'ch5-addition-guesstimation',
    problems: [
      estAdd(1, 1479, 1105, ['1479 ≈ 1500, 1105 ≈ 1100', '1500 + 1100 = 2600 (or 1480 + 1100 = 2580)', 'Exact: 2584']),
      estAdd(2, 57293, 37421, ['57,000 + 37,000 = 94,000 (or 57,300 + 37,400 = 94,700)', 'Exact: 94714']),
      estAdd(3, 312025, 79419, ['310,000 + 80,000 = 390,000 (or 312,000 + 79,000 = 391,000)', 'Exact: 391444']),
      estAdd(4, 8971011, 4016367, ['9 million + 4 million = 13 million (or 8.97 + 4.02 = 12.99 million)', 'Exact: 12987378']),
      estCol(5, [2.67, 1.95, 7.35, 9.21, 0.49, 11.21, 0.12, 6.14, 8.31], 47.35, ['Round each to the nearest 50¢: 2.50, 2.00, 7.50, 9.00, 0.50, 11.00, 0.00, 6.00, 8.50', 'Guesstimate $47.00', 'Exact: $47.35']),
    ],
  },
  {
    id: 'ch5-subtraction-guesstimation',
    problems: [
      estSub(1, 4926, 1659, ['4900 − 1700 = 3200', 'Exact: 3267']),
      estSub(2, 67221, 9874, ['67,000 − 10,000 = 57,000 (or 67,200 − 9,900 = 57,300)', 'Exact: 57347']),
      estSub(3, 526978, 42009, ['530,000 − 40,000 = 490,000 (or 527,000 − 42,000 = 485,000)', 'Exact: 484969']),
      estSub(4, 8349241, 6103839, ['8.3 million − 6.1 million = 2.2 million (or 8.35 − 6.10 = 2.25 million)', 'Exact: 2245402']),
    ],
  },
  {
    id: 'ch5-division-guesstimation',
    problems: [
      estDiv(1, 4379, 7, 625.57, ['4400 ÷ 7 ≈ 630', 'Exact: 625.57']),
      estDiv(2, 23958, 5, 4791.6, ['24,000 ÷ 5 = 4800', 'Exact: 4791.6']),
      estDiv(3, 549213, 13, 42247.15, ['550,000 ÷ 13 ≈ 42,000', 'Exact: 42247.15']),
      estDiv(4, 5102357, 289, 17655.21, ['5,100,000 ÷ 300 ≈ 51,000 ÷ 3 = 17,000', 'Exact: 17655.21']),
      estDiv(5, 8329483, 203637, 40.9, ['8,000,000 ÷ 200,000 = 40', 'Exact: 40.9']),
    ],
  },
  {
    id: 'ch5-multiplication-guesstimation',
    problems: [
      estMul(1, 98, 27, ['100 × 25 = 2500', 'Exact: 2646']),
      estMul(2, 76, 42, ['78 × 40 = 3120', 'Exact: 3192']),
      estMul(3, 88, 88, ['90 × 86 = 7740', 'Exact: 7744']),
      estMul(4, 539, 17, ['540 × 17 = 9180', 'Exact: 9163']),
      estMul(5, 312, 98, ['310 × 100 = 31,000', 'Exact: 30576']),
      estMul(6, 639, 107, ['646 × 100 = 64,600 (or 640 × 110 = 70,400)', 'Exact: 68373']),
      estMul(7, 428, 313, ['430 × 310 = 133,300', 'Exact: 133964']),
      estMul(8, 51276, 489, ['51,000 × 490 = 24,990,000', 'Exact: 25073964']),
      estMul(9, 104972, 11201, ['105,000 × 11,000 = 1155 million ≈ 1.155 billion', 'Exact: 1175791372']),
      estMul(10, 5462741, 203413, ['5,500,000 × 200,000 = 1100 billion ≈ 1.1 trillion', 'Exact: 1111192535033']),
    ],
  },
  {
    id: 'ch5-square-root-guesstimation',
    problems: [
      estSqrt(1, 17, 4.12, ['Guess 4: 17 ÷ 4 = 4.2', 'Average (4 + 4.2) ÷ 2 = 4.1', 'Exact: 4.12']),
      estSqrt(2, 35, 5.91, ['Guess 6: 35 ÷ 6 = 5.8', 'Average (6 + 5.8) ÷ 2 = 5.9', 'Exact: 5.91']),
      estSqrt(3, 163, 12.76, ['Guess 10: 163 ÷ 10 = 16.3', 'Average (10 + 16.3) ÷ 2 = 13.15', 'Exact: 12.76']),
      estSqrt(4, 4279, 65.41, ['Guess 60: 4279 ÷ 60 ≈ 71', 'Average (60 + 71) ÷ 2 = 65.5', 'Exact: 65.41']),
      estSqrt(5, 8039, 89.66, ['Guess 90: 8039 ÷ 90 ≈ 89', 'Average (90 + 89) ÷ 2 = 89.5', 'Exact: 89.66']),
    ],
  },
  {
    id: 'ch5-everyday-math',
    problems: [
      money(1, 'Compute 15% of $88.', 13.2, ['10% of $88 = $8.80', 'Half of that = $4.40', '$8.80 + $4.40 = $13.20']),
      money(2, 'Compute 15% of $53.', 7.95, ['10% of $53 = $5.30', 'Half of that = $2.65', '$5.30 + $2.65 = $7.95']),
      money(3, 'Compute 25% of $74.', 18.5, ['$74 ÷ 2 = $37', '$37 ÷ 2 = $18.50']),
      textInt(4, 'How long does it take an annual interest rate of 10% to double your money? (years)', 7, ['Rule of 70', '70 ÷ 10 = 7 years']),
      textInt(5, 'How long does it take an annual interest rate of 6% to double your money? (years)', 12, ['Rule of 70: 70 ÷ 6 = 11.67', 'About 12 years']),
      textInt(6, 'How long does it take an annual interest rate of 7% to triple your money? (years)', 16, ['Rule of 110: 110 ÷ 7 = 15.7', 'About 16 years']),
      textInt(7, 'How long does it take an annual interest rate of 7% to quadruple your money? (years)', 20, ['70 ÷ 7 = 10 years to double', 'Another 10 to double again: 20 years']),
      money(8, 'Estimate the monthly payment to repay a loan of $100,000 at 9% over ten years.', 1267, ['i = 0.09 ÷ 12 = 0.0075, n = 120', 'M = 100,000 × 0.0075 × 1.0075¹²⁰ ÷ (1.0075¹²⁰ − 1)', '= 750 × 2.451 ÷ 1.451 ≈ $1267'], 5),
      money(9, 'Estimate the monthly payment to repay a loan of $30,000 at 5% over four years.', 693, ['i = 0.05 ÷ 12 = 0.004167, n = 48', 'M = 30,000 × 0.004167 × 1.004167⁴⁸ ÷ (1.004167⁴⁸ − 1)', '= 125 × 1.22 ÷ 0.22 ≈ $693'], 5),
    ],
  },
]
