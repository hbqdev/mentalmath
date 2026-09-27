import type { BookSetData } from '@/exercises/bookSets'
import { dateProblem, noSuchDate } from './helpers'

// "Determine the days of the week for the following dates" (chapter 9 text after figure ch9-f018).
export const sets: BookSetData[] = [
  {
    id: 'ch9-a-day-for-any-date',
    problems: [
      dateProblem(1, '2007-01-19'),
      dateProblem(2, '2012-02-14'),
      dateProblem(3, '1993-06-20'),
      dateProblem(4, '1983-09-01'),
      dateProblem(5, '1954-09-08'),
      dateProblem(6, '1863-11-19'),
      dateProblem(7, '1776-07-04'),
      dateProblem(8, '2222-02-22'),
      noSuchDate(9, 'June 31, 2468'),
      dateProblem(10, '2358-01-01'),
    ],
  },
]
