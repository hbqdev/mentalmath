import { describe, expect, it } from 'vitest'
import { bestKey, describeTimed, improves, parseTimed, timedQuery } from '../timing'

describe('parseTimed', () => {
  it('is null for an ordinary set', () => {
    expect(parseTimed({})).toBeNull()
    expect(parseTimed({ mode: 'generated', seed: '4' })).toBeNull()
  })
  it('reads a sprint length and a shot clock', () => {
    expect(parseTimed({ len: '2m' })).toEqual({ sprint: 120, shot: 0 })
    expect(parseTimed({ len: '1m', shot: '10' })).toEqual({ sprint: 60, shot: 10 })
    expect(parseTimed({ shot: '30' })).toEqual({ sprint: undefined, shot: 30 })
  })
  it('ignores values it does not know and keeps the legacy stopwatch flag', () => {
    expect(parseTimed({ len: '9m', shot: '7' })).toBeNull()
    expect(parseTimed({ timed: '1' })).toEqual({ sprint: undefined, shot: 0 })
  })
  it('round-trips through the query', () => {
    expect(timedQuery({ sprint: 300, shot: 20 })).toEqual({ len: '5m', shot: '20' })
    expect(timedQuery({ sprint: undefined, shot: 0 })).toEqual({ timed: '1' })
    expect(parseTimed(timedQuery({ sprint: 60, shot: 60 }))).toEqual({ sprint: 60, shot: 60 })
  })
})

describe('bests', () => {
  it('keys a clean ten by time and a sprint by length', () => {
    expect(bestKey({ sprint: undefined, shot: 0 })).toBe('clean10')
    expect(bestKey({ sprint: 120, shot: 10 })).toBe('sprint120')
  })
  it('a clean ten improves only when every answer was right and it was faster', () => {
    const key = 'clean10'
    expect(improves(key, undefined, { correct: 10, total: 10, seconds: 80 })).toBe(80)
    expect(improves(key, 80, { correct: 10, total: 10, seconds: 70 })).toBe(70)
    expect(improves(key, 80, { correct: 10, total: 10, seconds: 90 })).toBeUndefined()
    expect(improves(key, undefined, { correct: 9, total: 10, seconds: 20 })).toBeUndefined()
  })
  it('a sprint improves when more were right', () => {
    expect(improves('sprint60', undefined, { correct: 7, total: 9, seconds: 60 })).toBe(7)
    expect(improves('sprint60', 7, { correct: 7, total: 8, seconds: 60 })).toBeUndefined()
    expect(improves('sprint60', 7, { correct: 8, total: 12, seconds: 60 })).toBe(8)
  })
  it('describes the options in words', () => {
    expect(describeTimed({ sprint: 120, shot: 10 })).toBe('2 min sprint · 10 s per problem')
    expect(describeTimed({ sprint: undefined, shot: 30 })).toBe('10 problems · 30 s per problem')
    expect(describeTimed({ sprint: 60, shot: 0 })).toBe('1 min sprint')
  })
})
