import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEY, defaultProgress, disposeProgressStore, useProgress } from '../progress'

beforeEach(() => {
  localStorage.clear()
  disposeProgressStore()
})

describe('useProgress', () => {
  it('starts from defaults when storage is empty', () => {
    const p = useProgress()
    expect(p.state.value).toEqual(defaultProgress())
  })

  it('merges defaults over a partial or older stored shape', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings: { theme: 'dark' } }))
    const p = useProgress()
    expect(p.state.value.settings.theme).toBe('dark')
    expect(p.state.value.settings.fontSize).toBe(18)
    expect(p.state.value.settings.font).toBe('serif')
    expect(p.state.value.reading).toEqual({})
  })

  it('falls back to defaults when stored JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    const p = useProgress()
    expect(p.state.value.settings.theme).toBe('system')
  })

  it('records visited sections once and tracks the last one', () => {
    const p = useProgress()
    p.markVisited('1', 'two-digit-addition')
    p.markVisited('1', 'two-digit-addition')
    p.markVisited('1', 'three-digit-addition')
    expect(p.isVisited('1', 'two-digit-addition')).toBe(true)
    expect(p.state.value.reading['1']?.visited).toEqual([
      'two-digit-addition',
      'three-digit-addition',
    ])
    expect(p.lastSection('1')).toBe('three-digit-addition')
    expect(p.chapterCompletion('1', 4)).toBeCloseTo(0.5)
  })

  it('leaves every set open by default and gates on reading only when asked', () => {
    const p = useProgress()
    expect(p.isUnlocked('0', 'instant-multiplication')).toBe(true)
    p.state.value.settings.lockUntilRead = true
    expect(p.isUnlocked('0', 'instant-multiplication')).toBe(false)
    p.markVisited('0', 'instant-multiplication')
    expect(p.isUnlocked('0', 'instant-multiplication')).toBe(true)
    expect(p.isUnlocked('0', 'squaring-and-more')).toBe(false)
  })

  it('keeps best score and attempt history per set', () => {
    const p = useProgress()
    p.recordAttempt('ch1-two-digit-addition', {
      at: 'a',
      correct: 6,
      total: 10,
      seconds: 90,
      mode: 'book',
    })
    p.recordAttempt('ch1-two-digit-addition', {
      at: 'b',
      correct: 9,
      total: 10,
      seconds: 80,
      mode: 'book',
    })
    p.recordAttempt('ch1-two-digit-addition', {
      at: 'c',
      correct: 7,
      total: 10,
      seconds: 70,
      mode: 'book',
    })
    expect(p.bestScore('ch1-two-digit-addition')).toBe(9)
    expect(p.state.value.practice['ch1-two-digit-addition']?.attempts).toHaveLength(3)
  })

  it('increments the streak once per local day and resets after a gap', () => {
    const p = useProgress()
    const d1 = new Date(2026, 8, 27, 9)
    const d1b = new Date(2026, 8, 27, 22)
    const d2 = new Date(2026, 8, 28, 8)
    const d4 = new Date(2026, 8, 30, 8)
    p.touchStreak(d1)
    expect(p.state.value.streak).toEqual({ current: 1, lastActiveDay: '2026-09-27' })
    p.touchStreak(d1b)
    expect(p.state.value.streak.current).toBe(1)
    p.touchStreak(d2)
    expect(p.state.value.streak.current).toBe(2)
    p.touchStreak(d4)
    expect(p.state.value.streak).toEqual({ current: 1, lastActiveDay: '2026-09-30' })
  })

  it('markVisited on a new section also touches the streak', () => {
    const p = useProgress()
    p.markVisited('2', 'overview', new Date(2026, 8, 27, 9))
    expect(p.state.value.streak.current).toBe(1)
  })

  it('persists to localStorage under the versioned key', async () => {
    const p = useProgress()
    p.markVisited('3', 'overview')
    await Promise.resolve()
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(raw.reading['3'].visited).toEqual(['overview'])
  })
})

describe('useProgress with malformed stored entries', () => {
  it('normalises reading and practice entries missing fields instead of throwing', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ reading: { '1': { lastSection: 'x' } }, practice: { s: { best: 3 } } }),
    )
    disposeProgressStore()
    const p = useProgress()
    expect(p.isVisited('1', 'x')).toBe(false)
    expect(p.state.value.reading['1']?.updatedAt).toBe('')
    expect(() => p.markVisited('1', 'x')).not.toThrow()
    expect(p.state.value.reading['1']?.visited).toEqual(['x'])
    expect(p.state.value.practice['s']?.attempts).toEqual([])
    expect(p.bestScore('s')).toBe(3)
  })

  it('exports a backup and restores it, rejecting foreign files', () => {
    const p = useProgress()
    p.markVisited('1', 'overview')
    p.recordAttempt('gen1-two-digit-addition', {
      at: '2026-09-27T09:30:00.000Z',
      correct: 8,
      total: 10,
      seconds: 95,
      mode: 'generated',
    })
    p.state.value.settings.fontSize = 22
    const text = p.exportJson()
    expect(JSON.parse(text)).toMatchObject({
      app: 'mentalmath',
      version: 1,
      progress: { settings: { fontSize: 22 } },
    })
    p.reset()
    expect(p.state.value.settings.fontSize).toBe(18)
    expect(p.importJson(text)).toBe(true)
    expect(p.state.value.settings.fontSize).toBe(22)
    expect(p.state.value.practice['gen1-two-digit-addition']?.best).toBe(8)
    expect(p.isVisited('1', 'overview')).toBe(true)
    expect(p.importJson('{"app":"other"}')).toBe(false)
    expect(p.importJson('not json')).toBe(false)
    expect(p.state.value.settings.fontSize).toBe(22)
  })
})
