import { describe, expect, it } from 'vitest'
import { createSession } from '../session'
import type { Exercise } from '../types'

const ex = (i: number, value: number): Exercise => ({
  id: `e${i}`,
  setId: 's',
  source: 'generated',
  prompt: { kind: 'binary', a: value, b: 0, op: '+' },
  answer: { kind: 'integer', value },
})

describe('createSession', () => {
  it('walks answering → feedback → next through every exercise and ends done', () => {
    let t = 1000
    const s = createSession([ex(1, 5), ex(2, 7), ex(3, 9)], { now: () => t })
    expect(s.state().phase).toBe('answering')
    expect(s.state().total).toBe(3)
    expect(s.submit('5').correct).toBe(true)
    expect(s.state().phase).toBe('feedback')
    t = 1500
    s.next()
    expect(s.state().index).toBe(1)
    expect(s.submit('0').correct).toBe(false)
    expect(s.state().lastResult).toMatchObject({ correct: false, input: '0', shown: '7' })
    s.next()
    s.submit('9')
    s.next()
    const st = s.state()
    expect(st.phase).toBe('done')
    expect(st.current).toBeNull()
    expect(st.correct).toBe(2)
    expect(st.history.map((h) => h.correct)).toEqual([true, false, true])
    expect(st.finishedAt).toBe(1500)
  })

  it('ignores a second submit and an empty submit does not advance', () => {
    const s = createSession([ex(1, 5)])
    expect(s.submit('   ').correct).toBe(false)
    expect(s.state().phase).toBe('answering')
    expect(s.submit('5').correct).toBe(true)
    expect(s.submit('4').correct).toBe(true) // returns the recorded result, does not re-grade
    expect(s.state().correct).toBe(1)
  })

  it('ignores next while answering and freezes the timer when done', () => {
    let t = 0
    const s = createSession([ex(1, 1)], { now: () => t })
    s.next()
    expect(s.state().index).toBe(0)
    t = 4000
    expect(s.elapsedMs()).toBe(4000)
    s.submit('1')
    s.next()
    t = 9000
    expect(s.elapsedMs()).toBe(4000)
  })

  it('records per-exercise time', () => {
    let t = 0
    const s = createSession([ex(1, 1), ex(2, 2)], { now: () => t })
    t = 1200
    s.submit('1')
    s.next()
    t = 5000
    s.submit('2')
    expect(s.state().history.map((h) => h.ms)).toEqual([1200, 3800])
  })

  it('handles an empty exercise list by being done immediately', () => {
    const s = createSession([])
    expect(s.state().phase).toBe('done')
    expect(s.state().total).toBe(0)
  })
})
