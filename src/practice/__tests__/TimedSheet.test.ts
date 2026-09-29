import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TimedSheet from '../TimedSheet.vue'

describe('TimedSheet', () => {
  it('starts with ten problems and no shot clock, and emits the chosen options', async () => {
    const w = mount(TimedSheet, { attachTo: document.body })
    expect(w.find('[data-testid="len-10"]').attributes('aria-pressed')).toBe('true')
    expect(w.find('[data-testid="shot-0"]').attributes('aria-pressed')).toBe('true')
    await w.find('[data-testid="len-120"]').trigger('click')
    await w.find('[data-testid="shot-10"]').trigger('click')
    expect(w.find('[data-testid="timed-summary"]').text()).toBe('2 min sprint · 10 s per problem')
    await w.find('[data-testid="timed-start"]').trigger('click')
    expect(w.emitted('start')?.[0]).toEqual([{ sprint: 120, shot: 10 }])
    w.unmount()
  })
  it('closes without starting', async () => {
    const w = mount(TimedSheet, { attachTo: document.body })
    await w.find('[data-testid="timed-close"]').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
    expect(w.emitted('start')).toBeUndefined()
    w.unmount()
  })
})
