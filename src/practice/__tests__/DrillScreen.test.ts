import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createSession } from '@/exercises/session'
import DrillScreen from '../DrillScreen.vue'
import type { Exercise } from '@/exercises/types'

const ex: Exercise = {
  id: 'a',
  setId: 't',
  source: 'generated',
  difficulty: 'easy',
  prompt: { kind: 'binary', a: 47, b: 32, op: '+' },
  answer: { kind: 'integer', value: 79 },
  solution: { steps: ['47 + 30 = 77', '77 + 2 = 79'] },
}
const choiceEx: Exercise = {
  ...ex,
  id: 'b',
  prompt: { kind: 'divisible', n: 51, by: 3 },
  answer: { kind: 'choice', options: ['Yes', 'No'], correct: 'Yes' },
}

describe('DrillScreen', () => {
  it('types through the keypad, submits and shows feedback with steps on demand', async () => {
    const s = createSession([ex])
    const w = mount(DrillScreen, {
      props: { state: { ...s.state() }, seconds: 3, showTimer: true, title: 'Two-digit addition' },
    })
    expect(w.find('[data-testid="keypad"]').exists()).toBe(true)
    expect(w.find('[data-testid="drill-clock"]').text()).toBe('0:03')
    for (const k of ['7', '8', '9']) await w.find(`[data-testid="key-${k}"]`).trigger('click')
    await w.find('[data-testid="key-backspace"]').trigger('click')
    await w.find('[data-testid="key-backspace"]').trigger('click')
    await w.find('[data-testid="key-9"]').trigger('click')
    expect(w.find('[data-testid="drill-value"]').text()).toBe('79')
    await w.find('[data-testid="key-check"]').trigger('click')
    expect(w.emitted('submit')?.[0]).toEqual(['79'])
    s.submit('79')
    await w.setProps({ state: { ...s.state() } })
    expect(w.find('[data-testid="feedback"]').text()).toContain('Correct')
    expect(w.find('[data-testid="solution-steps"]').exists()).toBe(false)
    await w.find('[data-testid="drill-steps-toggle"]').trigger('click')
    expect(w.find('[data-testid="solution-steps"]').text()).toContain('47 + 30 = 77')
    await w.find('[data-testid="next-button"]').trigger('click')
    expect(w.emitted('next')?.length).toBe(1)
  })

  it('does not submit an empty answer and offers buttons for choices', async () => {
    const s = createSession([ex])
    const w = mount(DrillScreen, {
      props: { state: { ...s.state() }, seconds: 0, showTimer: false, title: 't' },
    })
    await w.find('[data-testid="key-check"]').trigger('click')
    expect(w.emitted('submit')).toBeUndefined()
    expect(w.find('[data-testid="drill-clock"]').exists()).toBe(false)
    const c = mount(DrillScreen, {
      props: {
        state: { ...createSession([choiceEx]).state() },
        seconds: 0,
        showTimer: false,
        title: 't',
      },
    })
    expect(c.find('[data-testid="keypad"]').exists()).toBe(false)
    await c.find('[data-testid="choice-no"]').trigger('click')
    expect(c.emitted('submit')?.[0]).toEqual(['No'])
  })
})
