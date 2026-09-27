import { describe, expect, it } from 'vitest'
import { chapterCompletion } from '../completion'
import { getChapterMeta } from '@/content/loader'

describe('chapterCompletion', () => {
  it('counts visited sections that belong to the chapter', () => {
    const meta = getChapterMeta('1')!
    expect(chapterCompletion(meta, undefined)).toEqual({
      done: 0,
      total: meta.sections.length,
      fraction: 0,
    })
    const two = chapterCompletion(meta, ['overview', 'left-to-right-addition', 'not-a-section'])
    expect(two.done).toBe(2)
    expect(two.fraction).toBeCloseTo(2 / meta.sections.length)
  })
  it('handles a missing chapter', () => {
    expect(chapterCompletion(undefined, ['x'])).toEqual({ done: 0, total: 0, fraction: 0 })
  })
})
