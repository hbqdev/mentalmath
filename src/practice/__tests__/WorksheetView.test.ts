import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { bookExercises } from '@/exercises/bookSets'
import '@/content/book-exercises'
import WorksheetView from '../WorksheetView.vue'

describe('WorksheetView', () => {
  const exercises = bookExercises('ch3-multiplying-by-11') // 35, 48, 94 × 11

  it('shows every problem at once and checks them in any order', async () => {
    const w = mount(WorksheetView, { props: { exercises } })
    expect(w.findAll('[data-testid^="sheet-item-"]').length).toBe(3)
    expect(w.find('[data-testid="sheet-progress"]').text()).toContain('0 / 3')
    await w.find('[data-testid="sheet-input-3"]').setValue('1034')
    await w.find('[data-testid="sheet-check-3"]').trigger('click')
    expect(w.find('[data-testid="sheet-verdict-3"]').text()).toContain('Correct')
    await w.find('[data-testid="sheet-input-1"]').setValue('300')
    await w.find('[data-testid="sheet-check-1"]').trigger('click')
    expect(w.find('[data-testid="sheet-verdict-1"]').text()).toContain('385')
    expect(w.find('[data-testid="sheet-item-1"] [data-testid="solution-steps"]').exists()).toBe(
      true,
    ) // steps open on a miss
    await w.find('[data-testid="sheet-steps-1"]').trigger('click')
    expect(w.find('[data-testid="sheet-item-1"] [data-testid="solution-steps"]').exists()).toBe(
      false,
    )
    expect(w.find('[data-testid="sheet-progress"]').text()).toContain('2 / 3 answered · 1 correct')
    expect(w.emitted('done')).toBeUndefined()
  })

  it('checks all filled answers, reveals the rest and reports once', async () => {
    const w = mount(WorksheetView, { props: { exercises } })
    await w.find('[data-testid="sheet-input-2"]').setValue('528')
    await w.find('[data-testid="check-all"]').trigger('click')
    expect(w.find('[data-testid="sheet-verdict-2"]').text()).toContain('Correct')
    expect(w.find('[data-testid="sheet-verdict-1"]').exists()).toBe(false)
    await w.find('[data-testid="reveal-rest"]').trigger('click')
    expect(w.find('[data-testid="sheet-verdict-1"]').text()).toContain('385')
    expect(w.find('[data-testid="sheet-summary"]').text()).toContain('1 / 3')
    expect(w.emitted('done')?.length).toBe(1)
    expect(w.emitted('done')![0]![0]).toMatchObject({ correct: 1, total: 3 })
  })

  it('uses buttons for choice answers', async () => {
    const dates = bookExercises('ch9-a-day-for-any-date')
    const w = mount(WorksheetView, { props: { exercises: dates } })
    const first = dates[0]!
    if (first.answer.kind === 'choice') {
      await w
        .find(`[data-testid="sheet-choice-1-${first.answer.correct.toLowerCase()}"]`)
        .trigger('click')
      expect(w.find('[data-testid="sheet-verdict-1"]').text()).toContain('Correct')
    }
  })
})
