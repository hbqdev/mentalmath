import { describe, expect, it } from 'vitest'
import { WEEKDAYS, dayOfWeek, daySteps, isValidDate } from '../dates'

const jsDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return WEEKDAYS[new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()]!
}

describe("dayOfWeek (the book's codes)", () => {
  it.each([
    ['2007-01-19', 'Friday'],
    ['2012-02-14', 'Tuesday'],
    ['1993-06-20', 'Sunday'],
    ['1983-09-01', 'Thursday'],
    ['1954-09-08', 'Wednesday'],
    ['1863-11-19', 'Thursday'],
    ['1776-07-04', 'Thursday'],
    ['2222-02-22', 'Friday'],
    ['2000-02-29', 'Tuesday'],
    ['2100-03-01', 'Monday'],
  ])('%s is a %s', (iso, day) => {
    expect(dayOfWeek(iso)).toBe(day)
    expect(jsDay(iso)).toBe(day)
  })

  it('agrees with the JavaScript calendar across four centuries', () => {
    let seed = 7
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
    for (let i = 0; i < 3000; i++) {
      const y = 1600 + Math.floor(rnd() * 800)
      const m = 1 + Math.floor(rnd() * 12)
      const dim = new Date(Date.UTC(y, m, 0)).getUTCDate()
      const d = 1 + Math.floor(rnd() * dim)
      const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      expect(dayOfWeek(iso), iso).toBe(jsDay(iso))
    }
  })

  it("explains the calculation in the book's terms", () => {
    const steps = daySteps('2007-01-19')
    expect(steps.join(' | ')).toMatch(/January.*6/)
    expect(steps.join(' | ')).toMatch(/2007.*year code/i)
    expect(steps.at(-1)).toContain('Friday')
  })

  it('rejects impossible dates', () => {
    expect(isValidDate('2468-06-31')).toBe(false)
    expect(isValidDate('2023-02-29')).toBe(false)
    expect(isValidDate('2024-02-29')).toBe(true)
  })
})
