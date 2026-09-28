import { beforeEach, describe, expect, it } from 'vitest'
import { createSession } from '@/exercises/session'
import { clearRun, loadRun, runKey, saveRun } from '../resume'
import type { Exercise } from '@/exercises/types'

const ex = (i: number, value: number): Exercise => ({
  id: `t-${i}`,
  setId: 't',
  source: 'generated',
  difficulty: 'easy',
  prompt: { kind: 'binary', a: value, b: 0, op: '+' },
  answer: { kind: 'integer', value },
})
const exercises = [ex(0, 5), ex(1, 7), ex(2, 9)]

beforeEach(() => sessionStorage.clear())

describe('resume', () => {
  it('keys a run by set and generation parameters', () => {
    expect(runKey('gen1-x', { mode: 'generated', seed: '42', difficulty: 'hard' })).toBe(
      'gen1-x?mode=generated&seed=42&difficulty=hard',
    )
    expect(runKey('gen1-x', {})).toBe('gen1-x?mode=&seed=&difficulty=')
  })

  it('saves answers as they are given and clears when the run finishes', () => {
    const s = createSession(exercises, { now: () => 1000 })
    s.submit('5')
    s.next()
    saveRun('k', s.state(), 4000)
    expect(loadRun('k')).toMatchObject({ inputs: ['5'], elapsedMs: 4000 })
    s.submit('0')
    s.next()
    s.submit('9')
    s.next()
    saveRun('k', s.state(), 9000)
    expect(loadRun('k')).toBeNull()
  })

  it('replays saved answers into a new session and keeps the elapsed time', () => {
    let t = 50_000
    const s = createSession(exercises, {
      now: () => t,
      resume: { inputs: ['5', '0'], elapsedMs: 12_000 },
    })
    expect(s.state().index).toBe(2)
    expect(s.state().phase).toBe('answering')
    expect(s.state().correct).toBe(1)
    expect(s.state().history.map((h) => h.input)).toEqual(['5', '0'])
    t += 3000
    expect(s.elapsedMs()).toBe(15_000)
    s.submit('9')
    expect(s.state().correct).toBe(2)
  })

  it('ignores junk in storage and clears on demand', () => {
    sessionStorage.setItem('mentalmath.run:k', '{not json')
    expect(loadRun('k')).toBeNull()
    sessionStorage.setItem('mentalmath.run:k', JSON.stringify({ inputs: [] }))
    expect(loadRun('k')).toBeNull()
    sessionStorage.setItem('mentalmath.run:k', JSON.stringify({ inputs: ['1'], elapsedMs: 1 }))
    clearRun('k')
    expect(loadRun('k')).toBeNull()
  })
})
