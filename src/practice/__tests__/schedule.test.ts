import { describe, expect, it } from 'vitest'
import type { Attempt } from '@/app/progress'
import { dueTechniques, intervalDays } from '../schedule'

const at = (day: number, correct: number, total = 10): Attempt => ({
  at: new Date(Date.UTC(2026, 8, day, 9)).toISOString(),
  correct,
  total,
  seconds: 60,
  mode: 'generated',
})
const now = (day: number, hour = 12) => new Date(Date.UTC(2026, 8, day, hour))

describe('intervalDays', () => {
  it('comes back tomorrow after a weak score', () => {
    expect(intervalDays([at(1, 5)])).toBe(1)
    expect(intervalDays([at(1, 10), at(9, 6)])).toBe(1)
  })
  it('waits three days after a fair score', () => {
    expect(intervalDays([at(1, 7)])).toBe(3)
    expect(intervalDays([at(1, 10), at(9, 8)])).toBe(3)
  })
  it('doubles the previous gap after a strong score, between 3 and 30 days', () => {
    expect(intervalDays([at(1, 10)])).toBe(3)
    expect(intervalDays([at(1, 10), at(4, 9)])).toBe(6)
    expect(intervalDays([at(1, 10), at(13, 10)])).toBe(24)
    expect(intervalDays([at(1, 10), at(21, 10)])).toBe(30)
  })
})

describe('dueTechniques', () => {
  it('schedules only practiced techniques and lists the most overdue first', () => {
    const r = dueTechniques(
      {
        'gen1-two-digit-addition': { attempts: [at(1, 5)], best: 5 }, // due day 2
        'gen1-two-digit-subtraction': { attempts: [at(3, 8)], best: 8 }, // due day 6
        'gen2-2-by-1-multiplication': { attempts: [at(9, 10)], best: 10 }, // due day 12
      },
      now(10),
    )
    expect(r.due.map((d) => d.setId)).toEqual([
      'gen1-two-digit-addition',
      'gen1-two-digit-subtraction',
    ])
    expect(r.due[0]).toMatchObject({ chapterId: '1', title: 'Two-digit addition', overdueDays: 8 })
    expect(r.next?.setId).toBe('gen2-2-by-1-multiplication')
  })
  it('folds book-set attempts into their generated twin', () => {
    const r = dueTechniques({ 'ch1-two-digit-addition': { attempts: [at(1, 4)], best: 4 } }, now(5))
    expect(r.due.map((d) => d.setId)).toEqual(['gen1-two-digit-addition'])
  })
  it('is empty with nothing practiced, and caps the list', () => {
    expect(dueTechniques({}, now(10))).toEqual({ due: [], next: undefined })
    const many = Object.fromEntries(
      ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((k, i) => [
        `gen1-two-digit-${k}`,
        { attempts: [at(1 + i, 3)], best: 3 },
      ]),
    )
    expect(dueTechniques(many, now(20), 5).due).toHaveLength(5)
  })
  it('nothing is due on the day of practice', () => {
    const r = dueTechniques(
      { 'gen1-two-digit-addition': { attempts: [at(10, 2)], best: 2 } },
      now(10, 20),
    )
    expect(r.due).toEqual([])
    expect(r.next?.setId).toBe('gen1-two-digit-addition')
  })
})
